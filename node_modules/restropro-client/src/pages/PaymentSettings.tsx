import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { CreditCard, Shield, Zap, DollarSign, Check } from 'lucide-react';
import { PaymentGateway } from '../lib/stores/paymentStore';

const gateways: { id: PaymentGateway; name: string; icon: string; regions: string; description: string }[] = [
  { id: 'razorpay', name: 'Razorpay', icon: '🇮🇳', regions: 'India', description: 'Accept payments across India with UPI, Cards, Wallets' },
  { id: 'stripe', name: 'Stripe', icon: '💳', regions: 'Global (US, UK, EU)', description: 'Global payment platform for 135+ currencies' },
  { id: 'paypal', name: 'PayPal', icon: '🅿️', regions: 'Global', description: 'Trusted by millions worldwide' },
  { id: 'payu', name: 'PayU', icon: '🌐', regions: 'India, EU, LATAM', description: 'Payment solutions for emerging markets' },
];

interface PaymentSettingsData {
  enabledGateway: PaymentGateway;
  stripe?: { publicKey: string; secretKey: string };
  razorpay?: { keyId: string; keySecret: string };
  paypal?: { clientId: string; clientSecret: string; mode: 'sandbox' | 'live' };
  payu?: { merchantKey: string; salt: string; mode: 'test' | 'live' };
}

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState<PaymentSettingsData>({
    enabledGateway: 'none',
  });
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['payment-settings'],
    queryFn: async () => {
      const res = await api.get('/settings/payment');
      if (res.data?.enabledGateway) {
        setSettings(res.data);
      }
      return res.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (newSettings: PaymentSettingsData) => {
      const res = await api.put('/settings/payment', newSettings);
      return res.data;
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">Payment Settings</h1>
        <p className="text-black/70 mt-1">Configure payment gateways for your restaurant</p>
      </div>

      {/* Gateway Selection */}
      <div className="glass-card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Select Payment Gateway</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {gateways.map((gw) => (
            <button
              key={gw.id}
              onClick={() => setSettings({ ...settings, enabledGateway: gw.id })}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                settings.enabledGateway === gw.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-2xl mb-2">{gw.icon}</div>
              <div className="font-medium text-black">{gw.name}</div>
              <div className="text-xs text-black/60">{gw.regions}</div>
              {settings.enabledGateway === gw.id && (
                <Check className="w-4 h-4 text-indigo-600 mt-2" />
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSettings({ ...settings, enabledGateway: 'none' })}
          className={`mt-4 px-4 py-2 rounded-lg border-2 transition-all ${
            settings.enabledGateway === 'none'
              ? 'border-slate-400 bg-slate-100'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          Disable Payment Gateway
        </button>
      </div>

      {/* Stripe Configuration */}
      {settings.enabledGateway === 'stripe' && (
        <div className="glass-card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Stripe Configuration</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="input-label">Publishable Key</label>
              <input
                type="text"
                className="input-field"
                placeholder="pk_test_..."
                value={settings.stripe?.publicKey || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    stripe: { ...settings.stripe, publicKey: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className="input-label">Secret Key</label>
              <input
                type="password"
                className="input-field"
                placeholder="sk_test_..."
                value={settings.stripe?.secretKey || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    stripe: { ...settings.stripe, secretKey: e.target.value },
                  })
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Razorpay Configuration */}
      {settings.enabledGateway === 'razorpay' && (
        <div className="glass-card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Razorpay Configuration</h2>
          </div>
          <p className="text-sm text-black/60 mb-4">Accept UPI, Cards, Wallets, Net Banking in India</p>
          <div className="space-y-4">
            <div>
              <label className="input-label">Key ID</label>
              <input
                type="text"
                className="input-field"
                placeholder="rzp_test_..."
                value={settings.razorpay?.keyId || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    razorpay: { ...settings.razorpay, keyId: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className="input-label">Key Secret</label>
              <input
                type="password"
                className="input-field"
                placeholder="Razorpay Secret"
                value={settings.razorpay?.keySecret || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    razorpay: { ...settings.razorpay, keySecret: e.target.value },
                  })
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* PayPal Configuration */}
      {settings.enabledGateway === 'paypal' && (
        <div className="glass-card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5" />
            <h2 className="text-lg font-semibold">PayPal Configuration</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="input-label">Client ID</label>
              <input
                type="text"
                className="input-field"
                placeholder="PayPal Client ID"
                value={settings.paypal?.clientId || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    paypal: { ...settings.paypal, clientId: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className="input-label">Client Secret</label>
              <input
                type="password"
                className="input-field"
                placeholder="PayPal Client Secret"
                value={settings.paypal?.clientSecret || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    paypal: { ...settings.paypal, clientSecret: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className="input-label">Mode</label>
              <select
                className="input-field"
                value={settings.paypal?.mode || 'sandbox'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    paypal: { ...settings.paypal, mode: e.target.value as 'sandbox' | 'live' },
                  })
                }
              >
                <option value="sandbox">Sandbox (Testing)</option>
                <option value="live">Live (Production)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* PayU Configuration */}
      {settings.enabledGateway === 'payu' && (
        <div className="glass-card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5" />
            <h2 className="text-lg font-semibold">PayU Configuration</h2>
          </div>
          <p className="text-sm text-black/60 mb-4">Popular in India, EU and Latin America</p>
          <div className="space-y-4">
            <div>
              <label className="input-label">Merchant Key</label>
              <input
                type="text"
                className="input-field"
                placeholder="PayU Merchant Key"
                value={settings.payu?.merchantKey || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    payu: { ...settings.payu, merchantKey: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className="input-label">Salt Key</label>
              <input
                type="password"
                className="input-field"
                placeholder="PayU Salt Key"
                value={settings.payu?.salt || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    payu: { ...settings.payu, salt: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className="input-label">Mode</label>
              <select
                className="input-field"
                value={settings.payu?.mode || 'test'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    payu: { ...settings.payu, mode: e.target.value as 'test' | 'live' },
                  })
                }
              >
                <option value="test">Test Mode</option>
                <option value="live">Live Mode</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="btn-primary"
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Payment Settings'}
        </button>
        {saved && (
          <span className="text-green-600 font-medium">Settings saved successfully!</span>
        )}
      </div>
    </div>
  );
}