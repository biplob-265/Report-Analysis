
import React, { useState, useMemo } from 'react';
import { 
  Check, 
  CreditCard, 
  Landmark, 
  Wallet, 
  Phone, 
  X, 
  ArrowRight, 
  ShieldCheck, 
  Copy, 
  MessageCircle,
  Hash,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Info
} from 'lucide-react';

interface Plan {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  buttonText: string;
  highlighted: boolean;
}

const Pricing: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'instructions' | 'verify' | 'processing' | 'success'>('instructions');
  
  // Unique Reference for the current session
  const [sessionRefId] = useState(() => Math.floor(1000 + Math.random() * 9000));

  // Form State
  const [trxId, setTrxId] = useState('');
  const [senderPhone, setSenderPhone] = useState('');

  const PAYMENT_NUMBER = '01831814494';

  const plans: Plan[] = [
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
      price: '৳500',
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

  const handleUpgrade = (plan: Plan) => {
    if (plan.name === 'Starter') return;
    setSelectedPlan(plan);
    setPaymentStep('instructions');
    setIsPaymentModalOpen(true);
  };

  const copyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleConfirmPayment = () => {
    if (senderPhone.length < 11) {
      alert('Please enter a valid 11-digit mobile number.');
      return;
    }
    if (trxId.length < 6) {
      alert('Please enter a valid Transaction ID.');
      return;
    }
    setPaymentStep('processing');
    setTimeout(() => {
      setPaymentStep('success');
    }, 2500);
  };

  const closeModal = () => {
    setIsPaymentModalOpen(false);
    setTrxId('');
    setSenderPhone('');
    setPaymentStep('instructions');
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Affordable Intelligence</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">Scalable data analysis starting at just 500 Taka per month. High-precision Gemini 3 reports for everyone.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 items-start">
        {plans.map((plan, i) => (
          <div 
            key={i} 
            className={`relative rounded-[3rem] p-10 transition-all duration-500 ${
              plan.highlighted 
                ? 'bg-white border-4 border-indigo-600 shadow-[0_32px_64px_-12px_rgba(79,70,229,0.2)] scale-105 z-10' 
                : 'bg-white border border-slate-200 hover:shadow-xl hover:border-indigo-200'
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-200">
                Most Popular
              </div>
            )}
            <div className="mb-8">
              <h3 className="text-2xl font-black text-slate-900 mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-slate-900 tracking-tighter">{plan.price}</span>
                {plan.period && <span className="text-slate-400 font-bold">{plan.period}</span>}
              </div>
              <p className="text-slate-500 text-sm mt-4 font-medium leading-relaxed">{plan.description}</p>
            </div>
            <ul className="space-y-5 mb-10">
              {plan.features.map((feature, j) => (
                <li key={j} className="flex items-start gap-4 text-sm text-slate-600 font-medium">
                  <div className="mt-1 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-emerald-600 stroke-[3px]" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => handleUpgrade(plan)}
              disabled={plan.name === 'Starter'}
              className={`w-full py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${
                plan.highlighted 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 hover:-translate-y-1' 
                  : plan.name === 'Starter' 
                    ? 'bg-slate-100 text-slate-400 cursor-default'
                    : 'bg-slate-50 text-slate-900 hover:bg-slate-100'
              }`}
            >
              {plan.buttonText}
            </button>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-[4rem] p-10 md:p-20 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 relative z-10">
          <div className="max-w-xl text-center lg:text-left">
            <h2 className="text-3xl md:text-4xl font-black mb-6 tracking-tight">Flexible Payments for Bangladesh</h2>
            <p className="text-slate-400 font-medium leading-relaxed mb-8">
              We've integrated local mobile financial services for quick and easy account upgrades. Simply send money to our official account and verify below.
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
              <div className="flex items-center gap-3 bg-slate-800/50 border border-slate-700 px-5 py-3 rounded-2xl">
                <CreditCard className="w-5 h-5 text-indigo-400" />
                <span className="text-xs font-bold text-slate-300">Visa / Mastercard</span>
              </div>
              <div className="flex items-center gap-3 bg-slate-800/50 border border-slate-700 px-5 py-3 rounded-2xl">
                <Landmark className="w-5 h-5 text-blue-400" />
                <span className="text-xs font-bold text-slate-300">Bank Transfer</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full lg:w-auto">
            <div className="group bg-slate-800/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-slate-700 hover:border-pink-500/50 transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20">
                  <Wallet className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-white">bKash Personal</h4>
                  <p className="text-[10px] text-pink-400 font-black uppercase tracking-widest">Mobile Payment</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span className="text-lg font-black font-mono tracking-wider text-white">{PAYMENT_NUMBER}</span>
                </div>
                <p className="text-[9px] text-slate-500 font-bold text-center italic">Dial *247# to make payment</p>
              </div>
            </div>

            <div className="group bg-slate-800/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-slate-700 hover:border-orange-500/50 transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <Wallet className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-white">Nagad Personal</h4>
                  <p className="text-[10px] text-orange-400 font-black uppercase tracking-widest">Mobile Payment</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span className="text-lg font-black font-mono tracking-wider text-white">{PAYMENT_NUMBER}</span>
                </div>
                <p className="text-[9px] text-slate-500 font-bold text-center italic">Dial *167# to make payment</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Payment Gateway</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Local Mobile Finance (MFS)</p>
                </div>
              </div>
              <button 
                onClick={closeModal}
                className="p-3 hover:bg-white hover:shadow-sm rounded-2xl transition-all"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-10 space-y-8">
              {paymentStep === 'instructions' ? (
                <>
                  <div className="bg-indigo-50/50 p-8 rounded-[2.5rem] border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Selected Plan</p>
                      <h4 className="text-3xl font-black text-slate-900">{selectedPlan.name}</h4>
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="text-4xl font-black text-indigo-600">{selectedPlan.price}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{selectedPlan.period || 'One-time payment'}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                        <Info className="w-5 h-5 text-indigo-500" /> Step-by-Step Guide
                      </h5>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex gap-6 items-start">
                        <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black flex-shrink-0 shadow-lg">1</div>
                        <div className="flex-1 pt-1">
                          <p className="text-sm font-bold text-slate-600 leading-relaxed">
                            Use "Send Money" or "Payment" to <span className="text-slate-900 font-black underline decoration-indigo-300 underline-offset-4">{PAYMENT_NUMBER}</span> (bKash/Nagad).
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-6 items-start">
                        <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black flex-shrink-0 shadow-lg">2</div>
                        <div className="flex-1 pt-1">
                          <p className="text-sm font-bold text-slate-600 leading-relaxed">
                            Enter the exact amount: <span className="text-indigo-600 font-black text-lg">{selectedPlan.price}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-6 items-start">
                        <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black flex-shrink-0 shadow-lg">3</div>
                        <div className="flex-1 pt-1">
                          <p className="text-sm font-bold text-slate-600 leading-relaxed">
                            Use reference: <span className="text-slate-900 font-black bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 ring-2 ring-indigo-50">"INSIGHT_{sessionRefId}"</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-6 items-start">
                        <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black flex-shrink-0 shadow-lg">4</div>
                        <div className="flex-1 pt-1">
                          <p className="text-sm font-bold text-slate-600 leading-relaxed">
                            Once done, click <span className="font-black text-slate-900">"Proceed to Verify"</span> to enter your transaction details.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <span>Gateway Account</span>
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between bg-white px-5 py-4 rounded-2xl border border-slate-200">
                      <span className="text-xl font-black font-mono text-slate-900 tracking-wider">{PAYMENT_NUMBER}</span>
                      <button 
                        onClick={() => copyNumber(PAYMENT_NUMBER)} 
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${copySuccess ? 'bg-emerald-500 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                      >
                        {copySuccess ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </>
              ) : paymentStep === 'verify' ? (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-10 py-4">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <Hash className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h4 className="text-3xl font-black text-slate-900 tracking-tight">Verify Transaction</h4>
                    <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto">Please enter the details from your bKash or Nagad transaction receipt.</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Your Mobile Number (Sender)</label>
                      <div className="relative group">
                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                          type="text" 
                          value={senderPhone}
                          maxLength={11}
                          onChange={(e) => setSenderPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="e.g. 017XXXXXXXX"
                          className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-5 pl-14 pr-6 text-lg font-black font-mono outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-600 transition-all placeholder:text-slate-300"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Transaction ID (TrxID)</label>
                      <div className="relative group">
                        <Hash className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                          type="text" 
                          value={trxId}
                          onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                          placeholder="e.g. AB12CD34EF"
                          className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-5 pl-14 pr-6 text-lg font-black font-mono outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-600 transition-all uppercase placeholder:text-slate-300"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl flex gap-4">
                    <Info className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <p className="text-[10px] font-bold text-amber-800 leading-relaxed">
                      Verification usually takes less than 30 minutes. If you experience any delays, please contact our support team with your TrxID.
                    </p>
                  </div>
                </div>
              ) : paymentStep === 'processing' ? (
                <div className="h-full flex flex-col items-center justify-center py-24 space-y-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
                    <Loader2 className="w-20 h-20 text-indigo-600 animate-spin relative z-10" />
                  </div>
                  <div className="text-center space-y-2">
                    <h4 className="text-2xl font-black text-slate-900 tracking-tight">Connecting to Gateway</h4>
                    <p className="text-sm text-slate-500 font-medium">Validating your transaction ID with local MFS servers...</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-16 animate-in zoom-in-95 duration-500 space-y-8">
                  <div className="w-28 h-28 bg-emerald-100 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-emerald-50 relative">
                    <div className="absolute inset-0 bg-emerald-400/20 rounded-[2.5rem] animate-ping duration-[2000ms]" />
                    <CheckCircle2 className="w-14 h-14 text-emerald-600 relative z-10" />
                  </div>
                  <div className="text-center space-y-4">
                    <h4 className="text-4xl font-black text-slate-900 tracking-tight">Payment Received!</h4>
                    <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 inline-block">
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Transaction ID</p>
                      <p className="text-sm font-black text-slate-900 font-mono tracking-wider">{trxId}</p>
                    </div>
                    <p className="text-slate-500 font-medium leading-relaxed max-w-sm mx-auto text-sm">
                      Your Professional subscription is being activated. You will receive an email confirmation within 30 minutes.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {paymentStep !== 'success' && paymentStep !== 'processing' && (
              <div className="p-10 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-3 text-slate-400">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">SSL Secure / Verified Gateway</span>
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                  {paymentStep === 'instructions' ? (
                    <>
                      <button 
                        onClick={() => window.open(`https://wa.me/88${PAYMENT_NUMBER}`, '_blank')}
                        className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-100 transition-all flex items-center justify-center"
                        title="WhatsApp Support"
                      >
                        <MessageCircle className="w-6 h-6 text-emerald-500" />
                      </button>
                      <button 
                        onClick={() => setPaymentStep('verify')}
                        className="flex-1 sm:flex-none px-12 py-5 bg-indigo-600 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 hover:-translate-y-1 flex items-center justify-center gap-3"
                      >
                        Proceed to Verify <ArrowRight className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => setPaymentStep('instructions')}
                        className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-100 transition-all flex items-center justify-center gap-3 px-6 text-[10px] font-black uppercase tracking-widest"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back
                      </button>
                      <button 
                        onClick={handleConfirmPayment}
                        className="flex-1 sm:flex-none px-12 py-5 bg-emerald-600 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 hover:-translate-y-1 flex items-center justify-center gap-3"
                      >
                        Confirm Payment <Check className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {paymentStep === 'success' && (
              <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-center">
                <button 
                  onClick={closeModal}
                  className="px-16 py-5 bg-indigo-600 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                >
                  Close & Back to App
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Pricing;
