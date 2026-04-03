import { randomBytes } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../lib/authOptions";

export const runtime = "nodejs";

const S3_REGION = "us-east-1";
const S3_ENDPOINT_DEFAULT = "https://s3.regru.cloud";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

function getS3Endpoint(): string {
  return (process.env.S3_ENDPOINT ?? S3_ENDPOINT_DEFAULT).replace(/\/$/, "");
}

function getS3Client(): S3Client | null {
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;

  if (!accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    region: S3_REGION,
    endpoint: getS3Endpoint(),
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });
}

/** Публичная ссылка для path-style: {base}/{bucket}/{key} */
function buildPublicObjectUrl(key: string): string | null {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) return null;

  const base =
    process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? getS3Endpoint();
  const path = key.split("/").map(encodeURIComponent).join("/");
  return `${base}/${bucket}/${path}`;
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { message: "Ожидался multipart/form-data с полем file" },
      { status: 415 },
    );
  }

  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "admin") {
    return NextResponse.json({ message: "Требуется вход администратора" }, { status: 401 });
  }

  const bucket = process.env.S3_BUCKET;
  const client = getS3Client();

  if (!bucket || !client) {
    return NextResponse.json(
      {
        message:
          "S3 не настроен: задайте S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY (опционально S3_ENDPOINT, S3_PUBLIC_BASE_URL).",
      },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "Некорректное тело запроса" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ message: "Ожидалось поле file с изображением" }, { status: 400 });
  }

  const mime = file.type || "application/octet-stream";
  if (!ALLOWED_IMAGE_TYPES.has(mime)) {
    return NextResponse.json(
      { message: "Допустимы только JPEG, PNG, WebP и GIF" },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { message: `Файл слишком большой (максимум ${MAX_FILE_BYTES / 1024 / 1024} МБ)` },
      { status: 400 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = EXT_BY_MIME[mime] ?? ".bin";
  const key = `menu/${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buf,
      ContentType: mime,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  const link = buildPublicObjectUrl(key);
  if (!link) {
    return NextResponse.json({ message: "Не удалось сформировать публичный URL" }, { status: 500 });
  }

  return NextResponse.json({ link }, { status: 200 });
}
