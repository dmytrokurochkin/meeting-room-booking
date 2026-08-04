import { type InputHTMLAttributes, forwardRef } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid = false, className = "", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid}
      className={`focus-ring h-10 rounded-lg border bg-surface px-3 text-sm text-foreground placeholder:text-muted ${
        invalid ? "border-danger" : "border-border"
      } ${className}`}
      {...props}
    />
  );
});
