import { useCurrencyStore } from './stores/currencyStore';

export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrencyStore();
  
  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value)}
      className="input-field text-sm py-1.5 px-2 border border-slate-200 rounded-lg bg-white cursor-pointer"
    >
      <option value="INR">£ INR</option>
      <option value="USD">$ USD</option>
      <option value="GBP">£ GBP</option>
      <option value="EUR">€ EUR</option>
      <option value="AED">د.إ AED</option>
    </select>
  );
}