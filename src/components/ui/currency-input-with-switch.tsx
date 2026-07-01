import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type Currency = "VND" | "USD";

export interface CurrencyInputWithSwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  /** Giá trị raw theo currency hiện tại (không tự convert). */
  value?: number;
  /** Currency hiện tại. Nếu không truyền sẽ dùng state nội bộ với defaultCurrency. */
  currency?: Currency;
  defaultCurrency?: Currency;
  onChange?: (value: number) => void;
  onCurrencyChange?: (currency: Currency) => void;
}

function formatNumber(value: number, currency: Currency): string {
  if (!Number.isFinite(value)) return "";
  if (currency === "USD") {
    return value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  return value.toLocaleString("vi-VN", { maximumFractionDigits: 0 });
}

function parseNumber(input: string): number {
  if (!input) return 0;
  const cleaned = input.replace(/[^\d.,]/g, "").replace(/\s/g, "");
  // Cho phép dấu phẩy hoặc chấm là decimal separator
  const normalized = cleaned.includes(",") && !cleaned.includes(".")
    ? cleaned.replace(",", ".")
    : cleaned.replace(/,/g, "");
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

const CurrencyInputWithSwitch = React.forwardRef<HTMLInputElement, CurrencyInputWithSwitchProps>(
  (
    {
      value,
      currency: currencyProp,
      defaultCurrency = "VND",
      onChange,
      onCurrencyChange,
      className,
      ...props
    },
    ref
  ) => {
    const [internalCurrency, setInternalCurrency] = React.useState<Currency>(defaultCurrency);
    const currency = currencyProp ?? internalCurrency;

    const [displayValue, setDisplayValue] = React.useState<string>(() =>
      value === undefined || value === null ? "" : formatNumber(value, currency)
    );
    const [isUserTyping, setIsUserTyping] = React.useState(false);

    React.useEffect(() => {
      if (isUserTyping) return;
      if (value === undefined || value === null) {
        setDisplayValue("");
      } else {
        setDisplayValue(formatNumber(value, currency));
      }
    }, [value, currency, isUserTyping]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsUserTyping(true);
      const raw = e.target.value;
      setDisplayValue(raw);
      onChange?.(parseNumber(raw));
    };

    const handleBlur = () => {
      setIsUserTyping(false);
      const numeric = parseNumber(displayValue);
      setDisplayValue(numeric ? formatNumber(numeric, currency) : "");
    };

    const handleCurrencyChange = (newCurrency: Currency) => {
      if (currencyProp === undefined) {
        setInternalCurrency(newCurrency);
      }
      onCurrencyChange?.(newCurrency);
    };

    return (
      <div className="flex gap-2">
        <Input
          {...props}
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={className}
          placeholder={currency === "USD" ? "49.99" : "1 225 000"}
        />
        <Select value={currency} onValueChange={(v) => handleCurrencyChange(v as Currency)}>
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
