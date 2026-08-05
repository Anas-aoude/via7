"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IoChevronDown, IoCheckmark } from "react-icons/io5";

import useLanguage from "@/app/hooks/useLanguage";
import { Language } from "@/app/context/LanguageContext";

interface LanguageSwitcherProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const languageOptions: {
  value: Language;
  label: string;
  short: string;
  flag: string;
}[] = [
    { value: "ar", label: "العربية", short: "AR", flag: "/flags/sy.svg" },
    { value: "en", label: "English", short: "EN", flag: "/flags/gb.svg" },
    { value: "de", label: "Deutsch", short: "DE", flag: "/flags/de.svg" },
  ];

const locales = ["ar", "en", "de"];

const getPathWithoutLocale = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length > 0 && locales.includes(segments[0])) {
    return `/${segments.slice(1).join("/")}`;
  }

  return pathname;
};

export default function LanguageSwitcher({
  isOpen,
  onToggle,
  onClose,
}: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentLanguage =
    languageOptions.find((item) => item.value === language) ||
    languageOptions[0];

  const handleSelect = (value: Language) => {
    const pathWithoutLocale = getPathWithoutLocale(pathname || "/");
    const queryString = searchParams?.toString() ?? "";

    const nextPath =
      pathWithoutLocale === "/"
        ? `/${value}`
        : `/${value}${pathWithoutLocale}`;

    const nextUrl = queryString ? `${nextPath}?${queryString}` : nextPath;

    setLanguage(value);
    onClose();
    router.push(nextUrl);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="
    flex
    items-center
    gap-2
    p-2
    md:px-3
    md:py-2
    rounded-full
    border
    border-neutral-200
    bg-white
    hover:shadow-md
    transition
    text-sm
    font-semibold
  "
      >
        <Image
          src={currentLanguage.flag}
          alt={currentLanguage.label}
          width={24}
          height={16}
          className="rounded-[3px] object-cover"
        />

        <span className="hidden md:inline">
          {currentLanguage.short}
        </span>

        <IoChevronDown
          size={14}
          className={`
      hidden md:block
      transition
      ${isOpen ? "rotate-180" : ""}
    `}
        />
      </button>

      {isOpen && (
        <div
          className="
            absolute
            right-0
            mt-2
            w-44
            rounded-2xl
            bg-white
            border
            border-neutral-200
            shadow-xl
            overflow-hidden
            z-50
          "
        >
          {languageOptions.map((item) => {
            const active = language === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => handleSelect(item.value)}
                className={`
                  w-full
                  flex
                  items-center
                  justify-between
                  px-4
                  py-3
                  text-sm
                  hover:bg-neutral-100
                  transition
                  ${active ? "bg-neutral-50 font-bold" : "font-medium"}
                `}
              >
                <div className="flex items-center gap-3">
                  <Image
                    src={item.flag}
                    alt={item.label}
                    width={24}
                    height={16}
                    className="rounded-[3px] object-cover"
                  />
                  <span>{item.label}</span>
                </div>

                {active && <IoCheckmark size={18} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}