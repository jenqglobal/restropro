import { create } from 'zustand';

export type PaymentGateway = 'stripe' | 'razorpay' | 'paypal' | 'payu' | 'none';

export interface PaymentSettings {
  enabledGateway: PaymentGateway;
  stripe?: {
    publicKey: string;
    secretKey: string;
    webhookSecret?: string;
  };
  razorpay?: {
    keyId: string;
    keySecret: string;
  };
  paypal?: {
    clientId: string;
    clientSecret: string;
    mode: 'sandbox' | 'live';
  };
  payu?: {
    merchantKey: string;
    salt: string;
    mode: 'test' | 'live';
  };
}

interface PaymentStore {
  settings: PaymentSettings;
  setSettings: (settings: PaymentSettings) => void;
  updateGateway: (gateway: PaymentGateway) => void;
}

export const usePaymentStore = create<PaymentStore>((set) => ({
  settings: {
    enabledGateway: 'none',
  },
  setSettings: (settings) => set({ settings }),
  updateGateway: (gateway) =>
    set((state) => ({
      settings: { ...state.settings, enabledGateway: gateway },
    })),
}));