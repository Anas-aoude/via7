"use client";

import usePrice from "@/app/hooks/usePrice";

interface PriceProps {
  amount: number;
  className?: string;
  showLoading?: boolean;
}

export default function Price({
  amount,
  className,
  showLoading = true,
}: PriceProps) {
  const { formatted, loading } = usePrice(amount);

  if (loading && showLoading) {
    return (
      <span className={className}>
        ...
      </span>
    );
  }

  return (
    <span className={className}>
      {formatted}
    </span>
  );
}