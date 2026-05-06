import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MarketConfig {
  market: string;
  currency: string;
  currencySymbol: string;
  dateFormat: string;
  timeFormat: string;
}

interface SettingsState {
  marketConfig: MarketConfig;
  setMarket: (market: string) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
  formatTime: (date: Date) => string;
}

const marketConfigs: Record<string, { currency: string; currencySymbol: string; dateFormat: string; timeFormat: string }> = {
  india: { currency: 'INR', currencySymbol: '£', dateFormat: 'DD/MM/YYYY', timeFormat: '12h' },
  us: { currency: 'USD', currencySymbol: '$', dateFormat: 'MM/DD/YYYY', timeFormat: '12h' },
  uk: { currency: 'GBP', currencySymbol: '£', dateFormat: 'DD/MM/YYYY', timeFormat: '24h' },
  uae: { currency: 'AED', currencySymbol: 'د.إ', dateFormat: 'DD/MM/YYYY', timeFormat: '24h' },
  europe: { currency: 'EUR', currencySymbol: '€', dateFormat: 'DD/MM/YYYY', timeFormat: '24h' },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      marketConfig: {
        market: 'india',
        currency: 'INR',
        currencySymbol: '£',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '12h',
      },

      setMarket: (market: string) => {
        const config = marketConfigs[market];
        if (config) {
          set({
            marketConfig: {
              market,
              ...config,
            },
          });
        }
      },

      formatCurrency: (amount: number) => {
        const { currencySymbol } = get().marketConfig;
        return `${currencySymbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      },

      formatDate: (date: Date) => {
        const { dateFormat } = get().marketConfig;
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        
        switch (dateFormat) {
          case 'MM/DD/YYYY':
            return `${m}/${d}/${y}`;
          case 'DD/MM/YYYY':
          default:
            return `${d}/${m}/${y}`;
        }
      },

      formatTime: (date: Date) => {
        const { timeFormat } = get().marketConfig;
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        if (timeFormat === '12h') {
          hours = hours % 12 || 12;
          return `${hours}:${minutes} ${ampm}`;
        } else {
          return `${hours.toString().padStart(2, '0')}:${minutes}`;
        }
      },
    }),
    {
      name: 'restropro-settings',
    }
  )
);