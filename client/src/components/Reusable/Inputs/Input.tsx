import React, { forwardRef, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { cn } from "../../../utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label?: string;
  placeholder?: string;
  type?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  hint?: string;
  hintTone?: "success" | "muted";
  disabled?: boolean;
  readOnly?: boolean;
  fieldSize?: "sm" | "md" | "lg";
  className?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      placeholder,
      type = "text",
      value,
      onChange,
      error,
      hint,
      hintTone = "muted",
      disabled = false,
      readOnly = false,
      fieldSize = "md",
      className,
      ...rest
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";

    const sizeCls =
      fieldSize === "sm"
        ? "px-2.5 py-1.5 text-sm"
        : fieldSize === "lg"
        ? "px-3.5 py-2.5 text-base"
        : "px-3 py-2 text-sm";

    const base =
      "h-10 w-full rounded-lg border bg-card border-card-border " +
      "text-[15px] text-text shadow-sm " +
      "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary " +
      "transition-all duration-200";

    const state = error
      ? "border-danger-border text-danger-text focus:ring-danger focus:border-danger"
      : disabled
      ? "cursor-not-allowed bg-card-muted opacity-50"
      : readOnly
      ? "cursor-default bg-card-muted"
      : "hover:bg-card-hover";

    return (
      <div className="relative flex flex-col gap-1">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wide text-text">
            {label}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            type={isPassword && showPassword ? "text" : type}
            value={value}
            placeholder={placeholder}
            onChange={onChange}
            disabled={disabled}
            readOnly={readOnly}
            className={cn(base, sizeCls, state, isPassword ? "pr-10" : "", className)}
            {...rest}
          />

          {isPassword && (
            <button
              type="button"
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2",
                "text-text",
                "transition-transform duration-150",
                disabled ? "cursor-not-allowed" : "hover:scale-105"
              )}
              onClick={() => !disabled && setShowPassword((prev) => !prev)}
              tabIndex={-1}
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          )}
        </div>

        {error ? (
          <p className="mt-0.5 text-xs font-medium text-danger-text">{error}</p>
        ) : hint ? (
          <p
            className={cn(
              "mt-0.5 text-xs font-medium",
              hintTone === "success" ? "text-success-text" : "text-card-text"
            )}
          >
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
