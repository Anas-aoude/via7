"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import useTranslation from "@/app/hooks/useTranslation";

const Logo = () => {
  const router = useRouter();
  const { language } = useTranslation();

  return (
    <Image
      src="/logo1.webp"
      alt="VIA7"
      width={200}
      height={70}
      priority
      onClick={() => router.push(`/${language}`)}
      className="cursor-pointer select-none w-[110px] h-auto md:w-[200px]"
    />
  );
};

export default Logo;