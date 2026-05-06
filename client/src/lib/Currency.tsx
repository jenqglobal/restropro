import { useCurrencyStore } from './stores/currencyStore';

interface CurrencyProps {
  amount: number;
  className?: string;
}

export function Currency({ amount, className }: CurrencyProps) {
  const symbol = useCurrencyStore((state) => state.symbol);
  return <span className={className}>{symbol}{amount.toFixed(2)}</span>;
}