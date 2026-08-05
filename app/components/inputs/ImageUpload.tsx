"use client";

import Image from "next/image";
import { CldUploadWidget } from "next-cloudinary";
import { TbPhotoPlus } from "react-icons/tb";
import { IoClose } from "react-icons/io5";
import { Dispatch, SetStateAction } from "react";

declare global {
  var cloudinary: any;
}

interface ImageUploadProps {
  value: string[];
  onChange: Dispatch<SetStateAction<string[]>>;
}

const MAX_IMAGES = 10;

const ImageUpload: React.FC<ImageUploadProps> = ({ value, onChange }) => {
  const handleUpload = (result: any) => {
    const url = result?.info?.secure_url;

    if (!url) return;

    onChange((current) => {
      if (current.length >= MAX_IMAGES) {
        return current;
      }

      return [...current, url].slice(0, MAX_IMAGES);
    });
  };

  const handleRemove = (url: string) => {
    onChange((current) => current.filter((item) => item !== url));
  };

  const remainingSlots = Math.max(MAX_IMAGES - value.length, 0);

  return (
    <div className="flex flex-col gap-4">
      {remainingSlots > 0 && (
        <CldUploadWidget
          onSuccess={handleUpload}
          uploadPreset="syria_market"
          options={{
            maxFiles: remainingSlots,
            multiple: true,
            resourceType: "image",
            clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
            maxFileSize: 5 * 1024 * 1024,
            folder: "via7/listings",
          }}
        >
          {({ open }) => (
            <div
              onClick={() => open?.()}
              className="relative cursor-pointer hover:opacity-70 transition border-dashed border-2 p-16 border-neutral-300 flex flex-col justify-center items-center gap-4 text-neutral-600 rounded-xl"
            >
              <TbPhotoPlus size={50} />
              <div className="font-semibold text-lg">Click to upload photos</div>
              <div className="text-sm text-neutral-500">
                You can upload up to {MAX_IMAGES} photos
              </div>
            </div>
          )}
        </CldUploadWidget>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {value.map((url) => (
            <div
              key={url}
              className="relative aspect-square rounded-xl overflow-hidden"
            >
              <Image
                fill
                src={url}
                alt="Uploaded image"
                className="object-cover"
              />

              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:scale-110 transition"
              >
                <IoClose size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;