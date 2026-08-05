"use client";

import { useEffect, useState } from "react";
import { IoChevronDown, IoCheckmark } from "react-icons/io5";

import useCurrency from "@/app/hooks/useCurrency";
import { Currency } from "@/app/context/CurrencyContext";

interface CurrencySwitcherProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const currencyOptions: {
  value: Currency;
  label: string;
  short: string;
  mobileShort: string;
}[] = [
    {
      value: "USD",
      label: "US Dollar",
      short: "$ USD",
      mobileShort: "$",
    },
    {
      value: "EUR",
      label: "Euro",
      short: "€ EUR",
      mobileShort: "€",
    },
    {
      value: "SYP",
      label: "Syrian Pound",
      short: "ل.س SYP",
      mobileShort: "ل.س",
    },
  ];

export default function CurrencySwitcher({
  isOpen,
  onToggle,
  onClose,
}: CurrencySwitcherProps) {
  const { currency, setCurrency } = useCurrency();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const currentCurrency =
    currencyOptions.find(
      (item) => item.value === currency
    ) || currencyOptions[0];

  const handleSelect = (value: Currency) => {
    setCurrency(value);
    onClose();
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
        <span className="md:hidden">
          {currentCurrency.mobileShort}
        </span>

        <span className="hidden md:inline">
          {currentCurrency.short}
        </span>

        <IoChevronDown
          size={14}
          className={`
            hidden
            md:block
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
            w-48
            rounded-2xl
            bg-white
            border
            border-neutral-200
            shadow-xl
            overflow-hidden
            z-50
          "
        >
          {currencyOptions.map((item) => {
            const active =
              currency === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() =>
                  handleSelect(item.value)
                }
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
                  ${
                  active
                    ? "bg-neutral-50 font-bold"
                    : "font-medium"
                  }
                `}
              >
                <span>
                  {item.label}
                </span>

                {active && (
                  <IoCheckmark size={18} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}