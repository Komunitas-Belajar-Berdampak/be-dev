'use strict';

const Groq = require('groq-sdk');

let _client = null;

const getClient = () => {
    if (!_client) {
        if (!process.env.GROQ_API_KEY) {
            throw new Error('GROQ_API_KEY tidak dikonfigurasi di environment variables');
        }
        _client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return _client;
};

const isEnabled = () => !!process.env.GROQ_API_KEY;

// Ekstrak plain text dari TipTap JSON (konten post/deskripsi)
const extractTextFromTiptap = (node) => {
    if (!node || typeof node !== 'object') return '';
    if (node.type === 'text' && typeof node.text === 'string') return node.text;
    if (Array.isArray(node.content)) {
        return node.content.map(extractTextFromTiptap).join(' ');
    }
    return '';
};

/**
 * Nilai kualitas konten post dan kembalikan skor poin (0-25).
 * Skor 0 = ditolak (spam/kosong/asal). Skor 1-25 = diterima dengan poin sesuai kualitas.
 * Jika AI tidak tersedia, fallback ke skor default 10.
 *
 * Rubrik skor:
 *  0     = spam, lorem ipsum, karakter acak, kosong, atau terlalu singkat (< 5 kata)
 *  1-8   = ada teks tapi sangat dangkal / minim kontribusi
 *  9-16  = kontribusi cukup, ada pendapat atau informasi relevan
 *  17-25 = kontribusi berkualitas, analisis mendalam, argumen kuat
 *
 * @param {object} konten - TipTap JSON content
 * @param {string} threadJudul - Judul thread (untuk konteks topik)
 * @returns {Promise<{score: number, reason: string}>}
 */
const validatePostContent = async (konten, threadJudul) => {
    if (!isEnabled()) return { score: 10, reason: '' };

    const text = extractTextFromTiptap(konten).trim().replace(/\s+/g, ' ');

    // Tolak langsung tanpa panggil API jika kosong atau < 5 kata
    if (text.length === 0) {
        return { score: 0, reason: 'Konten tidak boleh kosong' };
    }
    if (text.split(/\s+/).filter(Boolean).length < 5) {
        return { score: 0, reason: 'Terlalu singkat. Minimal 5 kata untuk mendapat poin kontribusi' };
    }

    try {
        const client = getClient();
        const completion = await client.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            temperature: 0,
            response_format: { type: 'json_object' },
            messages: [
                {
                    role: 'system',
                    content: `Kamu adalah penilai kualitas kontribusi diskusi akademik kelompok belajar.
Berikan skor 0-25 berdasarkan kualitas dan relevansi konten post.

Balas HANYA dengan JSON:
{"score": <angka 0-25>, "reason": "alasan singkat dalam Bahasa Indonesia"}

Panduan skor:
- 0     : Spam, karakter acak (asdfgh, aaaa), lorem ipsum/placeholder text, tidak bermakna sama sekali
- 1-8   : Ada teks tapi sangat dangkal, hanya persetujuan singkat tanpa alasan, tidak menambah nilai diskusi
- 9-16  : Kontribusi cukup, ada pendapat atau informasi yang relevan dengan topik
- 17-25 : Kontribusi berkualitas tinggi, ada analisis, argumen, penjelasan mendalam, atau pertanyaan kritis

Contoh skor 0: "lorem ipsum dolor sit amet", "asdfghjkl", "iya iya iya oke sip noted"
Contoh skor 1-8: "Oke saya setuju dengan pendapat di atas"
Contoh skor 9-16: "Menurut saya poin ketiga paling penting karena berkaitan langsung dengan tugas kita"
Contoh skor 17-25: "Saya tidak setuju dengan poin kedua karena berdasarkan referensi yang saya baca, konsep ini sebenarnya..."`,
                },
                {
                    role: 'user',
                    content: `Topik thread: "${threadJudul}"\n\nIsi post:\n${text.slice(0, 800)}`,
                },
            ],
        });

        const raw = completion.choices[0].message.content;
        const result = JSON.parse(raw);
        const score = Math.min(25, Math.max(0, Math.round(Number(result.score) || 0)));
        return { score, reason: result.reason || '' };
    } catch {
        // Jika AI gagal, beri skor default agar sistem tidak terganggu
        return { score: 10, reason: '' };
    }
};

/**
 * Analisis kontribusi anggota kelompok dan rekomendasikan nilai per member.
 * Melempar error jika AI tidak tersedia.
 *
 * @param {object} params
 * @param {string} params.groupName
 * @param {string} [params.threadJudul]
 * @param {Array<{nrp, nama, kontribusi, jumlahPost, jumlahTaskSelesai}>} params.members
 * @returns {Promise<object>}
 */
const analyzeGroupContributions = async ({ groupName, threadJudul, members }) => {
    if (!isEnabled()) {
        throw new Error('Fitur AI tidak tersedia: GROQ_API_KEY belum dikonfigurasi');
    }

    const memberLines = members
        .map(
            (m) =>
                `- ${m.nama} (${m.nrp}): ${m.kontribusi} poin kontribusi | ${m.jumlahPost} post | ${m.jumlahTaskSelesai} task selesai`,
        )
        .join('\n');

    const client = getClient();
    const completion = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
            {
                role: 'system',
                content: `Kamu adalah asisten dosen untuk analisis kontribusi kelompok mahasiswa.
Berikan analisis objektif dan adil berdasarkan data poin, jumlah post, dan task yang diselesaikan.

Balas HANYA dengan JSON format berikut (tanpa teks lain):
{
  "ringkasan": "deskripsi singkat distribusi kontribusi kelompok",
  "distribusi": "merata" | "tidak_merata",
  "peringatan": "catatan penting untuk dosen, atau null jika tidak ada",
  "anggota": [
    {
      "nrp": "nomor induk mahasiswa",
      "nama": "nama lengkap",
      "rekomendasiNilai": 0-100,
      "catatan": "alasan rekomendasi nilai singkat"
    }
  ]
}`,
            },
            {
                role: 'user',
                content: `Kelompok: ${groupName}
Thread/Tugas: ${threadJudul || 'Semua aktivitas kelompok'}

Data kontribusi anggota:
${memberLines}

Analisis distribusi kontribusi dan rekomendasikan nilai per anggota (0-100) berdasarkan proporsi kontribusi masing-masing.`,
            },
        ],
    });

    const raw = completion.choices[0].message.content;
    return JSON.parse(raw);
};

module.exports = {
    isEnabled,
    validatePostContent,
    analyzeGroupContributions,
    extractTextFromTiptap,
};
