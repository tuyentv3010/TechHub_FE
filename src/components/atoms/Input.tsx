"use client";
import React from "react";
import clsx from "clsx";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  fullWidth?: boolean;
}

const base = "border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring placeholder:text-muted-foreground text-sm bg-background text-foreground";

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input({ className, fullWidth, ...rest }, ref) {
  return <input ref={ref} className={clsx(base, "h-10 px-4", fullWidth && "w-full", className)} {...rest} />;
});

export default Input;

