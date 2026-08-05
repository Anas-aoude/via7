"use client";

interface CounterProps {
  title: string;
  subtitle?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

const Counter: React.FC<CounterProps> = ({
  title,
  subtitle,
  value,
  onChange,
  min = 0,
  max = 50,
}) => {
  const onIncrease = () => {
    if (value >= max) return;
    onChange(value + 1);
  };

  const onDecrease = () => {
    if (value <= min) return;
    onChange(value - 1);
  };

  return (
    <div className="flex items-center justify-between py-5 border-b">
      <div>
        <div className="font-semibold">{title}</div>

        {subtitle && (
          <div className="text-sm text-neutral-500 mt-1">{subtitle}</div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onDecrease}
          disabled={value <= min}
          className="
            w-10
            h-10
            rounded-full
            border
            flex
            items-center
            justify-center
            text-xl
            disabled:opacity-30
            disabled:cursor-not-allowed
            hover:border-black
            transition
          "
        >
          -
        </button>

        <div className="w-6 text-center font-semibold">{value}</div>

        <button
          type="button"
          onClick={onIncrease}
          disabled={value >= max}
          className="
            w-10
            h-10
            rounded-full
            border
            flex
            items-center
            justify-center
            text-xl
            disabled:opacity-30
            disabled:cursor-not-allowed
            hover:border-black
            transition
          "
        >
          +
        </button>
      </div>
    </div>
  );
};

export default Counter;