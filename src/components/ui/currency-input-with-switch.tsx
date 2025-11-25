import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  formatCurrencyByType,
  parseCurrencyByType,
  convertVNDtoUSD,
  convertUSDtoVND
} from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type Currency = 'VND' | 'USD';

export interface CurrencyInputWithSwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number; // Always in USD (backend format)
  onChange?: (valueInUSD: number) => void;
  defaultCurrency?: Currency;
}

/**
 * Currency input component with VND/USD switcher
 * - Displays value in selected currency
 * - Stores value in USD (backend format)
 * - Automatically converts between currencies
 */
const CurrencyInputWithSwitch = React.forwardRef<HTMLInputElement, CurrencyInputWithSwitchProps>(
  ({ value, onChange, defaultCurrency = 'USD', className, ...props }, ref) => {
    const [currency, setCurrency] = React.useState<Currency>(defaultCurrency);
    const [displayValue, setDisplayValue] = React.useState<string>(() => {
      if (value === undefined || value === null || value === '') return '';

      // Convert USD (from backend) to display currency
      const displayAmount = currency === 'VND' ? convertUSDtoVND(value) : value;
      return formatCurrencyByType(displayAmount, currency);
    });

    const [isUserTyping, setIsUserTyping] = React.useState(false);

    // Update display value when prop value or currency changes (but not when user is typing)
    React.useEffect(() => {
      if (isUserTyping) return; // Don't update while user is typing

      if (value === undefined || value === null || value === '') {
        setDisplayValue('');
      } else {
        // Convert USD (from backend) to display currency
        const displayAmount = currency === 'VND' ? convertUSDtoVND(value) : value;
        setDisplayValue(formatCurrencyByType(displayAmount, currency));
      }
    }, [value, currency, isUserTyping]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      setIsUserTyping(true);

      if (currency === 'USD') {
        // For USD, allow raw input without immediate formatting
        // Only allow digits and one decimal point
        const cleaned = inputValue.replace(/[^\d.]/g, '');
        const parts = cleaned.split('.');
        let validInput = parts[0];
        if (parts.length > 1) {
          // Keep only first decimal point and limit to 2 decimal places
          validInput = parts[0] + '.' + parts.slice(1).join('').slice(0, 2);
        }

        setDisplayValue(validInput);

        // Parse and send to parent
        const numericValue = parseFloat(validInput) || 0;
        onChange?.(numericValue);
      } else {
        // For VND, format with spaces
        const formatted = formatCurrencyByType(
          parseCurrencyByType(inputValue, currency),
          currency
        );
        setDisplayValue(formatted);

        // Parse value in current currency
        const numericValue = parseCurrencyByType(inputValue, currency);

        // Convert to USD before sending to parent (backend expects USD)
        const valueInUSD = convertVNDtoUSD(numericValue);
        onChange?.(valueInUSD);
      }
    };

    const handleBlur = () => {
      setIsUserTyping(false);

      // Format USD value on blur
      if (currency === 'USD' && displayValue) {
        const numericValue = parseFloat(displayValue) || 0;
        setDisplayValue(formatCurrencyByType(numericValue, currency));
      }
    };

    const handleCurrencyChange = (newCurrency: Currency) => {
      setIsUserTyping(false);
      const currentNumeric = parseCurrencyByType(displayValue, currency);

      if (currentNumeric === 0) {
        setCurrency(newCurrency);
        setDisplayValue('');
        return;
      }

      // Convert current value to the new currency
      let convertedValue: number;
      if (currency === 'VND' && newCurrency === 'USD') {
        convertedValue = convertVNDtoUSD(currentNumeric);
      } else if (currency === 'USD' && newCurrency === 'VND') {
        convertedValue = convertUSDtoVND(currentNumeric);
      } else {
        convertedValue = currentNumeric;
      }

      setCurrency(newCurrency);
      setDisplayValue(formatCurrencyByType(convertedValue, newCurrency));
    };

    return (
      <div className="flex gap-2">
        <Input
          {...props}
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={className}
          placeholder={currency === 'USD' ? '49.99' : '1 225 000'}
        />
        <Select value={currency} onValueChange={handleCurrencyChange}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="VND">VNĐ</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }
);

CurrencyInputWithSwitch.displayName = "CurrencyInputWithSwitch";

export { CurrencyInputWithSwitch };
