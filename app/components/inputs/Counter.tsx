"use client";

import { AiOutlineMinus, AiOutlinePlus } from "react-icons/ai";

interface CounterProps {
  title: string;
  subtitle?: string;
  value: number;
  onChange: (value: number) => void;
}

const Counter: React.FC<CounterProps> = ({
  title,
  subtitle,
  value,
  onChange,
}) => {
  const onAdd = () => {
    onChange(value + 1);
  };

  const onReduce = () => {
    if (value <= 0) return;

    onChange(value - 1);
  };

  return (
    <div className="flex flex-row items-center justify-between">
      <div className="flex flex-col">
        <div className="font-medium">{title}</div>

        {subtitle && (
          <div className="font-light text-gray-600">
            {subtitle}
          </div>
        )}
      </div>

      <div className="flex flex-row items-center gap-4">
        <button
          type="button"
          onClick={onReduce}
          disabled={value <= 0}
          className="w-10 h-10 rounded-full border flex items-center justify-center text-neutral-600 hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <AiOutlineMinus />
        </button>

        <div className="font-light text-xl text-neutral-600">
          {value}
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="w-10 h-10 rounded-full border flex items-center justify-center text-neutral-600 hover:opacity-80"
        >
          <AiOutlinePlus />
        </button>
      </div>
    </div>
  );
};

export default Counter;