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
 * Validasi konten post sebelum poin kontribusi dikreditkan.
 * Jika AI tidak tersedia (key tidak dikonfigurasi atau error), fallback ke valid=true.
 *
 * @param {object} konten - TipTap JSON content
 * @param {string} threadJudul - Judul thread (untuk konteks topik)
 * @returns {Promise<{valid: boolean, reason: string}>}
 */
const validatePostContent = async (konten, threadJudul) => {
    if (!isEnabled()) return { valid: true, reason: '' };

    const text = extractTextFromTiptap(konten).trim().replace(/\s+/g, ' ');

    // Tolak langsung tanpa panggil API jika terlalu pendek
    if (text.length < 10) {
        return { valid: false, reason: 'Konten terlalu singkat atau tidak mengandung teks bermakna' };
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
                    content: `Kamu adalah validator konten diskusi akademik. Tugasmu menilai apakah sebuah post merupakan kontribusi yang bermakna dalam diskusi kelompok.

Balas HANYA dengan JSON berikut:
{"valid": true/false, "reason": "alasan singkat dalam Bahasa Indonesia"}

Post TIDAK VALID jika:
- Hanya berisi karakter/kata acak tanpa makna
- Spam atau pengulangan karakter (aaaaaa, 123123, dll)
- Hanya emoji atau simbol tanpa teks
- Sangat tidak relevan dengan topik diskusi
- Kurang dari 3 kata bermakna

Post VALID jika:
- Mengandung kalimat atau ide yang dapat dipahami
- Relevan dengan konteks diskusi akademik
- Menunjukkan upaya kontribusi nyata, meskipun singkat`,
                },
                {
                    role: 'user',
                    content: `Topik thread: "${threadJudul}"\n\nIsi post:\n${text.slice(0, 800)}`,
                },
            ],
        });

        const raw = completion.choices[0].message.content;
        const result = JSON.parse(raw);
        return { valid: !!result.valid, reason: result.reason || '' };
    } catch {
        // Jika AI gagal, izinkan post berlanjut agar sistem tidak terganggu
        return { valid: true, reason: '' };
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
