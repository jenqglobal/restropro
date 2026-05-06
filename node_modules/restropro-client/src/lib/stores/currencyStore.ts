import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CurrencyState {
  currency: string;
  symbol: string;
  code: string;
  setCurrency: (currency: string) => void;
}

const currencies: Record<string, { symbol: string; code: string; name: string }> = {
  INR: { symbol: '£', code: 'INR', name: 'Indian Rupee' },
  USD: { symbol: '$', code: 'USD', name: 'US Dollar' },
  GBP: { symbol: '£', code: 'GBP', name: 'British Pound' },
  EUR: { symbol: '€', code: 'EUR', name: 'Euro' },
  AED: { symbol: 'د.إ', code: 'AED', name: 'UAE Dirham' },
};

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: 'GBP',
      symbol: '£',
      code: 'GBP',
      setCurrency: (currency) => {
        const curr = currencies[currency];
        if (curr) {
          set({ currency, symbol: curr.symbol, code: curr.code });
        }
      },
    }),
    { name: 'restropro-currency' }
  )
);

export const useCurrency = () => useCurrencyStore();

export const useFormattedCurrency = (amount: number): string => {
  const symbol = useCurrencyStore((state) => state.symbol);
  return `${symbol}${amount.toFixed(2)}`;
};

export const currencyOptions = Object.entries(currencies).map(([code, data]) => ({
  code,
  ...data,
}));