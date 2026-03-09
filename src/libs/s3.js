const { randomUUID } = require('crypto');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const config = require('../config');

const s3 = new S3Client({
    region: 'auto',
    endpoint: config.s3.endpoint,
    credentials: {
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
    },
});

const getPublicUrl = (key) => `${config.s3.publicUrl}/${key}`;

const generatePresignedPutUrl = async (key, contentType, expiresIn = 300) => {
    const command = new PutObjectCommand({
        Bucket: config.s3.bucket,
        Key: key,
        ContentType: contentType,
    });
    return getSignedUrl(s3, command, { expiresIn });
};

const uploadBuffer = async (key, buffer, contentType) => {
    const command = new PutObjectCommand({
        Bucket: config.s3.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    });
    await s3.send(command);
    return getPublicUrl(key);
};

const deleteObject = async (key) => {
    const command = new DeleteObjectCommand({
        Bucket: config.s3.bucket,
        Key: key,
    });
    await s3.send(command);
};

// Upload a multer file object directly to S3, returns public URL
const uploadFile = async (multerFile, folder) => {
    const ext = multerFile.originalname.split('.').pop()?.toLowerCase();
    const key = ext ? `${folder}/${randomUUID()}.${ext}` : `${folder}/${randomUUID()}`;
    return uploadBuffer(key, multerFile.buffer, multerFile.mimetype);
};

module.exports = { getPublicUrl, generatePresignedPutUrl, uploadBuffer, uploadFile, deleteObject };
