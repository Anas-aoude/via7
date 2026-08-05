import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

import getCurrentUser from "@/app/actions/users/getCurrentUser";
import { RateLimitService } from "@/app/services/rate-limit";
import { verifyRequestOrigin } from "@/app/libs/security/verifyRequestOrigin";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const maxFileSize = 10 * 1024 * 1024;

const getResourceType = (type: string) => {
  return type.startsWith("image/") ? "image" : "raw";
};

const sanitizeFileName = (name: string) => {
  return name
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 100);
};

const isValidFileSignature = (buffer: Buffer, type: string) => {
  if (type === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (type === "image/png") {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }

  if (type === "image/webp") {
    return (
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    );
  }

  if (type === "application/pdf") {
    return buffer.toString("ascii", 0, 4) === "%PDF";
  }

  // DOC / DOCX يصعب فحصها بدقة هنا، نعتمد على Cloudinary + mime + size
  return true;
};

export async function POST(request: Request) {
  try {
    const originError = verifyRequestOrigin(request);

      if (originError) {
        return originError;
      }

    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.isBanned) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await RateLimitService.uploads(currentUser.id);

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many uploads. Please try again later." },
        { status: 429 }
      );
    }

    const contentLength = request.headers.get("content-length");

    if (contentLength && Number(contentLength) > maxFileSize + 1024 * 1024) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      );
    }

    if (file.size <= 0 || file.size > maxFileSize) {
      return NextResponse.json(
        { error: "File must be smaller than 10MB" },
        { status: 400 }
      );
    }

    const safeFileName = sanitizeFileName(file.name || "attachment");

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!isValidFileSignature(buffer, file.type)) {
      return NextResponse.json(
        { error: "Invalid file content" },
        { status: 400 }
      );
    }

    const uploadedFile = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `via7/chat/${currentUser.id}`,
            resource_type: getResourceType(file.type),
            use_filename: true,
            unique_filename: true,
            filename_override: safeFileName,
            access_mode: "public",
          },
          (error, result) => {
            if (error || !result) {
              reject(error || new Error("Upload failed"));
              return;
            }

            resolve(result);
          }
        )
        .end(buffer);
    });

    return NextResponse.json({
      url: uploadedFile.secure_url,
      type: file.type,
      name: safeFileName,
      size: file.size,
    });
  } catch (error) {
    console.log("[CHAT_ATTACHMENTS_POST]", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}