"use client";
import React from "react";
import clsx from "clsx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "pill";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const base = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-purple-600 hover:bg-purple-700 text-white focus-visible:ring-purple-600",
  secondary: "bg-black text-white hover:bg-gray-800 focus-visible:ring-black",
  ghost: "bg-transparent hover:bg-gray-100 text-gray-800 focus-visible:ring-gray-300 border border-transparent",
  pill: "bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 rounded-full",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "text-sm px-3 h-8",
  md: "text-sm px-4 h-10",
  lg: "text-base px-6 h-12",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", fullWidth, className, ...rest }, ref
) {
  return (
    <button
      ref={ref}
      className={clsx(base, variantClasses[variant], sizeClasses[size], fullWidth && "w-full", className)}
      {...rest}
    />
  );
});

export default Button;

