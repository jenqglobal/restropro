import { PaymentGateway, PaymentSettings } from './stores/paymentStore';

export interface PaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  paymentUrl?: string;
  error?: string;
}

const API_BASE = '/api';

const settings: PaymentSettings = {
  enabledGateway: 'razorpay',
  razorpay: {
    keyId: '',
    keySecret: '',
  },
};

async function fetchSettings(): Promise<PaymentSettings> {
  try {
    const res = await fetch(`${API_BASE}/settings/payment`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch {}
  return settings;
}

export const createStripePayment = async (req: PaymentRequest): Promise<PaymentResponse> => {
  const s = await fetchSettings();
  if (!s.stripe?.secretKey) {
    return { success: false, error: 'Stripe not configured' };
  }
  
  try {
    const res = await fetch(`${API_BASE}/payments/stripe/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(req),
    });
    const data = await res.json();
    if (data.clientSecret) {
      return { success: true, transactionId: data.clientSecret };
    }
    return { success: false, error: data.error || 'Payment failed' };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

export const createRazorpayPayment = async (req: PaymentRequest): Promise<PaymentResponse> => {
  const s = await fetchSettings();
  if (!s.razorpay?.keyId) {
    return { success: false, error: 'Razorpay not configured' };
  }
  
  try {
    const res = await fetch(`${API_BASE}/payments/razorpay/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(req),
    });
    const data = await res.json();
    if (data.orderId) {
      return { success: true, transactionId: data.orderId };
    }
    return { success: false, error: data.error || 'Payment failed' };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

export const createPayPalPayment = async (req: PaymentRequest): Promise<PaymentResponse> => {
  const s = await fetchSettings();
  if (!s.paypal?.clientId) {
    return { success: false, error: 'PayPal not configured' };
  }
  
  try {
    const res = await fetch(`${API_BASE}/payments/paypal/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(req),
    });
    const data = await res.json();
    if (data.approvalUrl) {
      return { success: true, paymentUrl: data.approvalUrl };
    }
    return { success: false, error: data.error || 'Payment failed' };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

export const createPayUPayment = async (req: PaymentRequest): Promise<PaymentResponse> => {
  const s = await fetchSettings();
  if (!s.payu?.merchantKey) {
    return { success: false, error: 'PayU not configured' };
  }
  
  try {
    const res = await fetch(`${API_BASE}/payments/payu/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(req),
    });
    const data = await res.json();
    if (data.paymentUrl) {
      return { success: true, paymentUrl: data.paymentUrl };
    }
    return { success: false, error: data.error || 'Payment failed' };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

export const createPayment = async (
  gateway: PaymentGateway,
  req: PaymentRequest
): Promise<PaymentResponse> => {
  switch (gateway) {
    case 'stripe':
      return createStripePayment(req);
    case 'razorpay':
      return createRazorpayPayment(req);
    case 'paypal':
      return createPayPalPayment(req);
    case 'payu':
      return createPayUPayment(req);
    default:
      return { success: false, error: 'No payment gateway configured' };
  }
};

export const verifyPayment = async (
  gateway: PaymentGateway,
  transactionId: string
): Promise<boolean> => {
  try {
    const res = await fetch(
      `${API_BASE}/payments/${gateway}/verify?transactionId=${transactionId}`,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      }
    );
    const data = await res.json();
    return data.verified;
  } catch {
    return false;
  }
};