import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { CreditCard, Shield, Zap, DollarSign, Check, X } from 'lucide-react';

type PaymentGateway = 'stripe' | 'razorpay' | 'paypal' | 'payu' | 'none';

interface PaymentSettingsData {
  enabledGateway: PaymentGateway;
  stripe?: { publicKey: string; secretKey: string };
  razorpay?: { keyId: string; keySecret: string };
  paypal?: { clientId: string; clientSecret: string; mode: 'sandbox' | 'live' };
  payu?: { merchantKey: string; salt: string; mode: 'test' | 'live' };
}

const gateways = [
  { id: 'razorpay' as PaymentGateway, name: 'Razorpay', icon: '🇮🇳', regions: 'India', description: 'UPI, Cards, Wallets in India' },
  { id: 'stripe' as PaymentGateway, name: 'Stripe', icon: '💳', regions: 'Global', description: '135+ currencies worldwide' },
  { id: 'paypal' as PaymentGateway, name: 'PayPal', icon: '🅿️', regions: 'Global', description: 'Trusted worldwide' },
  { id: 'payu' as PaymentGateway, name: 'PayU', icon: '🌐', regions: 'India/EU/LATAM', description: 'Emerging markets' },
];

export default function PaymentSettingsContent() {
  const [settings, setSettings] = useState<PaymentSettingsData>({ enabledGateway: 'none' });
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

  const handleSave = () => updateMutation.mutate(settings);

  if (isLoading) return <div className="p-6 text-black/60">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-black">Payment Gateway</h3>
        <p className="text-sm text-black/60">Select and configure your payment provider</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
            <div className="text-2xl mb-1">{gw.icon}</div>
            <div className="font-medium text-black text-sm">{gw.name}</div>
            <div className="text-xs text-black/60">{gw.regions}</div>
          </button>
        ))}
        <button
          onClick={() => setSettings({ ...settings, enabledGateway: 'none' })}
          className={`p-4 rounded-lg border-2 text-left transition-all ${
            settings.enabledGateway === 'none'
              ? 'border-slate-400 bg-slate-100'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-2xl mb-1">🚫</div>
          <div className="font-medium text-black text-sm">None</div>
          <div className="text-xs text-black/60">Disabled</div>
        </button>
      </div>

      {settings.enabledGateway === 'stripe' && (
        <div className="glass-card">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5" />
            <h4 className="font-medium">Stripe Configuration</h4>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-black/70">Publishable Key</label>
              <input
                type="text"
                className="input-field mt-1"
                placeholder="pk_test_..."
                value={settings.stripe?.publicKey || ''}
                onChange={(e) => setSettings({ ...settings, stripe: { ...settings.stripe, publicKey: e.target.value } })}
              />
            </div>
            <div>
              <label className="text-sm text-black/70">Secret Key</label>
              <input
                type="password"
                className="input-field mt-1"
                placeholder="sk_test_..."
                value={settings.stripe?.secretKey || ''}
                onChange={(e) => setSettings({ ...settings, stripe: { ...settings.stripe, secretKey: e.target.value } })}
              />
            </div>
          </div>
        </div>
      )}

      {settings.enabledGateway === 'razorpay' && (
        <div className="glass-card">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5" />
            <h4 className="font-medium">Razorpay Configuration</h4>
          </div>
          <p className="text-sm text-black/60 mb-3">Accept UPI, Cards, Wallets in India</p>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-black/70">Key ID</label>
              <input
                type="text"
                className="input-field mt-1"
                placeholder="rzp_test_..."
                value={settings.razorpay?.keyId || ''}
                onChange={(e) => setSettings({ ...settings, razorpay: { ...settings.razorpay, keyId: e.target.value } })}
              />
            </div>
            <div>
              <label className="text-sm text-black/70">Key Secret</label>
              <input
                type="password"
                className="input-field mt-1"
                placeholder="Razorpay Secret"
                value={settings.razorpay?.keySecret || ''}
                onChange={(e) => setSettings({ ...settings, razorpay: { ...settings.razorpay, keySecret: e.target.value } })}
              />
            </div>
          </div>
        </div>
      )}

      {settings.enabledGateway === 'paypal' && (
        <div className="glass-card">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5" />
            <h4 className="font-medium">PayPal Configuration</h4>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-black/70">Client ID</label>
              <input
                type="text"
                className="input-field mt-1"
                placeholder="PayPal Client ID"
                value={settings.paypal?.clientId || ''}
                onChange={(e) => setSettings({ ...settings, paypal: { ...settings.paypal, clientId: e.target.value } })}
              />
            </div>
            <div>
              <label className="text-sm text-black/70">Client Secret</label>
              <input
                type="password"
                className="input-field mt-1"
                placeholder="PayPal Client Secret"
                value={settings.paypal?.clientSecret || ''}
                onChange={(e) => setSettings({ ...settings, paypal: { ...settings.paypal, clientSecret: e.target.value } })}
              />
            </div>
            <div>
              <label className="text-sm text-black/70">Mode</label>
              <select
                className="input-field mt-1"
                value={settings.paypal?.mode || 'sandbox'}
                onChange={(e) => setSettings({ ...settings, paypal: { ...settings.paypal, mode: e.target.value as 'sandbox' | 'live' } })}
              >
                <option value="sandbox">Sandbox (Testing)</option>
                <option value="live">Live (Production)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {settings.enabledGateway === 'payu' && (
        <div className="glass-card">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5" />
            <h4 className="font-medium">PayU Configuration</h4>
          </div>
          <p className="text-sm text-black/60 mb-3">India, EU and Latin America</p>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-black/70">Merchant Key</label>
              <input
                type="text"
                className="input-field mt-1"
                placeholder="PayU Merchant Key"
                value={settings.payu?.merchantKey || ''}
                onChange={(e) => setSettings({ ...settings, payu: { ...settings.payu, merchantKey: e.target.value } })}
              />
            </div>
            <div>
              <label className="text-sm text-black/70">Salt Key</label>
              <input
                type="password"
                className="input-field mt-1"
                placeholder="PayU Salt"
                value={settings.payu?.salt || ''}
                onChange={(e) => setSettings({ ...settings, payu: { ...settings.payu, salt: e.target.value } })}
              />
            </div>
            <div>
              <label className="text-sm text-black/70">Mode</label>
              <select
                className="input-field mt-1"
                value={settings.payu?.mode || 'test'}
                onChange={(e) => setSettings({ ...settings, payu: { ...settings.payu, mode: e.target.value as 'test' | 'live' } })}
              >
                <option value="test">Test Mode</option>
                <option value="live">Live Mode</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <button onClick={handleSave} disabled={updateMutation.isPending} className="btn-primary">
          {updateMutation.isPending ? 'Saving...' : 'Save Payment Settings'}
        </button>
        {saved && <span className="text-green-600 text-sm">Settings saved!</span>}
      </div>
    </div>
  );
}