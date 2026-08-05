"use client";

import Image from "next/image";
import { useState } from "react";
import { IoClose } from "react-icons/io5";
import { FiChevronLeft, FiChevronRight, FiShare } from "react-icons/fi";
import { AiOutlineHeart } from "react-icons/ai";

import useTranslation from "@/app/hooks/useTranslation";

interface ImageGalleryProps {
  title: string;
  images: string[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ title, images }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const mainImage = images[0] || "/images/placeholder.jpg";
  const sideImages = images.slice(1, 5);

  const openViewer = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
  };

  const onNext = () => {
    setCurrentIndex((value) => {
      if (value === images.length - 1) return 0;
      return value + 1;
    });
  };

  const onPrevious = () => {
    setCurrentIndex((value) => {
      if (value === 0) return images.length - 1;
      return value - 1;
    });
  };

  return (
    <>
      <div className="relative mb-10">
        <div
          className={`
            grid
            gap-2
            h-[55vh]
            ${
            images.length === 1
              ? "grid-cols-1"
              : "grid-cols-1 md:grid-cols-4"
            }
          `}
        >
          <div
            onClick={() => openViewer(0)}
            className={`
              relative
              overflow-hidden
              cursor-pointer
              ${
              images.length === 1
                ? "rounded-2xl"
                : "md:col-span-2 md:row-span-2 md:rounded-l-2xl"
              }
            `}
          >
            <Image
              fill
              src={mainImage}
              alt={title}
              className="object-cover hover:scale-105 transition"
            />
          </div>

          {sideImages.map((image, index) => (
            <div
              key={image}
              onClick={() => openViewer(index + 1)}
              className={`
                relative
                overflow-hidden
                hidden
                md:block
                cursor-pointer
                ${index === 1 ? "rounded-tr-2xl" : ""}
                ${index === sideImages.length - 1 ? "rounded-br-2xl" : ""}
              `}
            >
              <Image
                fill
                src={image}
                alt={`${title} image ${index + 2}`}
                className="object-cover hover:scale-105 transition"
              />
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <button
            onClick={() => openViewer(0)}
            className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg shadow-md font-semibold hover:bg-neutral-100 transition"
          >
            {t("listingDetails.showAllPhotos")}
          </button>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[9999] bg-black text-white">
          <div className="absolute top-0 left-0 right-0 z-10 px-8 py-6 flex items-center justify-between">
            <button
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 text-white hover:opacity-70 transition"
            >
              <IoClose size={26} />
              <span className="font-medium">
                {t("listingDetails.close")}
              </span>
            </button>

            <div className="text-lg font-medium">
              {currentIndex + 1} / {images.length}
            </div>

            <div className="flex items-center gap-6">
              <button className="hover:opacity-70 transition">
                <FiShare size={22} />
              </button>

              <button className="hover:opacity-70 transition">
                <AiOutlineHeart size={24} />
              </button>
            </div>
          </div>

          {images.length > 1 && (
            <>
              <button
                onClick={onPrevious}
                className="
                  absolute
                  left-8
                  top-1/2
                  -translate-y-1/2
                  z-10
                  w-14
                  h-14
                  rounded-full
                  border
                  border-white
                  flex
                  items-center
                  justify-center
                  hover:bg-white
                  hover:text-black
                  transition
                "
              >
                <FiChevronLeft size={28} />
              </button>

              <button
                onClick={onNext}
                className="
                  absolute
                  right-8
                  top-1/2
                  -translate-y-1/2
                  z-10
                  w-14
                  h-14
                  rounded-full
                  border
                  border-white
                  flex
                  items-center
                  justify-center
                  hover:bg-white
                  hover:text-black
                  transition
                "
              >
                <FiChevronRight size={28} />
              </button>
            </>
          )}

          <div className="w-full h-full flex items-center justify-center px-28 pt-24 pb-16">
            <div className="relative w-[640px] max-w-[70vw] h-[78vh]">
              <Image
                fill
                src={images[currentIndex] || mainImage}
                alt={`${title} photo ${currentIndex + 1}`}
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageGallery;