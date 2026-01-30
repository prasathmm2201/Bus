import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    region: process.env.S3_REGION!,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
    },
});

export async function uploadToS3(file: Buffer, fileName: string, contentType: string) {
    const bucketName = process.env.S3_BUCKET!;
    const key = `buses/${Date.now()}-${fileName}`;

    await s3Client.send(
        new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: file,
            ContentType: contentType,
        })
    );

    return `https://${bucketName}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
}

export async function deleteFromS3(fileUrl: string) {
    if (!fileUrl) return;

    try {
        const bucketName = process.env.S3_BUCKET!;
        // Extract key from URL: https://bucket.s3.region.amazonaws.com/key
        const urlObj = new URL(fileUrl);
        const key = urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname;

        await s3Client.send(
            new DeleteObjectCommand({
                Bucket: bucketName,
                Key: key,
            })
        );
    } catch (error) {
        console.error("Failed to delete from S3:", error);
    }
}
