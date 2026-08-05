"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import useTranslation from "../../hooks/useTranslation";
import { TranslationKey } from "../../libs/translations";

const categories: {
  label: string;
  translationKey: TranslationKey;
  icon: string;
}[] = [
    { label: "Apartment", translationKey: "categories.apartment", icon: "🏢" },
    { label: "House", translationKey: "categories.house", icon: "🏠" },
    { label: "Villa", translationKey: "categories.villa", icon: "🏡" },
    { label: "Cabin", translationKey: "categories.cabin", icon: "🛖" },
    { label: "Hotel", translationKey: "categories.hotel", icon: "🏨" },
    { label: "Tourism", translationKey: "categories.tourism", icon: "🏕️" },
    { label: "Land", translationKey: "categories.land", icon: "🏗️" },
    { label: "Farm", translationKey: "categories.farm", icon: "🌾" },
    { label: "Office", translationKey: "categories.office", icon: "🏢" },
    { label: "Shop", translationKey: "categories.shop", icon: "🏬" },
    { label: "Restaurant", translationKey: "categories.restaurant", icon: "🍽️" },
    { label: "Warehouse", translationKey: "categories.warehouse", icon: "📦" },
    { label: "Factory", translationKey: "categories.factory", icon: "🏭" },
  ];

const Categories = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t, language } = useTranslation();

  const selectedCategory = searchParams?.get("category");

  const onClick = (category: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");

    if (selectedCategory === category) {
      params.delete("category");
    } else {
      params.set("category", category);
    }

    params.delete("page");

    const queryString = params.toString();
    const searchPath = `/${language}/search`;
    const homePath = `/${language}`;

    if (!queryString && pathname === searchPath) {
      router.push(homePath);
      return;
    }

    router.push(queryString ? `${searchPath}?${queryString}` : searchPath);
  };

  return (
    <div className="w-screen border-b-[1px]">
      <div
        className="
    flex
    flex-row
    items-center
    gap-3
    overflow-x-auto
    px-4
    pt-4
    md:justify-between
    md:gap-8
    md:px-12
  "
      >
        {categories.map((item) => (
          <div
            key={item.label}
            onClick={() => onClick(item.label)}
            className={`
              flex
              flex-col
              items-center
              justify-center
              gap-2
              p-3
              border-b-2
              cursor-pointer
              transition
              whitespace-nowrap
              shrink-0
              ${
              selectedCategory === item.label
                ? "border-black text-black"
                : "border-transparent text-neutral-500 hover:text-neutral-800 hover:border-neutral-300"
              }
            `}
          >
            <div className="text-3xl">{item.icon}</div>
            <div className="font-medium text-sm">{t(item.translationKey)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories;