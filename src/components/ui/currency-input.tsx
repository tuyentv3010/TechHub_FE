import * as React from "react";
import { Input } from "@/components/ui/input";
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/utils";

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number | string;
  onChange?: (value: number) => void;
  onValueChange?: (formattedValue: string, numericValue: number) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, onValueChange, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState<string>(() => {
      if (value === undefined || value === null || value === '') return '';
      return formatCurrencyInput(value);
    });

    // Update display value when prop value changes
    React.useEffect(() => {
      if (value === undefined || value === null || value === '') {
        setDisplayValue('');
      } else {
        const numericValue = typeof value === 'string' ? parseCurrencyInput(value) : value;
        setDisplayValue(formatCurrencyInput(numericValue));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Format the input value
      const formatted = formatCurrencyInput(inputValue);
      setDisplayValue(formatted);

      // Parse back to number for callbacks
      const numericValue = parseCurrencyInput(inputValue);

      // Call callbacks
      onChange?.(numericValue);
      onValueChange?.(formatted, numericValue);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        className={className}
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
