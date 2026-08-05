"use client";

import { IconType } from "react-icons";

interface ButtonProps {
  label: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  outline?: boolean;
  small?: boolean;
  icon?: IconType;
  variant?: "primary" | "secondary" | "danger" | "ghost";
}

const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  outline,
  disabled,
  small,
  icon: Icon,
  variant = "primary",
}) => {
  const isOutline = outline || variant === "secondary";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative
        w-full
        rounded-md
        transition
        disabled:cursor-not-allowed
        disabled:opacity-70

        ${
        isOutline
          ? "border-2 border-primary bg-white text-foreground hover:bg-background"
          : ""
        }

        ${
        !isOutline && variant === "primary"
          ? "border-2 border-primary bg-primary text-white hover:bg-primary-hover hover:border-primary-hover"
          : ""
        }

        ${
        !isOutline && variant === "danger"
          ? "border-2 border-danger bg-danger text-white hover:opacity-90"
          : ""
        }

        ${
        !isOutline && variant === "ghost"
          ? "border-2 border-transparent bg-transparent text-foreground hover:bg-background"
          : ""
        }

        ${small ? "py-1 text-sm font-light" : "py-3 text-md font-semibold"}
      `}
    >
      {Icon && (
        <Icon
          size={24}
          className="
            absolute
            left-4
            top-1/2
            -translate-y-1/2
          "
        />
      )}

      {label}
    </button>
  );
};

export default Button;