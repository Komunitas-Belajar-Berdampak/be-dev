const { nanoid } = require('nanoid');
const { generatePresignedPutUrl, getPublicUrl } = require('../../libs/s3');
const { ApiError } = require('../../utils/http');

const ALLOWED_FOLDERS = ['submissions', 'assignments', 'materials', 'profiles', 'private-files', 'groups/posts'];

const getExtension = (filename) => {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

const generatePresignedUpload = async ({ folder, filename, contentType }) => {
    if (!ALLOWED_FOLDERS.includes(folder)) {
        throw new ApiError(400, `Folder tidak valid. Pilihan: ${ALLOWED_FOLDERS.join(', ')}`);
    }

    const ext = getExtension(filename);
    const key = ext ? `${folder}/${nanoid()}.${ext}` : `${folder}/${nanoid()}`;

    const uploadUrl = await generatePresignedPutUrl(key, contentType);

    return {
        uploadUrl,
        key,
        fileUrl: getPublicUrl(key),
    };
};

module.exports = { generatePresignedUpload };
