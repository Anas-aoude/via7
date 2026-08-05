"use client";

import Image from "next/image";
import { CldUploadWidget } from "next-cloudinary";
import { TbPhotoPlus } from "react-icons/tb";
import { IoClose } from "react-icons/io5";
import { FaUserCircle } from "react-icons/fa";

interface AvatarUploadProps {
  value: string;
  onChange: (value: string) => void;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ value, onChange }) => {
  const handleUpload = (result: any) => {
    const url = result?.info?.secure_url;

    if (!url) return;

    onChange(url);
  };

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-36 h-36 rounded-full overflow-hidden bg-neutral-100 border">
        {value ? (
          <Image fill src={value} alt="Profile image" className="object-cover" />
        ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FaUserCircle size={90} className="text-neutral-400" />
            </div>
          )}

        {value && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:scale-110 transition"
          >
            <IoClose size={18} />
          </button>
        )}
      </div>

      <CldUploadWidget
        onSuccess={handleUpload}
        uploadPreset="syria_market"
        options={{
          maxFiles: 1,
          multiple: false,
          resourceType: "image",
          clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
          maxFileSize: 3 * 1024 * 1024,
          cropping: true,
          croppingAspectRatio: 1,
          croppingShowDimensions: true,
          folder: "via7/avatars",
        }}
      >
        {({ open }) => (
          <button
            type="button"
            onClick={() => open?.()}
            className="
              px-5
              py-3
              rounded-xl
              border
              font-semibold
              hover:bg-neutral-50
              transition
              flex
              items-center
              gap-2
            "
          >
            <TbPhotoPlus size={20} />
            {value ? "Change photo" : "Upload photo"}
          </button>
        )}
      </CldUploadWidget>
    </div>
  );
};

export default AvatarUpload;