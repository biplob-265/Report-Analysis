
import React from 'react';
import { Check, CreditCard, Landmark, Wallet } from 'lucide-react';

const Pricing: React.FC = () => {
  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      description: 'Perfect for exploring basic insights.',
      features: ['3 Reports per month', 'CSV support', 'Basic visualizations', 'Community support'],
      buttonText: 'Current Plan',
      highlighted: false
    },
    {
      name: 'Professional',
      price: '৳999',
      period: '/mo',
      description: 'Unlock advanced AI and higher limits.',
      features: ['Unlimited Reports', 'JSON & Excel support', 'Gemini 3 Pro reasoning', 'Priority support', 'Shareable reports'],
      buttonText: 'Upgrade Now',
      highlighted: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For teams needing deep data security.',
      features: ['Dedicated instance', 'Custom AI models', 'White-labeling', 'SLA support', 'Bulk data processing'],
      buttonText: 'Contact Sales',
      highlighted: false
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Pricing Plans</h1>
        <p className="text-lg text-slate-500">Choose the best way to supercharge your data analysis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {plans.map((plan, i) => (
          <div 
            key={i} 
            className={`relative rounded-3xl p-8 transition-all ${
              plan.highlighted 
                ? 'bg-white border-2 border-indigo-600 shadow-xl scale-105 z-10' 
                : 'bg-white border border-slate-200 hover:shadow-lg'
            }`}
          >
            {plan.highlighted && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Most Popular
              </span>
            )}
            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-extrabold">{plan.price}</span>
              {plan.period && <span className="text-slate-500">{plan.period}</span>}
            </div>
            <p className="text-slate-600 text-sm mb-6">{plan.description}</p>
            <ul className="space-y-4 mb-8">
              {plan.features.map((feature, j) => (
                <li key={j} className="flex items-center gap-3 text-sm text-slate-600">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <button 
              className={`w-full py-3 rounded-xl font-bold transition-colors ${
                plan.highlighted 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                  : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
              }`}
            >
              {plan.buttonText}
            </button>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">Supported Payment Methods</h2>
            <p className="text-slate-400 max-w-md">We support major international credit cards and local methods for Bangladesh.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center gap-2 p-4 bg-slate-800 rounded-2xl border border-slate-700">
              <CreditCard className="w-8 h-8 text-indigo-400" />
              <span className="text-xs">Stripe</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-slate-800 rounded-2xl border border-slate-700">
              <Wallet className="w-8 h-8 text-pink-400" />
              <span className="text-xs">bKash</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-slate-800 rounded-2xl border border-slate-700">
              <Wallet className="w-8 h-8 text-orange-400" />
              <span className="text-xs">Nagad</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-slate-800 rounded-2xl border border-slate-700">
              <Landmark className="w-8 h-8 text-blue-400" />
              <span className="text-xs">Bank Transfer</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
