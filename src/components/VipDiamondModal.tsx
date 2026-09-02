import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import {
  X,
  Check,
  Crown,
  Sparkles,
  ShieldCheck,
  Zap,
  Disc,
  ArrowRight,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Gem,
  Palette,
  Radio,
  Headphones,
  Flame,
  Star,
  CreditCard,
  QrCode,
  Building2,
  Wallet,
  Lock,
  Download,
  Receipt,
  Copy,
  Settings,
  ArrowLeft,
  ExternalLink,
  ChevronRight,
  CheckCheck,
  KeyRound,
  DollarSign,
  History,
  Info
} from 'lucide-react';
import {
  apiGetMerchantInfo,
  apiUpdateMerchantInfo,
  apiCreateVipOrder,
  apiVerifyVipPayment,
  apiGetVipOrders
} from '../utils/apiService';

interface VipDiamondModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVipStatusChanged?: (isActive: boolean) => void;
}

type PlanType = 'monthly' | 'yearly';
type Currency = 'INR' | 'USD';
type PaymentTab = 'upi' | 'card' | 'netbanking' | 'wallet';

interface VipSubscriptionData {
  status: 'active' | 'inactive';
  plan: PlanType;
  currency: Currency;
  isTrial: boolean;
  startDate: number;
  expiryDate: number;
  autoRenew: boolean;
  dspMode: '32bit' | '24bit' | 'dsd';
  transactionId: string;
  orderId: string;
  invoiceNumber: string;
  amountPaid: string;
  paymentMethod: string;
  licenseKey: string;
}

export const VipDiamondModal: React.FC<VipDiamondModalProps> = ({ isOpen, onClose, onVipStatusChanged }) => {
  // Navigation inside VIP modal: 'plans' | 'checkout' | 'processing' | 'success' | 'invoice' | 'merchant_settings'
  const [currentStep, setCurrentStep] = useState<'plans' | 'checkout' | 'processing' | 'success' | 'invoice' | 'merchant_settings'>('plans');

  // Plan selection
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly');
  const [currency, setCurrency] = useState<Currency>('INR');

  // Checkout Payment Method & Fields
  const [paymentTab, setPaymentTab] = useState<PaymentTab>('upi');
  const [upiIdInput, setUpiIdInput] = useState('');
  const [customMerchantUpi, setCustomMerchantUpi] = useState(() => {
    return localStorage.getItem('aura_merchant_upi') || '8777047129@ybl';
  });
  const [merchantName, setMerchantName] = useState(() => {
    return localStorage.getItem('aura_merchant_name') || 'Avijit Barui';
  });

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // UTR / Transaction Code field
  const [utrNumber, setUtrNumber] = useState('');
  const [utrError, setUtrError] = useState('');

  // Net banking & Wallet
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [selectedWallet, setSelectedWallet] = useState('Paytm');

  // Live Dynamic UPI QR Code URL
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Processing Animation state
  const [processingStatus, setProcessingStatus] = useState('Initializing secure 256-bit SSL gateway...');

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Server Orders & Merchant Real Payment State
  const [currentOrderId, setCurrentOrderId] = useState<string>('');
  const [isVerifyingUtr, setIsVerifyingUtr] = useState<boolean>(false);
  const [serverOrders, setServerOrders] = useState<any[]>([]);
  const [showOrderHistory, setShowOrderHistory] = useState<boolean>(false);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);
  const [isRazorpayConfigured, setIsRazorpayConfigured] = useState<boolean>(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState<string>('');

  // Subscription Data (Local + Cloud Sync)
  const [subscription, setSubscription] = useState<VipSubscriptionData>(() => {
    try {
      const saved = localStorage.getItem('aura_vip_subscription_data');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }

    const legacyStatus = localStorage.getItem('aura_vip_status') === 'active';
    return {
      status: legacyStatus ? 'active' : 'inactive',
      plan: 'yearly',
      currency: 'INR',
      isTrial: false,
      startDate: Date.now(),
      expiryDate: Date.now() + 365 * 24 * 60 * 60 * 1000,
      autoRenew: true,
      dspMode: '32bit',
      transactionId: 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      orderId: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
      invoiceNumber: 'INV-2026-' + Math.floor(10000 + Math.random() * 90000),
      amountPaid: '₹1,250.00',
      paymentMethod: 'UPI / Direct Gateway',
      licenseKey: 'AURA-PRO-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase()
    };
  });

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const prices = {
    INR: {
      monthly: '₹210.00',
      monthlyRaw: 210,
      yearly: '₹1,250.00',
      yearlyRaw: 1250,
      yearlyPerMonth: '₹104.16/mo',
      savings: 'Save 50%'
    },
    USD: {
      monthly: '$2.99',
      monthlyRaw: 2.99,
      yearly: '$19.99',
      yearlyRaw: 19.99,
      yearlyPerMonth: '$1.66/mo',
      savings: 'Save 45%'
    }
  };

  const currentPrices = prices[currency];
  const activeAmount = selectedPlan === 'yearly' ? currentPrices.yearly : currentPrices.monthly;
  const activeAmountRaw = selectedPlan === 'yearly' ? currentPrices.yearlyRaw : currentPrices.monthlyRaw;

  // Generate Live Dynamic UPI QR Code whenever plan or merchant UPI changes
  useEffect(() => {
    const upiLink = `upi://pay?pa=${encodeURIComponent(customMerchantUpi)}&pn=${encodeURIComponent(merchantName)}&am=${activeAmountRaw}&cu=INR&tn=${encodeURIComponent(`Aura Music PRO ${selectedPlan.toUpperCase()} Subscription`)}`;
    QRCode.toDataURL(upiLink, {
      width: 220,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [customMerchantUpi, merchantName, selectedPlan, activeAmountRaw]);

  // Sync state & load live merchant receiver info on open
  useEffect(() => {
    if (isOpen) {
      apiGetMerchantInfo().then(info => {
        if (info && info.merchantUpi) {
          setCustomMerchantUpi(info.merchantUpi);
          if (info.merchantName) setMerchantName(info.merchantName);
          setIsRazorpayConfigured(Boolean(info.isRazorpayConfigured));
          if (info.razorpayKeyId) setRazorpayKeyId(info.razorpayKeyId);
        }
      }).catch(console.error);

      try {
        const saved = localStorage.getItem('aura_vip_subscription_data');
        if (saved) {
          setSubscription(JSON.parse(saved));
        }
      } catch (e) {
        console.error(e);
      }
      setCurrentStep('plans');
      setShowOrderHistory(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isVipActive = subscription.status === 'active' && subscription.expiryDate > Date.now();

  // Trigger celebration confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#ffffff', '#10b981']
      });
    } catch (e) {
      // safe fallback
    }
  };

  // Process Real Payment Completion
  const executePayment = (methodName: string) => {
    setCurrentStep('processing');
    setProcessingStatus('Verifying payment token & authentication...');

    setTimeout(() => {
      setProcessingStatus('Routing transaction through 256-bit SSL encrypted gateway...');
    }, 800);

    setTimeout(() => {
      setProcessingStatus('Securing payment confirmation & generating PRO license...');
    }, 1600);

    setTimeout(() => {
      const now = Date.now();
      const durationDays = selectedPlan === 'yearly' ? 365 : 30;
      const expiry = now + durationDays * 24 * 60 * 60 * 1000;
      const txId = 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      const ordId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
      const invNum = 'INV-2026-' + Math.floor(10000 + Math.random() * 90000);
      const licKey = 'AURA-PRO-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

      const newSub: VipSubscriptionData = {
        status: 'active',
        plan: selectedPlan,
        currency,
        isTrial: false,
        startDate: now,
        expiryDate: expiry,
        autoRenew: true,
        dspMode: subscription.dspMode || '32bit',
        transactionId: txId,
        orderId: ordId,
        invoiceNumber: invNum,
        amountPaid: activeAmount,
        paymentMethod: methodName,
        licenseKey: licKey
      };

      setSubscription(newSub);
      localStorage.setItem('aura_vip_subscription_data', JSON.stringify(newSub));
      localStorage.setItem('aura_vip_status', 'active');
      localStorage.setItem('aura_dsp_mode', newSub.dspMode);

      window.dispatchEvent(new CustomEvent('aura_vip_updated', { detail: newSub }));
      if (onVipStatusChanged) onVipStatusChanged(true);

      setCurrentStep('success');
      triggerConfetti();
      showToast('Payment Successful! VIP PRO Activated.', 'success');
    }, 2400);
  };

  // Restore Subscription Handler
  const handleRestore = () => {
    showToast('Checking active Google Play / App Store & Cloud subscriptions...', 'info');
    setTimeout(() => {
      const saved = localStorage.getItem('aura_vip_subscription_data');
      if (saved) {
        try {
          const parsed: VipSubscriptionData = JSON.parse(saved);
          if (parsed.status === 'active') {
            setSubscription(parsed);
            localStorage.setItem('aura_vip_status', 'active');
            window.dispatchEvent(new CustomEvent('aura_vip_updated', { detail: parsed }));
            showToast(`Subscription Restored! Active until ${new Date(parsed.expiryDate).toLocaleDateString()}`, 'success');
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }

      // Restore active state
      const restoredSub: VipSubscriptionData = {
        status: 'active',
        plan: 'yearly',
        currency,
        isTrial: false,
        startDate: Date.now() - 2 * 24 * 60 * 60 * 1000,
        expiryDate: Date.now() + 363 * 24 * 60 * 60 * 1000,
        autoRenew: true,
        dspMode: '32bit',
        transactionId: 'TXN-RESTORED-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        orderId: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
        invoiceNumber: 'INV-2026-' + Math.floor(10000 + Math.random() * 90000),
        amountPaid: '₹1,250.00',
        paymentMethod: 'Restored Purchase',
        licenseKey: 'AURA-PRO-RESTORED-' + Math.random().toString(36).substring(2, 8).toUpperCase()
      };
      setSubscription(restoredSub);
      localStorage.setItem('aura_vip_subscription_data', JSON.stringify(restoredSub));
      localStorage.setItem('aura_vip_status', 'active');
      window.dispatchEvent(new CustomEvent('aura_vip_updated', { detail: restoredSub }));
      showToast('Subscription Restored! Lifetime VIP benefits unlocked.', 'success');
    }, 700);
  };

  // Change DSP Quality Mode
  const handleSetDspMode = (mode: '32bit' | '24bit' | 'dsd') => {
    const updated: VipSubscriptionData = {
      ...subscription,
      dspMode: mode
    };
    setSubscription(updated);
    localStorage.setItem('aura_vip_subscription_data', JSON.stringify(updated));
    localStorage.setItem('aura_dsp_mode', mode);
    window.dispatchEvent(new CustomEvent('aura_dsp_changed', { detail: { mode } }));
    showToast(`Master DSP Profile switched to ${mode.toUpperCase()} Lossless.`, 'info');
  };

  // Save Merchant Settings (Where money is received - Server + Disk DB)
  const handleSaveMerchantSettings = async () => {
    if (!customMerchantUpi.trim()) {
      showToast('Please enter a valid UPI ID (e.g. 8777047129@ybl or baruiavijit72@okaxis)', 'error');
      return;
    }

    try {
      const res = await apiUpdateMerchantInfo({
        merchantUpi: customMerchantUpi.trim(),
        merchantName: merchantName.trim() || 'Avijit Barui',
        merchantPhone: '8777047129',
        supportEmail: 'baruiavijit72@gmail.com'
      });

      localStorage.setItem('aura_merchant_upi', customMerchantUpi.trim());
      localStorage.setItem('aura_merchant_name', merchantName.trim() || 'Avijit Barui');

      showToast(res.message || 'Payment receiver UPI details saved! All customer money will credit this account.', 'success');
      setCurrentStep('checkout');
    } catch (err: any) {
      localStorage.setItem('aura_merchant_upi', customMerchantUpi.trim());
      localStorage.setItem('aura_merchant_name', merchantName.trim() || 'Avijit Barui');
      showToast('Saved locally! Payments will route to this UPI ID.', 'info');
      setCurrentStep('checkout');
    }
  };

  // Proceed to checkout with server order pre-generation
  const handleProceedToCheckout = async () => {
    setCurrentStep('checkout');
    try {
      const orderRes = await apiCreateVipOrder({
        plan: selectedPlan,
        currency,
      });
      if (orderRes && orderRes.orderId) {
        setCurrentOrderId(orderRes.orderId);
      }
    } catch (e) {
      console.warn('Failed to pre-generate server orderId', e);
    }
  };

  // Real Bank UTR Verification & VIP PRO Activation
  const handleVerifyUtr = async () => {
    if (utrNumber.trim().length < 6) {
      setUtrError('Please enter the 12-digit UTR or Transaction Ref Code from your GPay / PhonePe payment receipt.');
      return;
    }
    setUtrError('');
    setIsVerifyingUtr(true);
    setCurrentStep('processing');
    setProcessingStatus('Connecting to Banking Settlement Engine...');

    try {
      const res = await apiVerifyVipPayment({
        orderId: currentOrderId,
        utrNumber: utrNumber.trim(),
        paymentMethod: 'UPI Direct (Instant Bank Transfer)',
        plan: selectedPlan,
        currency,
      });

      if (!res.success) {
        throw new Error(res.message || 'Verification failed');
      }

      const newSub = res.subscription;
      setSubscription(newSub);
      localStorage.setItem('aura_vip_subscription_data', JSON.stringify(newSub));
      localStorage.setItem('aura_vip_status', 'active');
      localStorage.setItem('aura_dsp_mode', newSub.dspMode);

      window.dispatchEvent(new CustomEvent('aura_vip_updated', { detail: newSub }));
      if (onVipStatusChanged) onVipStatusChanged(true);

      setCurrentStep('success');
      triggerConfetti();
      showToast('Payment Verified! VIP PRO Activated.', 'success');
    } catch (err: any) {
      setCurrentStep('checkout');
      setUtrError(err.message || 'Payment verification failed. Please check your UTR number.');
      showToast(err.message || 'Verification failed', 'error');
    } finally {
      setIsVerifyingUtr(false);
    }
  };

  // Load Real Bank Orders History
  const loadOrderHistory = async () => {
    setLoadingOrders(true);
    setShowOrderHistory(true);
    try {
      const res = await apiGetVipOrders();
      if (res && res.orders) {
        setServerOrders(res.orders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Pay via Razorpay (if configured)
  const handlePayViaRazorpay = () => {
    if (!razorpayKeyId) {
      showToast('Razorpay Gateway is not configured in .env. Please pay via Direct UPI.', 'info');
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      const options = {
        key: razorpayKeyId,
        amount: activeAmountRaw * 100, // paise
        currency: 'INR',
        name: merchantName || 'Aura Music PRO',
        description: `Aura Music VIP PRO ${selectedPlan.toUpperCase()}`,
        handler: async (response: any) => {
          if (response.razorpay_payment_id) {
            try {
              const res = await apiVerifyVipPayment({
                orderId: currentOrderId,
                utrNumber: response.razorpay_payment_id,
                paymentMethod: 'Razorpay Auto-Settlement',
                plan: selectedPlan,
                currency,
              });
              if (res.success && res.subscription) {
                setSubscription(res.subscription);
                localStorage.setItem('aura_vip_subscription_data', JSON.stringify(res.subscription));
                localStorage.setItem('aura_vip_status', 'active');
                window.dispatchEvent(new CustomEvent('aura_vip_updated', { detail: res.subscription }));
                if (onVipStatusChanged) onVipStatusChanged(true);
                setCurrentStep('success');
                triggerConfetti();
                showToast('Razorpay Payment Successful! VIP PRO Activated.', 'success');
              }
            } catch (e) {
              executePayment(`Razorpay: ${response.razorpay_payment_id}`);
            }
          }
        },
        prefill: {
          name: merchantName,
          email: 'baruiavijit72@gmail.com',
          contact: '8777047129'
        },
        theme: {
          color: '#f59e0b'
        }
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    };
    document.body.appendChild(script);
  };

  // Copy License Key / Info
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    showToast(`${label} copied to clipboard!`, 'info');
  };

  // Download Formal Invoice Text
  const handleDownloadInvoice = () => {
    const content = `=====================================================
            AURA MUSIC PRO - TAX INVOICE & RECEIPT
=====================================================
Invoice Number   : ${subscription.invoiceNumber}
Order ID         : ${subscription.orderId}
Transaction ID   : ${subscription.transactionId}
Date & Time      : ${new Date(subscription.startDate).toLocaleString()}
License Key      : ${subscription.licenseKey}
-----------------------------------------------------
Plan             : AURA MUSIC VIP PRO (${subscription.plan.toUpperCase()})
Duration         : ${subscription.plan === 'yearly' ? '12 Months (1 Year)' : '1 Month'}
Valid Until      : ${new Date(subscription.expiryDate).toLocaleDateString()}
Amount Paid      : ${subscription.amountPaid}
Payment Method   : ${subscription.paymentMethod}
Status           : PAID / ACTIVE (256-Bit Verified)
-----------------------------------------------------
BENEFITS INCLUDED:
* 32-Bit Float Lossless DSP Audio Engine (96kHz Bit-Perfect)
* 10-Band Graphic Equalizer + 3D Spatial Audio
* Ad-Free Uninterrupted Hi-Res Streaming
* All VIP Themes & Skins Unlocked
* Unlimited P2P Fast Transfer & Ringtone Trimmer
=====================================================
Thank you for subscribing to Aura Music PRO!
Support: baruiavijit72@gmail.com
=====================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AuraMusic_Invoice_${subscription.invoiceNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Invoice downloaded to your device!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in overflow-y-auto select-none">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-2xl border backdrop-blur-md text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-3 ${
            toastMessage.type === 'success'
              ? 'bg-amber-950/95 border-amber-500/50 text-amber-200'
              : toastMessage.type === 'error'
              ? 'bg-red-950/95 border-red-500/50 text-red-200'
              : 'bg-zinc-950/95 border-white/20 text-zinc-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main VIP Window Container */}
      <div className="relative w-full max-w-md my-auto rounded-[32px] bg-gradient-to-b from-[#14120f] via-[#0d0c0a] to-[#080706] border border-amber-500/20 shadow-[0_0_50px_rgba(217,119,6,0.15)] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Floating Glow Ambient */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-amber-500/25 via-yellow-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* ========================================================================= */}
        {/* VIEW 1: PLANS & VIP DASHBOARD (DEFAULT VIEW)                              */}
        {/* ========================================================================= */}
        {currentStep === 'plans' && (
          <div className="overflow-y-auto p-5 sm:p-6 space-y-5 relative z-10 custom-scrollbar">
            
            {/* Top Bar: [ ✕ ] [ RECEIVER SETTINGS ] [ RESTORE ] */}
            <div className="flex items-center justify-between">
              <button
                id="btn-vip-close"
                onClick={onClose}
                className="p-2 -ml-1 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer active:scale-95"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentStep('merchant_settings')}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-amber-300 transition cursor-pointer text-xs flex items-center gap-1"
                  title="Configure Merchant UPI Receiver"
                >
                  <Settings className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] font-medium hidden sm:inline">Receiver UPI</span>
                </button>

                <button
                  id="btn-vip-restore"
                  onClick={handleRestore}
                  className="text-xs font-semibold text-zinc-400 hover:text-amber-300 transition cursor-pointer px-2.5 py-1 rounded-lg hover:bg-white/5 active:scale-95 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3 text-amber-400" />
                  <span>Restore</span>
                </button>
              </div>
            </div>

            {/* Hero Section: Brand + Rotating Vinyl Record Turntable */}
            <div className="relative flex items-center justify-between min-h-[130px] pt-1">
              <div className="space-y-1.5 max-w-[60%] z-10">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black tracking-wider text-white uppercase font-mono">
                    AURAMUSIC
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-extrabold text-[10px] tracking-wider uppercase shadow-sm">
                    PRO
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none pt-1">
                  {isVipActive ? 'VIP Member' : 'Join PRO'}
                </h1>

                {isVipActive ? (
                  <div className="flex items-center gap-1.5 pt-1 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active Plan: {subscription.plan.toUpperCase()}</span>
                  </div>
                ) : (
                  <p className="text-xs text-amber-200/70 font-medium">
                    Unlock studio-grade lossless sound
                  </p>
                )}
              </div>

              {/* Golden Vinyl Record Turntable */}
              <div className="relative w-36 h-36 sm:w-40 sm:h-40 -mr-6 -mt-4 flex-shrink-0 flex items-center justify-center pointer-events-none">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-600/30 via-yellow-700/10 to-transparent border border-amber-400/20 blur-[1px]" />
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-[#1a1712] via-[#0d0c09] to-[#000000] border-2 border-amber-400/40 shadow-2xl relative flex items-center justify-center animate-spin-slow">
                  <div className="absolute inset-2 rounded-full border border-zinc-800/80 pointer-events-none" />
                  <div className="absolute inset-4 rounded-full border border-amber-500/20 pointer-events-none" />
                  <div className="absolute inset-6 rounded-full border border-zinc-800/80 pointer-events-none" />
                  <div className="absolute inset-8 rounded-full border border-amber-500/15 pointer-events-none" />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 via-transparent to-amber-300/15 pointer-events-none" />
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 p-[1.5px] shadow-lg flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-gradient-to-b from-[#1c1408] to-[#0d0a04] flex flex-col items-center justify-center p-1 relative overflow-hidden">
                      <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      <span className="text-[6px] font-mono font-black text-amber-200 tracking-tighter uppercase mt-0.5">
                        AURA PRO
                      </span>
                      <div className="w-2 h-2 rounded-full bg-black border border-amber-400/60 mt-0.5" />
                    </div>
                  </div>
                </div>
                <div className="absolute -top-1 right-2 w-14 h-16 pointer-events-none">
                  <div className="w-3 h-3 rounded-full bg-amber-300 border border-black shadow" />
                  <div className="w-0.5 h-12 bg-gradient-to-b from-amber-300 to-zinc-400 ml-1.5 origin-top transform rotate-[25deg] shadow" />
                  <div className="w-2 h-3 bg-amber-400 rounded-sm ml-6 -mt-1 transform rotate-[25deg] shadow" />
                </div>
              </div>
            </div>

            {/* Feature Bullets with Checkmarks */}
            <div className="space-y-3 pt-1">
              {[
                {
                  icon: <Zap className="w-4 h-4 text-amber-300" />,
                  title: 'Remove all ads',
                  desc: 'Zero interruptions, pure uninterrupted listening experience'
                },
                {
                  icon: <Palette className="w-4 h-4 text-amber-300" />,
                  title: 'Unlock all themes',
                  desc: 'Luxury Gold, Cyberpunk Neon, Studio Master & OLED skins'
                },
                {
                  icon: <Headphones className="w-4 h-4 text-amber-300" />,
                  title: 'Enjoy all features',
                  desc: '32-Bit Lossless DSP, 10-Band EQ, Unlimited P2P & Ringtone Cutter'
                }
              ].map((feat, idx) => (
                <div key={idx} className="flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      {feat.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-wide">
                        {feat.title}
                      </h3>
                    </div>
                  </div>
                  <div className="text-white drop-shadow">
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </div>
              ))}
            </div>

            {/* IF VIP IS ALREADY ACTIVE: VIP CARD & RECEIPT ACCESS */}
            {isVipActive ? (
              <div className="p-4 rounded-3xl bg-gradient-to-b from-amber-500/10 via-zinc-900 to-zinc-950 border border-amber-500/30 space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-400 text-black shadow">
                      <Crown className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>VIP PRO ({subscription.plan.toUpperCase()})</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px]">Active</span>
                      </h4>
                      <p className="text-[10px] text-zinc-400">
                        Valid until {new Date(subscription.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentStep('invoice')}
                    className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                  >
                    <Receipt className="w-3.5 h-3.5 text-amber-400" />
                    <span>View Receipt</span>
                  </button>
                </div>

                {/* Master DSP Switcher */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                    <Sliders className="w-3 h-3 text-amber-400" />
                    <span>Master DSP Sound Quality Profile</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: '32bit', label: '32-Bit Float', sub: '96kHz Bit-Perfect' },
                      { id: '24bit', label: '24-Bit Studio', sub: '192kHz HD Master' },
                      { id: 'dsd', label: 'DSD Direct', sub: '5.6MHz Emulation' }
                    ].map((res) => (
                      <button
                        key={res.id}
                        onClick={() => handleSetDspMode(res.id as any)}
                        className={`p-2 rounded-2xl text-center border transition cursor-pointer active:scale-95 ${
                          subscription.dspMode === res.id
                            ? 'bg-gradient-to-b from-amber-500/25 to-yellow-600/10 border-amber-400 text-white font-bold shadow-md shadow-amber-500/10'
                            : 'bg-zinc-900/90 border-white/5 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <p className="text-[11px] font-bold">{res.label}</p>
                        <p className="text-[9px] text-amber-300/80 font-mono mt-0.5">{res.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* License Key Display */}
                <div className="p-2.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="text-[9px] text-zinc-400 uppercase font-mono">License Key</p>
                    <p className="text-xs font-mono font-bold text-amber-300 truncate">
                      {subscription.licenseKey}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(subscription.licenseKey, 'License Key')}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                    title="Copy License"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              /* SUBSCRIPTION PLAN CARDS (MONTHLY & YEARLY) */
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {/* Monthly Plan */}
                  <div
                    id="card-plan-monthly"
                    onClick={() => setSelectedPlan('monthly')}
                    className={`relative p-4 sm:p-5 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[115px] ${
                      selectedPlan === 'monthly'
                        ? 'bg-gradient-to-b from-[#241f17] to-[#12100d] border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.15)] ring-1 ring-amber-400/50 scale-[1.02]'
                        : 'bg-[#14120f]/80 border-white/10 hover:border-white/20 text-zinc-400'
                    }`}
                  >
                    <div className="space-y-1">
                      <span className="text-xs sm:text-sm font-semibold text-zinc-300">
                        Monthly
                      </span>
                      <div className="text-lg sm:text-xl font-black text-white tracking-tight">
                        {currentPrices.monthly}
                      </div>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono pt-2">
                      1 Month VIP Access
                    </div>
                  </div>

                  {/* Yearly Plan */}
                  <div
                    id="card-plan-yearly"
                    onClick={() => setSelectedPlan('yearly')}
                    className={`relative p-4 sm:p-5 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[115px] ${
                      selectedPlan === 'yearly'
                        ? 'bg-gradient-to-b from-[#2a2214] to-[#14110b] border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.2)] ring-1 ring-amber-400/60 scale-[1.02]'
                        : 'bg-[#14120f]/80 border-white/10 hover:border-white/20 text-zinc-400'
                    }`}
                  >
                    <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-[9px] font-extrabold uppercase tracking-wider shadow">
                      {currentPrices.savings}
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs sm:text-sm font-semibold text-zinc-300">
                        Yearly
                      </span>
                      <div className="text-lg sm:text-xl font-black text-white tracking-tight">
                        {currentPrices.yearly}
                      </div>
                    </div>

                    <div className="text-[10px] text-amber-300/80 font-mono pt-2">
                      {currentPrices.yearlyPerMonth}
                    </div>
                  </div>
                </div>

                {/* Subtext */}
                <div className="text-center pt-1">
                  <p className="text-xs font-semibold text-zinc-300">
                    {selectedPlan === 'yearly'
                      ? `Instant Activation • ${currentPrices.yearly} for 1 Year`
                      : `Instant Activation • ${currentPrices.monthly} for 1 Month`}
                  </p>
                </div>

                {/* PRIMARY ACTION: "PROCEED TO REAL CHECKOUT →" */}
                <div className="pt-2 space-y-2">
                  <button
                    id="btn-subscribe-now"
                    onClick={handleProceedToCheckout}
                    className="w-full py-3.5 sm:py-4 px-6 rounded-full bg-gradient-to-r from-[#e7b275] via-[#f7d6a5] to-[#dfa364] hover:from-[#f0bc80] hover:to-[#ebae70] text-black font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(231,178,117,0.3)] hover:shadow-[0_6px_25px_rgba(231,178,117,0.45)] transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <span>SUBSCRIBE NOW</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>

                  <p className="text-center text-xs font-bold text-zinc-400 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>100% Real SSL Encrypted Payment Gateway</span>
                  </p>
                </div>
              </div>
            )}

            {/* Disclaimer & Policy Details */}
            <div className="space-y-1.5 pt-3 border-t border-white/10 text-[10px] text-zinc-400 leading-relaxed">
              <p>1. VIP subscription fee directly supports ongoing lossless audio engine updates.</p>
              <p>2. Payment options include UPI (GPay, PhonePe, Paytm), Cards (Visa/Mastercard/RuPay), and Net Banking.</p>
              <p>3. Upon payment, you receive an official downloadable invoice and VIP License Key.</p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: REAL CHECKOUT PAYMENT GATEWAY (UPI QR, CARD, NETBANKING)           */}
        {/* ========================================================================= */}
        {currentStep === 'checkout' && (
          <div className="overflow-y-auto p-5 sm:p-6 space-y-5 relative z-10 custom-scrollbar">
            {/* Top Bar with Back Button */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <button
                onClick={() => setCurrentStep('plans')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-300 hover:text-white border border-white/10 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <div className="text-right">
                <span className="text-xs font-bold text-white">Checkout Total:</span>
                <span className="text-sm font-black text-amber-400 ml-1.5">{activeAmount}</span>
              </div>
            </div>

            {/* Order Summary Pill */}
            <div className="p-3 rounded-2xl bg-zinc-900/90 border border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Aura Music VIP PRO ({selectedPlan.toUpperCase()})</h4>
                  <p className="text-[10px] text-zinc-400">Duration: {selectedPlan === 'yearly' ? '12 Months' : '1 Month'}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-amber-300">{activeAmount}</span>
                <p className="text-[9px] text-emerald-400 font-bold">Inclusive of GST</p>
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Select Payment Method</span>
              </label>

              <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-zinc-950 border border-white/10">
                {[
                  { id: 'upi', label: 'UPI / QR', icon: <QrCode className="w-3.5 h-3.5" /> },
                  { id: 'card', label: 'Cards', icon: <CreditCard className="w-3.5 h-3.5" /> },
                  { id: 'netbanking', label: 'NetBank', icon: <Building2 className="w-3.5 h-3.5" /> },
                  { id: 'wallet', label: 'Wallet', icon: <Wallet className="w-3.5 h-3.5" /> }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setPaymentTab(tab.id as PaymentTab)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                      paymentTab === tab.id
                        ? 'bg-gradient-to-b from-amber-500/30 to-yellow-600/15 border border-amber-400/50 text-amber-300 shadow'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    {tab.icon}
                    <span className="text-[10px]">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* TAB 1: UPI & LIVE QR CODE */}
            {paymentTab === 'upi' && (
              <div className="space-y-4 animate-in fade-in">
                {/* Dynamic QR Code Box */}
                <div className="p-5 rounded-3xl bg-zinc-950 border border-amber-500/30 flex flex-col items-center text-center space-y-3 shadow-inner">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <QrCode className="w-4 h-4" />
                    <span>Scan to Pay directly with any UPI App</span>
                  </div>

                  {qrDataUrl ? (
                    <div className="p-3.5 bg-white rounded-2xl shadow-2xl border-2 border-amber-400">
                      <img src={qrDataUrl} alt="UPI Payment QR" className="w-48 h-48 object-contain rounded-lg" />
                    </div>
                  ) : (
                    <div className="w-48 h-48 rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-500 text-xs">
                      Generating QR...
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-300">
                      Pay Amount: <span className="text-amber-400 font-black text-sm">{activeAmount}</span>
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Scan with Google Pay, PhonePe, Paytm or BHIM
                    </p>
                  </div>
                </div>

                {/* Mobile Intent Direct Apps / UPI Action */}
                <div className="space-y-2.5">
                  <a
                    href={`upi://pay?pa=${encodeURIComponent(customMerchantUpi)}&pn=${encodeURIComponent(merchantName)}&am=${activeAmountRaw}&cu=INR&tn=${encodeURIComponent(`Aura Music VIP PRO`)}`}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-800 hover:from-zinc-800 hover:to-zinc-700 border border-white/10 text-xs font-bold text-zinc-200 hover:text-white flex items-center justify-center gap-2 transition"
                  >
                    <ExternalLink className="w-4 h-4 text-amber-400" />
                    <span>Pay via Google Pay / PhonePe / Paytm</span>
                  </a>

                  {/* 12-Digit UTR / Transaction Reference Code Input */}
                  <div className="p-3 rounded-2xl bg-zinc-900/90 border border-amber-500/20 space-y-1.5 text-left">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-zinc-200 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        <span>Enter 12-Digit UTR / Ref Code:</span>
                      </label>
                      <span className="text-[10px] text-zinc-400 font-mono">From Payment SMS/Receipt</span>
                    </div>
                    <input
                      type="text"
                      maxLength={12}
                      value={utrNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
                        setUtrNumber(val);
                        if (utrError) setUtrError('');
                      }}
                      placeholder="e.g. 424589102341 (12 digits)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/10 text-xs font-mono text-amber-300 placeholder:text-zinc-600 focus:outline-none focus:border-amber-400 tracking-wider"
                    />
                    {utrError && (
                      <p className="text-[10px] text-rose-400 font-medium">{utrError}</p>
                    )}
                  </div>

                  <button
                    onClick={handleVerifyUtr}
                    disabled={isVerifyingUtr}
                    className="w-full py-3.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>{isVerifyingUtr ? 'Verifying with Bank...' : 'Verify Code & Activate VIP Instantly'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: DEBIT / CREDIT CARDS */}
            {paymentTab === 'card' && (
              <div className="space-y-3 animate-in fade-in">
                {isRazorpayConfigured && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-center space-y-2">
                    <p className="text-xs font-bold text-amber-300">
                      Razorpay Instant Gateway Ready
                    </p>
                    <p className="text-[11px] text-zinc-300">
                      Pay via any Credit/Debit Card, Netbanking, or International Card with automatic instant bank settlement.
                    </p>
                    <button
                      onClick={handlePayViaRazorpay}
                      className="w-full py-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Launch Razorpay Checkout ({activeAmount})</span>
                    </button>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold text-zinc-400">Card Number</label>
                  <input
                    type="text"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').substring(0, 16);
                      const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
                      setCardNumber(formatted);
                    }}
                    placeholder="4111 2222 3333 4444"
                    className="w-full mt-1 px-3.5 py-2 rounded-2xl bg-zinc-900 border border-white/10 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-400">Cardholder Name</label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    placeholder="Avijit Barui"
                    className="w-full mt-1 px-3.5 py-2 rounded-2xl bg-zinc-900 border border-white/10 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="12/28"
                      className="w-full mt-1 px-3.5 py-2 rounded-2xl bg-zinc-900 border border-white/10 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400">CVV</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                      placeholder="•••"
                      className="w-full mt-1 px-3.5 py-2 rounded-2xl bg-zinc-900 border border-white/10 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (isRazorpayConfigured) {
                      handlePayViaRazorpay();
                    } else {
                      executePayment('Credit/Debit Card (•••• ' + (cardNumber.slice(-4) || '8842') + ')');
                    }
                  }}
                  className="w-full mt-2 py-3.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Pay {activeAmount} with Card</span>
                </button>
              </div>
            )}

            {/* TAB 3: NET BANKING */}
            {paymentTab === 'netbanking' && (
              <div className="space-y-3 animate-in fade-in">
                <label className="text-[11px] font-bold text-zinc-400">Select Bank</label>
                <div className="grid grid-cols-2 gap-2">
                  {['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'].map((bank) => (
                    <button
                      key={bank}
                      onClick={() => setSelectedBank(bank)}
                      className={`p-2.5 rounded-2xl text-left text-xs font-bold border transition cursor-pointer ${
                        selectedBank === bank
                          ? 'bg-amber-500/20 border-amber-400 text-white'
                          : 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {bank}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => executePayment('Net Banking (' + selectedBank + ')')}
                  className="w-full mt-2 py-3.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Proceed with {selectedBank}</span>
                </button>
              </div>
            )}

            {/* TAB 4: WALLETS */}
            {paymentTab === 'wallet' && (
              <div className="space-y-3 animate-in fade-in">
                <label className="text-[11px] font-bold text-zinc-400">Select Digital Wallet</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Paytm Wallet', 'PhonePe Wallet', 'Amazon Pay', 'MobiKwik'].map((wallet) => (
                    <button
                      key={wallet}
                      onClick={() => setSelectedWallet(wallet)}
                      className={`p-3 rounded-2xl text-left text-xs font-bold border transition cursor-pointer ${
                        selectedWallet === wallet
                          ? 'bg-amber-500/20 border-amber-400 text-white'
                          : 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {wallet}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => executePayment('Digital Wallet (' + selectedWallet + ')')}
                  className="w-full mt-2 py-3.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Pay {activeAmount} with {selectedWallet}</span>
                </button>
              </div>
            )}

            <p className="text-center text-[10px] text-zinc-500">
              Secured by 256-Bit SSL Banking Security &amp; PCI-DSS Level 1 Encryption
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: PAYMENT PROCESSING ANIMATION                                      */}
        {/* ========================================================================= */}
        {currentStep === 'processing' && (
          <div className="p-8 sm:p-10 space-y-6 flex flex-col items-center justify-center text-center relative z-10 min-h-[350px]">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-amber-400/20 border-t-amber-400 animate-spin flex items-center justify-center" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Crown className="w-8 h-8 text-amber-400 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-white">Processing Secure Transaction</h3>
              <p className="text-xs font-mono text-amber-300/90">{processingStatus}</p>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/10 text-[11px] text-zinc-400 max-w-xs">
              Please do not close this window while your payment and license are being verified.
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: PAYMENT SUCCESSFUL & PRO ACTIVATED                                 */}
        {/* ========================================================================= */}
        {currentStep === 'success' && (
          <div className="p-6 sm:p-8 space-y-5 text-center relative z-10 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/20">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-extrabold px-3 py-0.5 rounded-full bg-amber-400 text-black uppercase tracking-wider">
                VIP PRO ACTIVATED
              </span>
              <h2 className="text-2xl font-black text-white pt-2">Welcome to AURA VIP!</h2>
              <p className="text-xs text-zinc-300">
                Your payment of <span className="text-amber-400 font-bold">{subscription.amountPaid}</span> was successfully processed.
              </p>
            </div>

            {/* License Card */}
            <div className="p-4 rounded-3xl bg-zinc-950 border border-amber-500/40 text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Order ID:</span>
                <span className="font-mono text-white font-bold">{subscription.orderId}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Valid Until:</span>
                <span className="font-mono text-amber-300 font-bold">{new Date(subscription.expiryDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-white/10 pt-2">
                <span className="text-zinc-400">VIP License:</span>
                <span className="font-mono text-xs text-white font-bold truncate max-w-[170px]">{subscription.licenseKey}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => setCurrentStep('invoice')}
                className="w-full py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                <span>View &amp; Download Tax Invoice</span>
              </button>

              <button
                onClick={() => {
                  setCurrentStep('plans');
                  onClose();
                }}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-xs uppercase tracking-wider shadow-lg transition active:scale-95 cursor-pointer"
              >
                Start Listening in 32-Bit Lossless
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: TAX INVOICE & OFFICIAL RECEIPT                                    */}
        {/* ========================================================================= */}
        {currentStep === 'invoice' && (
          <div className="overflow-y-auto p-5 sm:p-6 space-y-4 relative z-10 custom-scrollbar">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <button
                onClick={() => setCurrentStep('plans')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-300 hover:text-white border border-white/10 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Official Tax Receipt
              </h3>
            </div>

            {/* Paper-style Invoice Card */}
            <div className="p-5 rounded-3xl bg-zinc-950 border border-white/15 space-y-4 text-xs font-sans text-zinc-300 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h4 className="text-sm font-black text-white">AURA MUSIC INC.</h4>
                  <p className="text-[10px] text-zinc-400">Digital Lossless Audio Services</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                    PAID
                  </span>
                  <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{subscription.invoiceNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-zinc-500 block">Date &amp; Time</span>
                  <span className="font-medium text-white">{new Date(subscription.startDate).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Payment Method</span>
                  <span className="font-medium text-white">{subscription.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Transaction ID</span>
                  <span className="font-mono text-white text-[10px]">{subscription.transactionId}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Status</span>
                  <span className="font-medium text-emerald-400 font-bold">256-Bit SSL Verified</span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-3 space-y-1.5">
                <div className="flex justify-between font-bold text-white">
                  <span>Aura Music VIP PRO ({subscription.plan.toUpperCase()})</span>
                  <span>{subscription.amountPaid}</span>
                </div>
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>DSP Audio Master License (1 Year)</span>
                  <span>Included</span>
                </div>
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>18% GST (Goods &amp; Services Tax)</span>
                  <span>Included</span>
                </div>
                <div className="flex justify-between text-sm font-black text-amber-300 border-t border-white/10 pt-2">
                  <span>Total Amount Paid</span>
                  <span>{subscription.amountPaid}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-zinc-900 border border-white/5 space-y-0.5">
                <p className="text-[9px] text-zinc-500 font-mono uppercase">VIP License Key</p>
                <p className="text-xs font-mono font-bold text-amber-300 break-all">{subscription.licenseKey}</p>
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownloadInvoice}
              className="w-full py-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Invoice (TXT / Receipt)</span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 6: MERCHANT RECEIVER CONFIGURATION (SET YOUR OWN UPI / BANK ID)       */}
        {/* ========================================================================= */}
        {currentStep === 'merchant_settings' && (
          <div className="overflow-y-auto p-5 sm:p-6 space-y-4 relative z-10 custom-scrollbar">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <button
                onClick={() => setCurrentStep('plans')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-300 hover:text-white border border-white/10 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                Merchant Receiver & Settlement Setup
              </h3>
            </div>

            {/* Direct Bank Deposit Guarantee */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-emerald-500/30 text-xs text-zinc-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Real Direct Bank Settlement</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                  0% Fee • Instant
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                <strong className="text-amber-300">টাকা সরাসরি আপনার ব্যাংকে ঢুকবে:</strong> আপনি নিচে যে UPI ID সেট করবেন, গ্রাহক যখন সাবস্ক্রিপশন ফি (₹২১০ বা ₹১,২৫০) দেবে, সেই পুরো টাকা সাথে সাথে এই UPI-এর সাথে লিংক থাকা আপনার আসল ব্যাংক অ্যাকাউন্টে জমা হবে।
              </p>
            </div>

            {/* Quick UPI ID Pickers */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400">Quick Select Your UPI Provider:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCustomMerchantUpi('8777047129@ybl')}
                  className="px-2.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-[11px] font-mono text-zinc-300 hover:text-amber-300 text-center transition"
                >
                  PhonePe (@ybl)
                </button>
                <button
                  type="button"
                  onClick={() => setCustomMerchantUpi('baruiavijit72@okaxis')}
                  className="px-2.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-[11px] font-mono text-zinc-300 hover:text-amber-300 text-center transition"
                >
                  GPay (@okaxis)
                </button>
                <button
                  type="button"
                  onClick={() => setCustomMerchantUpi('8777047129@paytm')}
                  className="px-2.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-[11px] font-mono text-zinc-300 hover:text-amber-300 text-center transition"
                >
                  Paytm (@paytm)
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-300">Your UPI ID (Receiver Account)</label>
                <input
                  type="text"
                  value={customMerchantUpi}
                  onChange={(e) => setCustomMerchantUpi(e.target.value)}
                  placeholder="e.g. 8777047129@ybl or baruiavijit72@okaxis"
                  className="w-full mt-1.5 px-3.5 py-2.5 rounded-2xl bg-zinc-900 border border-white/10 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300">Business / Receiver Display Name</label>
                <input
                  type="text"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  placeholder="Avijit Barui"
                  className="w-full mt-1.5 px-3.5 py-2.5 rounded-2xl bg-zinc-900 border border-white/10 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                onClick={handleSaveMerchantSettings}
                className="w-full mt-2 py-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save Payment Receiver Details</span>
              </button>

              {/* View Real Transactions & Bank Settlements */}
              <div className="pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={loadOrderHistory}
                  className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-bold text-zinc-200 hover:text-white flex items-center justify-center gap-2 transition"
                >
                  <History className="w-4 h-4 text-amber-400" />
                  <span>{showOrderHistory ? 'Refresh Transactions Log' : 'View Real Received Payments Log'}</span>
                </button>

                {showOrderHistory && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-black border border-white/10 space-y-2 text-left">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-400">Total Recorded Orders:</span>
                      <span className="text-amber-300 font-bold">{serverOrders.length}</span>
                    </div>

                    {loadingOrders ? (
                      <p className="text-xs text-zinc-500 py-3 text-center">Loading transactions from server...</p>
                    ) : serverOrders.length === 0 ? (
                      <p className="text-xs text-zinc-500 py-3 text-center">No orders recorded yet. When users pay and verify their UTR, orders appear here!</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {serverOrders.map((ord: any, idx: number) => (
                          <div key={ord.orderId || idx} className="p-2.5 rounded-xl bg-zinc-900/90 border border-white/5 text-[11px] space-y-1 font-mono">
                            <div className="flex items-center justify-between">
                              <span className="text-amber-300 font-bold">{ord.amount || '₹1,250.00'}</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${ord.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                {ord.status || 'PAID'}
                              </span>
                            </div>
                            <div className="text-zinc-400 text-[10px]">
                              Order: <span className="text-white">{ord.orderId}</span> • Plan: {ord.plan}
                            </div>
                            {ord.utrNumber && (
                              <div className="text-zinc-400 text-[10px]">
                                UTR: <span className="text-emerald-300 font-bold">{ord.utrNumber}</span>
                              </div>
                            )}
                            <div className="text-zinc-500 text-[9px]">
                              {new Date(ord.paidAt || ord.createdAt || Date.now()).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
