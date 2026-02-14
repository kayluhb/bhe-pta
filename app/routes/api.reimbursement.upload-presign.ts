import type { Route } from "./+types/api.reimbursement.upload-presign";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function action({ request, context }: Route.ActionArgs) {
  try {
    const { filename, contentType, fileSize } = (await request.json()) as {
      filename: string;
      contentType: string;
      fileSize: number;
    };

    // Validate file type
    if (!ALLOWED_TYPES.includes(contentType)) {
      return Response.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, PDF" },
        { status: 400 }
      );
    }

    // Validate file size
    if (fileSize > MAX_FILE_SIZE) {
      return Response.json(
        { error: "File too large. Maximum 10MB" },
        { status: 400 }
      );
    }

    // Generate unique key
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `uploads/${timestamp}-${crypto.randomUUID()}-${sanitizedFilename}`;

    const env = context.cloudflare.env;

    if (env.R2_BUCKET && env.R2_ACCESS_KEY_ID) {
      // Production: Use R2 presigned URL
      const { S3Client, PutObjectCommand } = await import(
        "@aws-sdk/client-s3"
      );
      const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

      const s3 = new S3Client({
        region: "auto",
        endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: env.R2_ACCESS_KEY_ID,
          secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        },
      });

      const command = new PutObjectCommand({
        Bucket: "pta-reimbursement-uploads",
        Key: key,
        ContentType: contentType,
        ContentLength: fileSize,
      });

      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

      return Response.json({
        uploadUrl,
        key,
        expiresIn: 300,
      });
    }

    // Development: Return mock response
    return Response.json({
      uploadUrl: `/api/reimbursement/upload-mock?key=${encodeURIComponent(key)}`,
      key,
      expiresIn: 300,
      development: true,
    });
  } catch (error) {
    console.error("Presign error:", error);
    return Response.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
