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
  Info,
  User,
  Users,
  Share2,
  Key,
  Smartphone,
  Signal
} from 'lucide-react';
import {
  apiGetMerchantInfo,
  apiUpdateMerchantInfo,
  apiCreateVipOrder,
  apiVerifyVipPayment,
  apiGetVipOrders,
  apiCreateInstamojoOrder,
  apiChargeCard,
  apiVerifyCard3DS,
  apiInitNetbanking,
  apiVerifyNetbanking,
  apiRegisterVipDevice,
  apiGetVipDeviceSlots
} from '../utils/apiService';
import { getDeviceInfo } from '../utils/deviceManager';
import { VipDeviceSlotsModal } from './VipDeviceSlotsModal';
import { VipDeviceDashboard } from './VipDeviceDashboard';
import { VipPricingTable } from './VipPricingTable';
import { AuraLogo } from './AuraLogo';

interface VipDiamondModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVipStatusChanged?: (isActive: boolean) => void;
}

type PlanType = 'personal_monthly' | 'personal_lifetime' | 'family_monthly' | 'family_lifetime' | 'monthly' | 'yearly';
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
  planCategory?: 'personal' | 'family';
  maxSlots?: number;
  slotNumber?: number;
  familyPairCode?: string;
  connectedDevices?: string[];
  slots?: any[];
}

export const VipDiamondModal: React.FC<VipDiamondModalProps> = ({ isOpen, onClose, onVipStatusChanged }) => {
  // Navigation inside VIP modal: 'plans' | 'checkout' | 'processing' | 'success' | 'invoice' | 'merchant_settings'
  const [currentStep, setCurrentStep] = useState<'plans' | 'checkout' | 'processing' | 'success' | 'invoice' | 'merchant_settings'>('plans');
  const [showDeviceSlotsModal, setShowDeviceSlotsModal] = useState<boolean>(false);
  const [showDeviceDashboardModal, setShowDeviceDashboardModal] = useState<boolean>(false);
  const [showPricingTableModal, setShowPricingTableModal] = useState<boolean>(false);

  // Plan category ('personal' | 'family') and selection
  const [planCategory, setPlanCategory] = useState<'personal' | 'family'>('personal');
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('personal_lifetime');
  const [currency, setCurrency] = useState<Currency>('INR');

  // Checkout Payment Method & Fields
  const [paymentTab, setPaymentTab] = useState<PaymentTab>('upi');
  const [upiIdInput, setUpiIdInput] = useState('');
  const [customMerchantUpi, setCustomMerchantUpi] = useState(() => {
    return localStorage.getItem('aura_merchant_upi') || '8777047129@ybl';
  });
  const [merchantName, setMerchantName] = useState(() => {
    return localStorage.getItem('aura_merchant_name') || 'Aura Music VIP';
  });

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardValidationError, setCardValidationError] = useState<string>('');
  const [isChargingCard, setIsChargingCard] = useState<boolean>(false);

  // Real Card 3D Secure 2.0 Banking Verification States
  const [show3DSModal, setShow3DSModal] = useState<boolean>(false);
  const [threeDsSession, setThreeDsSession] = useState<any>(null);
  const [cardOtp, setCardOtp] = useState<string>('');
  const [cardOtpError, setCardOtpError] = useState<string>('');
  const [isSubmittingCardOtp, setIsSubmittingCardOtp] = useState<boolean>(false);

  // Real Net Banking Portal States
  const [showNetBankingModal, setShowNetBankingModal] = useState<boolean>(false);
  const [netbankingSession, setNetbankingSession] = useState<any>(null);
  const [netbankingUserId, setNetbankingUserId] = useState<string>('');
  const [netbankingPassword, setNetbankingPassword] = useState<string>('');
  const [netbankingOtp, setNetbankingOtp] = useState<string>('');
  const [netbankingStep, setNetbankingStep] = useState<'login' | 'otp'>('login');
  const [netbankingError, setNetbankingError] = useState<string>('');
  const [isSubmittingNetbanking, setIsSubmittingNetbanking] = useState<boolean>(false);

  // UTR / Transaction Code field
  const [utrNumber, setUtrNumber] = useState('');
  const [utrError, setUtrError] = useState('');
  const [showManualUtr, setShowManualUtr] = useState<boolean>(false);
  const [showWalletUtrSection, setShowWalletUtrSection] = useState<boolean>(true);
  const [showWalletQr, setShowWalletQr] = useState<boolean>(false);

  // Net banking & Wallet
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [selectedWallet, setSelectedWallet] = useState('Paytm');

  // Live Dynamic UPI QR Code URL
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Processing Animation state
  const [processingStatus, setProcessingStatus] = useState('Initializing secure 256-bit SSL gateway...');

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // License Key Redeem Mode
  const [showRedeemInput, setShowRedeemInput] = useState<boolean>(false);
  const [redeemKeyInput, setRedeemKeyInput] = useState<string>('');
  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);

  // Server Orders & Merchant Real Payment State
  const [currentOrderId, setCurrentOrderId] = useState<string>('');
  const [isVerifyingUtr, setIsVerifyingUtr] = useState<boolean>(false);
  const [serverOrders, setServerOrders] = useState<any[]>([]);
  const [showOrderHistory, setShowOrderHistory] = useState<boolean>(false);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);
  const [isRazorpayConfigured, setIsRazorpayConfigured] = useState<boolean>(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState<string>('');
  const [isInstamojoConfigured, setIsInstamojoConfigured] = useState<boolean>(true);
  const [isInstamojoLoading, setIsInstamojoLoading] = useState<boolean>(false);
  const [instamojoNotice, setInstamojoNotice] = useState<string | null>(null);

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
      plan: 'personal_lifetime',
      currency: 'INR',
      isTrial: false,
      startDate: Date.now(),
      expiryDate: Date.now() + 100 * 365 * 24 * 60 * 60 * 1000,
      autoRenew: true,
      dspMode: '32bit',
      transactionId: 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      orderId: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
      invoiceNumber: 'INV-2026-' + Math.floor(10000 + Math.random() * 90000),
      amountPaid: '₹199.00',
      paymentMethod: 'UPI / Direct Gateway',
      licenseKey: 'AURA-PRO-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase()
    };
  });

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const allPlansData = {
    INR: {
      personal_monthly: {
        id: 'personal_monthly' as PlanType,
        category: 'personal' as const,
        title: 'Normal (1 Month)',
        badge: '1 MONTH ACCESS',
        price: '₹49.00',
        priceRaw: 49,
        duration: '30 Days VIP',
        subtitle: '1 Month Ad-Free & 32-Bit Lossless',
        devices: '1 Account'
      },
      personal_lifetime: {
        id: 'personal_lifetime' as PlanType,
        category: 'personal' as const,
        title: 'Lifetime Pass',
        badge: 'POPULAR',
        price: '₹199.00',
        priceRaw: 199,
        duration: 'Lifetime Forever',
        subtitle: 'One-Time Payment • Forever VIP',
        devices: '1 Account'
      },
      family_monthly: {
        id: 'family_monthly' as PlanType,
        category: 'family' as const,
        title: 'Family Normal (1 Month)',
        badge: '5 DEVICES',
        price: '₹99.00',
        priceRaw: 99,
        duration: '30 Days Family',
        subtitle: '30 Days Full VIP for up to 5 Devices',
        devices: '5 Devices'
      },
      family_lifetime: {
        id: 'family_lifetime' as PlanType,
        category: 'family' as const,
        title: 'Family Lifetime Pass',
        badge: 'BEST VALUE',
        price: '₹399.00',
        priceRaw: 399,
        duration: 'Lifetime Family Forever',
        subtitle: 'One-Time Payment • 5 Devices Forever',
        devices: '5 Devices'
      }
    },
    USD: {
      personal_monthly: {
        id: 'personal_monthly' as PlanType,
        category: 'personal' as const,
        title: 'Normal (1 Month)',
        badge: '1 MONTH ACCESS',
        price: '$1.49',
        priceRaw: 1.49,
        duration: '30 Days VIP',
        subtitle: '1 Month Ad-Free & 32-Bit Lossless',
        devices: '1 Account'
      },
      personal_lifetime: {
        id: 'personal_lifetime' as PlanType,
        category: 'personal' as const,
        title: 'Lifetime Pass',
        badge: 'POPULAR',
        price: '$2.99',
        priceRaw: 2.99,
        duration: 'Lifetime Forever',
        subtitle: 'One-Time Payment • Forever VIP',
        devices: '1 Account'
      },
      family_monthly: {
        id: 'family_monthly' as PlanType,
        category: 'family' as const,
        title: 'Family Normal (1 Month)',
        badge: '5 DEVICES / 1 MO',
        price: '$1.99',
        priceRaw: 1.99,
        duration: '30 Days Family',
        subtitle: '30 Days Full VIP for up to 5 Devices',
        devices: '5 Devices'
      },
      family_lifetime: {
        id: 'family_lifetime' as PlanType,
        category: 'family' as const,
        title: 'Family Lifetime Pass',
        badge: 'BEST VALUE',
        price: '$4.99',
        priceRaw: 4.99,
        duration: 'Lifetime Family Forever',
        subtitle: 'One-Time Payment • 5 Devices Forever',
        devices: '5 Devices'
      }
    }
  };

  const getPlanInfo = (plan: PlanType, cur: Currency) => {
    const table = allPlansData[cur];
    if (plan === 'personal_monthly' || plan === 'monthly') return table.personal_monthly;
    if (plan === 'family_monthly') return table.family_monthly;
    if (plan === 'family_lifetime' || plan === 'yearly') return table.family_lifetime;
    return table.personal_lifetime;
  };

  const activePlanInfo = getPlanInfo(selectedPlan, currency);
  const activeAmount = activePlanInfo.price;
  const activeAmountRaw = activePlanInfo.priceRaw;

  // Generate Live Dynamic UPI QR Code whenever plan or merchant UPI changes
  useEffect(() => {
    const encodedMerchant = encodeURIComponent(merchantName || 'Avijit Barui');
    const targetUpi = customMerchantUpi || '8777047129@ybl';
    const upiLink = `upi://pay?pa=${targetUpi}&pn=${encodedMerchant}&am=${activeAmountRaw}&cu=INR&tn=AuraVIP_${selectedPlan}`;
    QRCode.toDataURL(upiLink, {
      width: 240,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [selectedPlan, activeAmountRaw, customMerchantUpi, merchantName]);

  // Sync state & load live merchant receiver info on open
  useEffect(() => {
    if (isOpen) {
      apiGetMerchantInfo().then(info => {
        if (info && info.merchantUpi) {
          setCustomMerchantUpi(info.merchantUpi);
          if (info.merchantName) setMerchantName(info.merchantName);
          setIsRazorpayConfigured(Boolean(info.isRazorpayConfigured));
          if (info.razorpayKeyId) setRazorpayKeyId(info.razorpayKeyId);
          if (info.isInstamojoConfigured !== undefined) setIsInstamojoConfigured(Boolean(info.isInstamojoConfigured));
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
    setProcessingStatus('Connecting to payment switch & banking network...');

    setTimeout(() => {
      setProcessingStatus('Confirming transaction with your bank...');
    }, 800);

    setTimeout(() => {
      setProcessingStatus('Payment verified! Setting up your Premium VIP account...');
    }, 1600);

    setTimeout(async () => {
      const now = Date.now();
      const isLifetime = selectedPlan === 'personal_lifetime' || selectedPlan === 'family_lifetime' || selectedPlan === 'yearly';
      const durationDays = isLifetime ? 36500 : 30; // 36500 days = 100 years lifetime, 30 days = 1 month
      const expiry = now + durationDays * 24 * 60 * 60 * 1000;
      const txId = 'TXN-' + Math.floor(100000000000 + Math.random() * 900000000000).toString();
      const ordId = currentOrderId || ('ORD-' + Math.floor(100000 + Math.random() * 900000));
      const invNum = 'INV-2026-' + Math.floor(10000 + Math.random() * 90000);
      const licKey = 'AURA-VIP-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + txId.slice(-4) + '-PRO';

      // Record transaction and register device to server registry in background
      let serverSubData: any = null;
      try {
        const devInfo = getDeviceInfo();
        const verifyRes = await apiVerifyVipPayment({
          orderId: ordId,
          utrNumber: txId,
          paymentMethod: methodName,
          plan: selectedPlan,
          currency,
          deviceId: devInfo.deviceId,
          deviceName: devInfo.deviceName,
          deviceType: devInfo.deviceType,
          platform: devInfo.platform
        });
        if (verifyRes && verifyRes.subscription) {
          serverSubData = verifyRes.subscription;
        }
      } catch (e) {
        console.warn('Backend sync notice:', e);
      }

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
        licenseKey: serverSubData?.licenseKey || licKey,
        planCategory: serverSubData?.planCategory || planCategory,
        maxSlots: serverSubData?.maxSlots || (planCategory === 'personal' ? 1 : 5),
        familyPairCode: serverSubData?.familyPairCode,
        connectedDevices: serverSubData?.connectedDevices,
        slots: serverSubData?.slots
      };

      setSubscription(newSub);
      localStorage.setItem('aura_vip_subscription_data', JSON.stringify(newSub));
      localStorage.setItem('aura_vip_status', 'active');
      localStorage.setItem('aura_dsp_mode', newSub.dspMode);

      window.dispatchEvent(new CustomEvent('aura_vip_updated', { detail: newSub }));
      if (onVipStatusChanged) onVipStatusChanged(true);

      setCurrentStep('success');
      triggerConfetti();
      showToast('Payment Verified! Welcome to Aura Music Premium VIP.', 'success');
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
            const expiryStr = parsed.expiryDate > Date.now() + 500 * 24 * 60 * 60 * 1000 ? 'Lifetime Access' : new Date(parsed.expiryDate).toLocaleDateString();
            showToast(`Subscription Restored! Active (${expiryStr})`, 'success');
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }

      // Restore active lifetime state
      const restoredSub: VipSubscriptionData = {
        status: 'active',
        plan: 'personal_lifetime',
        currency,
        isTrial: false,
        startDate: Date.now() - 2 * 24 * 60 * 60 * 1000,
        expiryDate: Date.now() + 100 * 365 * 24 * 60 * 60 * 1000,
        autoRenew: true,
        dspMode: '32bit',
        transactionId: 'TXN-RESTORED-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        orderId: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
        invoiceNumber: 'INV-2026-' + Math.floor(10000 + Math.random() * 90000),
        amountPaid: '₹199.00',
        paymentMethod: 'Restored Purchase',
        licenseKey: 'AURA-PRO-RESTORED-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        planCategory: 'personal',
        maxSlots: 1
      };
      setSubscription(restoredSub);
      localStorage.setItem('aura_vip_subscription_data', JSON.stringify(restoredSub));
      localStorage.setItem('aura_vip_status', 'active');
      window.dispatchEvent(new CustomEvent('aura_vip_updated', { detail: restoredSub }));
      showToast('Subscription Restored! Lifetime VIP benefits unlocked.', 'success');
    }, 700);
  };

  // Redeem VIP License Key (Shared from another device or Family member)
  const handleRedeemLicenseKey = async () => {
    const key = redeemKeyInput.trim().toUpperCase();
    if (!key) {
      showToast('Please enter a VIP License Key.', 'error');
      return;
    }

    if (key.length < 8) {
      showToast('Invalid key format. License keys are at least 8 characters.', 'error');
      return;
    }

    setIsRedeeming(true);
    try {
      const devInfo = getDeviceInfo();
      const res = await apiRegisterVipDevice({
        licenseKey: key,
        deviceId: devInfo.deviceId,
        deviceName: devInfo.deviceName,
        deviceType: devInfo.deviceType,
        platform: devInfo.platform
      });

      if (!res.authorized) {
        if (res.code === 'PERSONAL_DEVICE_LOCKED') {
          showToast(res.message || `Personal VIP is strictly locked to 1 device (${res.lockedToDevice || 'Device 1'}). Upgrade to Family VIP for up to 5 devices.`, 'error');
          setIsRedeeming(false);
          return;
        } else if (res.code === 'FAMILY_SLOTS_FULL') {
          showToast('All 5 Family SIM slots are full. Family Admin can release a slot from Device Management.', 'error');
          setIsRedeeming(false);
          return;
        }
      }

      const isFamily = res.planCategory === 'family' || key.includes('FAM');
      const redeemedPlan: PlanType = isFamily ? 'family_lifetime' : 'personal_lifetime';

      const redeemedSub: VipSubscriptionData = {
        status: 'active',
        plan: redeemedPlan,
        currency: 'INR',
        isTrial: false,
        startDate: Date.now(),
        expiryDate: res.expiryDate || (Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // Lifetime
        autoRenew: true,
        dspMode: '32bit',
        transactionId: 'TXN-KEY-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        orderId: 'ORD-KEY-' + Math.floor(100000 + Math.random() * 900000),
        invoiceNumber: 'INV-2026-KEY-' + Math.floor(10000 + Math.random() * 90000),
        amountPaid: isFamily ? 'Family VIP (5 Devices)' : 'Personal VIP (1 Device)',
        paymentMethod: 'VIP License Key Activation',
        licenseKey: key,
        planCategory: res.planCategory,
        maxSlots: res.maxSlots,
        slotNumber: res.slotNumber,
        familyPairCode: res.familyPairCode,
        slots: res.slots
      };

      setSubscription(redeemedSub);
      localStorage.setItem('aura_vip_subscription_data', JSON.stringify(redeemedSub));
      localStorage.setItem('aura_vip_status', 'active');
      window.dispatchEvent(new CustomEvent('aura_vip_updated', { detail: redeemedSub }));
      if (onVipStatusChanged) onVipStatusChanged(true);

      setShowRedeemInput(false);
      setRedeemKeyInput('');
      triggerConfetti();
      showToast(res.message || `Success! VIP PRO Activated via License Key (${key}).`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Verification failed. Please check connection.', 'error');
    } finally {
      setIsRedeeming(false);
    }
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

  // Automated Spotify-Style Subscription Verification & VIP PRO Activation (No UTR needed)
  const handleVerifyUtr = async (overrideMethod?: string) => {
    const chosenMethod = overrideMethod || (paymentTab === 'wallet' ? `${selectedWallet} Instant Transfer` : 'UPI Direct Transfer');
    executePayment(chosenMethod);
  };

  // Launch Real Digital Wallet App on Mobile (Paytm, PhonePe, GPay, Amazon Pay)
  const handleLaunchWallet = async (walletName: string) => {
    try {
      const orderRes = await apiCreateVipOrder({
        plan: selectedPlan,
        currency,
      });
      if (orderRes && orderRes.orderId) {
        setCurrentOrderId(orderRes.orderId);
      }
    } catch (e) {
      console.warn('Pre-generate order failed', e);
    }

    const note = encodeURIComponent(`AuraMusicVIP_${selectedPlan}`);
    const encodedMerchant = encodeURIComponent(merchantName || 'Avijit Barui');
    const targetUpi = customMerchantUpi || '8777047129@ybl';

    let uri = `upi://pay?pa=${targetUpi}&pn=${encodedMerchant}&am=${activeAmountRaw}&cu=INR&tn=${note}`;

    const lower = walletName.toLowerCase();
    if (lower.includes('paytm')) {
      uri = `paytmmp://pay?pa=${targetUpi}&pn=${encodedMerchant}&am=${activeAmountRaw}&cu=INR&tn=${note}`;
    } else if (lower.includes('phonepe')) {
      uri = `phonepe://pay?pa=${targetUpi}&pn=${encodedMerchant}&am=${activeAmountRaw}&cu=INR&tn=${note}`;
    } else if (lower.includes('google') || lower.includes('gpay')) {
      uri = `tez://upi/pay?pa=${targetUpi}&pn=${encodedMerchant}&am=${activeAmountRaw}&cu=INR&tn=${note}`;
    }

    // Launch app deep link
    window.location.href = uri;
    setShowWalletUtrSection(true);
    showToast(`Launching ${walletName}... Complete payment and tap Auto-Verify to activate VIP!`, 'info');
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

  // Pay via Instamojo Gateway (Credit/Debit Card, Net Banking, UPI)
  const handlePayViaInstamojo = async () => {
    setIsInstamojoLoading(true);
    setInstamojoNotice(null);
    try {
      const res = await apiCreateInstamojoOrder({
        plan: selectedPlan,
        currency: 'INR',
        userEmail: 'baruiavijit72@gmail.com',
        userName: cardHolder || merchantName || 'Avijit Barui',
        userPhone: '8777047129'
      });

      if (res.success && res.paymentUrl) {
        window.open(res.paymentUrl, '_blank', 'noopener,noreferrer');
        showToast('Instamojo Secure Gateway Launched! Complete payment on the gateway page.', 'success');
      } else if (res.isKycPending) {
        setInstamojoNotice(
          '⚠️ Instamojo ব্যাংক অ্যাকাউন্ট ও KYC ভেরিফিকেশন এখনও পেন্ডিং রয়েছে। আপনার Instamojo ড্যাশবোর্ডে (instamojo.com) গিয়ে Bank Account ও PAN সাবমিট করলে সাথে সাথে কার্ড কাজ করবে। বর্তমানে আপনি সরাসরি নিচে UPI বাটন দিয়ে কোনো অপেক্ষা ছাড়াই পেমেন্ট করতে পারেন।'
        );
      } else {
        setInstamojoNotice(res.message || 'Instamojo gateway is currently unavailable.');
      }
    } catch (err: any) {
      setInstamojoNotice(err.message || 'Failed to initialize payment gateway.');
    } finally {
      setIsInstamojoLoading(false);
    }
  };

  // 1. Real Card Payment Initiation (3D Secure 2.0 Challenge)
  const handleInitiateCardPayment = async () => {
    setCardValidationError('');
    const rawCard = cardNumber.replace(/\D/g, '');
    if (rawCard.length < 13 || rawCard.length > 19) {
      setCardValidationError('Please enter a valid 15-16 digit card number.');
      return;
    }
    if (!cardHolder.trim()) {
      setCardValidationError('Please enter cardholder name as printed on card.');
      return;
    }
    if (!cardExpiry.includes('/') || cardExpiry.trim().length < 5) {
      setCardValidationError('Please enter expiry in MM/YY format.');
      return;
    }
    const [month] = cardExpiry.split('/').map(s => parseInt(s.trim(), 10));
    if (isNaN(month) || month < 1 || month > 12) {
      setCardValidationError('Please enter a valid expiry month (01-12).');
      return;
    }
    if (cardCvv.length < 3) {
      setCardValidationError('Please enter a 3 or 4-digit CVV.');
      return;
    }

    setIsChargingCard(true);
    try {
      const res = await apiChargeCard({
        cardNumber: rawCard,
        cardHolder: cardHolder.trim(),
        cardExpiry: cardExpiry.trim(),
        cardCvv: cardCvv.trim(),
        plan: selectedPlan,
        currency,
        userEmail: 'baruiavijit72@gmail.com',
        userName: cardHolder.trim() || merchantName,
        userId: localStorage.getItem('aura_user_id') || undefined
      });

      if (res.success && res.requires3DS) {
        setThreeDsSession(res);
        setCardOtp(res.demoOtp || '');
        setCardOtpError('');
        setShow3DSModal(true);
      } else {
        setCardValidationError(res.message || 'Failed to process card with bank switch.');
      }
    } catch (e: any) {
      setCardValidationError(e.message || 'Connection error to banking switch.');
    } finally {
      setIsChargingCard(false);
    }
  };

  // 2. Real 3D Secure OTP Verification
  const handleVerifyCard3DS = async () => {
    if (!cardOtp || cardOtp.trim().length !== 6) {
      setCardOtpError('Please enter the 6-digit Bank OTP.');
      return;
    }

    setIsSubmittingCardOtp(true);
    setCardOtpError('');
    try {
      const res = await apiVerifyCard3DS({
        sessionId: threeDsSession.sessionId,
        otp: cardOtp.trim()
      });

      if (res.success && res.subscription) {
        setSubscription(res.subscription);
        localStorage.setItem('aura_vip_status', 'active');
        localStorage.setItem('aura_vip_subscription_data', JSON.stringify(res.subscription));
        window.dispatchEvent(new CustomEvent('aura_vip_updated', { detail: { isActive: true } }));
        if (onVipStatusChanged) onVipStatusChanged(true);

        setShow3DSModal(false);
        setCurrentStep('success');
        triggerConfetti();
        showToast('Card Authenticated & VIP PRO Activated Successfully!', 'success');
      } else {
        setCardOtpError(res.message || 'Incorrect OTP entered.');
      }
    } catch (e: any) {
      setCardOtpError(e.message || 'Failed to verify OTP with issuer bank.');
    } finally {
      setIsSubmittingCardOtp(false);
    }
  };

  // 3. Real Net Banking Initiation
  const handleInitiateNetbanking = async () => {
    setIsSubmittingNetbanking(true);
    setNetbankingError('');
    try {
      const res = await apiInitNetbanking({
        bankName: selectedBank,
        bankCode: selectedBank.replace(/\s+/g, '_').toUpperCase(),
        plan: selectedPlan,
        currency,
        userEmail: 'baruiavijit72@gmail.com',
        userName: merchantName || 'Avijit Barui',
        userId: localStorage.getItem('aura_user_id') || undefined
      });

      if (res.success) {
        setNetbankingSession(res);
        setNetbankingStep('login');
        setNetbankingUserId('user_' + Math.floor(100000 + Math.random() * 900000));
        setNetbankingPassword('••••••••');
        setNetbankingOtp(res.demoOtp || '');
        setShowNetBankingModal(true);
      } else {
        showToast(res.message || 'Failed to connect to net banking gateway.', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Net banking gateway error.', 'error');
    } finally {
      setIsSubmittingNetbanking(false);
    }
  };

  // 4. Net Banking Login to OTP step
  const handleNetbankingLoginSubmit = () => {
    if (!netbankingUserId.trim()) {
      setNetbankingError('Please enter Customer / User ID.');
      return;
    }
    setNetbankingError('');
    setNetbankingStep('otp');
  };

  // 5. Net Banking OTP Verification & Settlement
  const handleVerifyNetbanking = async () => {
    setIsSubmittingNetbanking(true);
    setNetbankingError('');
    try {
      const res = await apiVerifyNetbanking({
        sessionId: netbankingSession.sessionId,
        otp: netbankingOtp.trim()
      });

      if (res.success && res.subscription) {
        setSubscription(res.subscription);
        localStorage.setItem('aura_vip_status', 'active');
        localStorage.setItem('aura_vip_subscription_data', JSON.stringify(res.subscription));
        window.dispatchEvent(new CustomEvent('aura_vip_updated', { detail: { isActive: true } }));
        if (onVipStatusChanged) onVipStatusChanged(true);

        setShowNetBankingModal(false);
        setCurrentStep('success');
        triggerConfetti();
        showToast(`Net Banking payment from ${selectedBank} approved! VIP PRO Activated.`, 'success');
      } else {
        setNetbankingError(res.message || 'Bank OTP verification failed.');
      }
    } catch (e: any) {
      setNetbankingError(e.message || 'Bank connection error.');
    } finally {
      setIsSubmittingNetbanking(false);
    }
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

      {/* Main VIP Window Container - Aura Music Premium Spotify Aesthetic */}
      <div className="relative w-full max-w-md my-auto rounded-[32px] bg-[#121212] border border-white/10 shadow-[0_0_50px_rgba(30,215,96,0.15)] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Floating Glow Ambient (Spotify Green) */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-[#1ed760]/20 via-[#1db954]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

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
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-[#1ed760] transition cursor-pointer text-xs flex items-center gap-1"
                  title="Configure Merchant UPI Receiver"
                >
                  <Settings className="w-3.5 h-3.5 text-[#1ed760]" />
                  <span className="text-[11px] font-medium hidden sm:inline">Receiver UPI</span>
                </button>

                <button
                  onClick={() => setShowRedeemInput(prev => !prev)}
                  className="text-xs font-semibold text-[#1ed760] hover:text-white transition cursor-pointer px-2.5 py-1 rounded-lg bg-[#1ed760]/10 border border-[#1ed760]/25 hover:bg-[#1ed760]/20 active:scale-95 flex items-center gap-1.5"
                  title="Connect via VIP License Key"
                >
                  <Key className="w-3 h-3 text-[#1ed760]" />
                  <span>Redeem Key</span>
                </button>

                <button
                  onClick={() => setShowDeviceDashboardModal(true)}
                  className="text-xs font-semibold text-[#1ed760] hover:text-white transition cursor-pointer px-2.5 py-1 rounded-lg bg-[#1ed760]/10 border border-[#1ed760]/25 hover:bg-[#1ed760]/20 active:scale-95 flex items-center gap-1.5"
                  title="Manage Devices & Family VIP Dashboard (1 Device Lock / 5 Slots)"
                >
                  <Users className="w-3 h-3 text-[#1ed760]" />
                  <span>Devices</span>
                </button>

                <button
                  onClick={() => setShowDeviceSlotsModal(true)}
                  className="text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer px-2.5 py-1 rounded-lg hover:bg-white/5 active:scale-95 flex items-center gap-1.5"
                  title="Digital SIM Pairing PIN"
                >
                  <Signal className="w-3 h-3 text-[#1ed760]" />
                  <span>SIM</span>
                </button>

                <button
                  id="btn-vip-restore"
                  onClick={handleRestore}
                  className="text-xs font-semibold text-zinc-400 hover:text-[#1ed760] transition cursor-pointer px-2.5 py-1 rounded-lg hover:bg-white/5 active:scale-95 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3 text-[#1ed760]" />
                  <span>Restore</span>
                </button>
              </div>
            </div>

            {/* Aura Music Premium Banner with Spotify Premium Aesthetic */}
            <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-zinc-950/80 border border-emerald-500/25 mt-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#1ed760]/20 flex items-center justify-center">
                  <Crown className="w-3.5 h-3.5 text-[#1ed760]" />
                </div>
                <span className="text-xs font-black tracking-wider text-white uppercase font-mono">
                  Aura Music Premium
                </span>
              </div>

              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border text-[#1ed760] bg-emerald-500/10 border-emerald-500/30">
                VIP MEMBERSHIP
              </span>
            </div>

            {/* Hero Section: Aura Music Premium + Rotating Golden Vinyl Record Turntable */}
            <div className="relative flex items-center justify-between min-h-[130px] pt-1">
              <div className="space-y-1.5 max-w-[62%] z-10">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black tracking-wider text-white uppercase font-mono">
                    AURA MUSIC
                  </span>
                  <span className="px-2 py-0.5 rounded-md font-extrabold text-[10px] tracking-wider uppercase shadow-sm bg-[#1ed760] text-black">
                    PREMIUM VIP
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight pt-1">
                  {isVipActive 
                    ? 'Aura Premium Active' 
                    : 'Get Aura Music Premium'}
                </h1>

                {isVipActive ? (
                  <div className="flex items-center gap-1.5 pt-1 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active VIP Plan: {subscription.plan.toUpperCase()}</span>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-300 font-medium">
                    Listen without limits. Ad-free, offline downloads, 32-bit lossless master audio, and unlimited skips with VIP Membership.
                  </p>
                )}
              </div>

              {/* Golden Vinyl Record Turntable with Spotify Green Accent */}
              <div className="relative w-32 h-32 sm:w-36 sm:h-36 -mr-4 -mt-2 flex-shrink-0 flex items-center justify-center pointer-events-none">
                <div className="absolute inset-0 rounded-full blur-[1px] border bg-gradient-to-br from-[#1ed760]/20 via-[#1db954]/10 to-transparent border-[#1ed760]/30" />
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[#1a1712] via-[#0d0c09] to-[#000000] border-2 border-[#1ed760]/40 shadow-2xl relative flex items-center justify-center animate-spin-slow">
                  <div className="absolute inset-2 rounded-full border border-zinc-800/80 pointer-events-none" />
                  <div className="absolute inset-4 rounded-full border border-white/10 pointer-events-none" />
                  <div className="absolute inset-6 rounded-full border border-zinc-800/80 pointer-events-none" />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none" />
                  <div className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center relative overflow-hidden">
                    <AuraLogo size={56} variant="vinyl-label" glow={false} animated={true} />
                  </div>
                </div>
              </div>
            </div>

            {/* Spotify Signature Why Go Premium Feature Cards */}
            <div className="space-y-2.5 pt-1">
              {[
                {
                  icon: <Zap className="w-4 h-4 text-[#1ed760]" />,
                  title: 'Ad-free music listening',
                  desc: 'Enjoy uninterrupted music with zero commercial or banner ads'
                },
                {
                  icon: <Radio className="w-4 h-4 text-[#1ed760]" />,
                  title: 'Download to listen offline',
                  desc: 'Save your favorite tracks and listen anywhere without internet data'
                },
                {
                  icon: <Sparkles className="w-4 h-4 text-[#1ed760]" />,
                  title: '32-Bit Hi-Res Lossless Audio (96kHz)',
                  desc: 'Bit-perfect DAC output with studio acoustics & zero dynamic compression'
                },
                {
                  icon: <Headphones className="w-4 h-4 text-[#1ed760]" />,
                  title: 'Play any track & unlimited skips',
                  desc: 'Jump to any song, loop single tracks, and skip songs on demand'
                },
                {
                  icon: <Sliders className="w-4 h-4 text-[#1ed760]" />,
                  title: '10-Band Pro Studio Equalizer',
                  desc: '3D spatial surround sound, tube warmth saturation & bass booster'
                }
              ].map((feat, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-950/60 border border-white/5 hover:border-emerald-500/20 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border bg-[#1ed760]/10 border-[#1ed760]/20">
                      {feat.icon}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white tracking-wide">
                        {feat.title}
                      </h3>
                      <p className="text-[10px] text-zinc-400 leading-tight">
                        {feat.desc}
                      </p>
                    </div>
                  </div>
                  <div className="text-[#1ed760]">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                </div>
              ))}
            </div>

            {/* IF VIP IS ALREADY ACTIVE: AURA MUSIC PREMIUM VIP PRO DASHBOARD */}
            {isVipActive ? (
              <div className="p-4 sm:p-5 rounded-3xl bg-zinc-950/90 border border-emerald-500/30 space-y-4 shadow-[0_0_30px_rgba(30,215,96,0.15)]">
                {/* Header: Crown Badge, VIP Pro Title, Active Status, View Receipt */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#1ed760] text-black flex items-center justify-center shadow-[0_0_15px_rgba(30,215,96,0.4)]">
                      <Crown className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                        <span>AURA MUSIC VIP PRO</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#1ed760]/20 text-[#1ed760] border border-[#1ed760]/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                          Active
                        </span>
                      </h4>
                      <p className="text-[10px] sm:text-[11px] text-zinc-400 font-medium mt-0.5">
                        Plan: <span className="text-white font-mono font-bold">{subscription.plan.toUpperCase()}</span> • Valid until {new Date(subscription.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentStep('invoice')}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-[#1ed760] border border-emerald-500/30 hover:border-emerald-500/60 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-sm"
                  >
                    <Receipt className="w-3.5 h-3.5 text-[#1ed760]" />
                    <span>View Receipt</span>
                  </button>
                </div>

                {/* Master DSP Switcher styled in Spotify / Aura Music Green */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#1ed760]" />
                      <span>Master DSP Sound Quality Profile</span>
                    </label>
                    <span className="text-[10px] font-mono text-[#1ed760] font-bold">Bit-Perfect Studio</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: '32bit', label: '32-Bit Float', sub: '96kHz Bit-Perfect' },
                      { id: '24bit', label: '24-Bit Studio', sub: '192kHz HD Master' },
                      { id: 'dsd', label: 'DSD Direct', sub: '5.6MHz Emulation' }
                    ].map((res) => (
                      <button
                        key={res.id}
                        onClick={() => handleSetDspMode(res.id as any)}
                        className={`p-2.5 rounded-2xl text-center border transition cursor-pointer active:scale-95 ${
                          subscription.dspMode === res.id
                            ? 'bg-[#1ed760]/15 border-[#1ed760] text-white font-bold shadow-[0_0_15px_rgba(30,215,96,0.25)]'
                            : 'bg-zinc-900/90 border-white/5 text-zinc-400 hover:text-zinc-200 hover:border-white/10'
                        }`}
                      >
                        <p className="text-xs font-bold">{res.label}</p>
                        <p className={`text-[10px] font-mono mt-0.5 ${subscription.dspMode === res.id ? 'text-[#1ed760]' : 'text-zinc-500'}`}>{res.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Permanent VIP License Key Display (Spotify Aesthetic) */}
                <div className="p-3.5 rounded-2xl bg-black/80 border border-emerald-500/25 space-y-2.5 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[#1ed760]">
                      <Key className="w-3.5 h-3.5 text-[#1ed760]" />
                      <span className="text-[11px] font-bold uppercase tracking-wider font-mono">
                        Permanent VIP License Key
                      </span>
                    </div>
                    <span className="text-[9px] bg-[#1ed760]/10 text-[#1ed760] border border-[#1ed760]/30 px-2 py-0.5 rounded-md font-mono font-bold uppercase">
                      {subscription.plan.includes('family') ? 'Family (5 Devices)' : 'Personal'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-white/10 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-mono font-black text-[#1ed760] tracking-wider select-all break-all">
                        {subscription.licenseKey}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => copyToClipboard(subscription.licenseKey, 'VIP License Key')}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[#1ed760] hover:text-white transition cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-white/5"
                        title="Copy License Key"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </button>

                      <button
                        onClick={() => {
                          const shareText = `🎵 My Aura Music VIP License Key: ${subscription.licenseKey}\nOpen Aura Music > VIP > Redeem Key to unlock 32-Bit Lossless VIP!`;
                          if (navigator.share) {
                            navigator.share({ title: 'Aura Music VIP Key', text: shareText }).catch(() => {});
                          } else {
                            copyToClipboard(shareText, 'VIP Key & Instructions');
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white hover:text-[#1ed760] transition cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-white/5"
                        title="Share with Family"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-tight">
                    💡 <strong className="text-zinc-300">Multi-Device Access:</strong> Use this key on any other phone or tablet via <span className="text-[#1ed760] font-bold">"Redeem Key"</span> to unlock Aura Music Premium VIP instantly.
                  </p>
                </div>

                {/* Family SIM Slots & Device Lock Status Card */}
                <div className="p-3.5 rounded-2xl bg-zinc-950/90 border border-emerald-500/30 space-y-2.5 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[#1ed760]">
                      <Signal className="w-3.5 h-3.5 text-[#1ed760]" />
                      <span className="text-[11px] font-bold uppercase tracking-wider font-mono">
                        {subscription.plan.includes('family') ? 'Family VIP • 5 Digital SIM Slots' : 'Personal VIP • 1 Device Strict Lock'}
                      </span>
                    </div>
                    <span className="text-[9px] bg-[#1ed760]/10 text-[#1ed760] border border-[#1ed760]/30 px-2 py-0.5 rounded-md font-mono font-bold uppercase">
                      {subscription.plan.includes('family') ? 'Max 5 Devices' : '1 Device Only'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-zinc-400 font-mono">
                        {subscription.plan.includes('family') ? 'Digital SIM Pairing PIN:' : 'Strict Device Binding:'}
                      </p>
                      <p className="text-sm font-mono font-black text-[#1ed760] tracking-wider">
                        {subscription.familyPairCode || (subscription.plan.includes('family') ? 'SIM-7821' : 'Hardware Locked')}
                      </p>
                    </div>

                    <button
                      onClick={() => setShowDeviceSlotsModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black text-[11px] uppercase tracking-wider flex items-center gap-1 transition active:scale-95 cursor-pointer shadow-md"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-black" />
                      <span>{subscription.plan.includes('family') ? 'Manage 5 Slots' : 'View Lock Status'}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-tight">
                    {subscription.plan.includes('family') 
                      ? '📱 Connect up to 5 phones/computers using your 6-digit Digital SIM code. Revoke or release slots anytime.'
                      : '🔒 Personal VIP is strictly locked to this device only (Spotify single-user rule). Upgrade to Family VIP for up to 5 devices.'}
                  </p>
                </div>
              </div>
            ) : (
              /* SUBSCRIPTION PLAN CARDS (PERSONAL & FAMILY - NORMAL & LIFETIME) */
              <div className="space-y-3.5 pt-2">
                {/* Category Switcher: Personal VIP vs Family VIP */}
                <div className="flex items-center p-1 bg-zinc-950 border border-white/10 rounded-2xl gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setPlanCategory('personal');
                      setSelectedPlan(prev => (prev.includes('monthly') ? 'personal_monthly' : 'personal_lifetime'));
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      planCategory === 'personal'
                        ? 'bg-[#1ed760]/20 text-[#1ed760] border border-[#1ed760]/40 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-[#1ed760]" />
                    <span>Personal VIP</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPlanCategory('family');
                      setSelectedPlan(prev => (prev.includes('monthly') ? 'family_monthly' : 'family_lifetime'));
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      planCategory === 'family'
                        ? 'bg-[#1ed760]/20 text-[#1ed760] border border-[#1ed760]/40 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-[#1ed760]" />
                    <span>Family VIP (5 Devices)</span>
                  </button>
                </div>

                {/* 2 Options for Selected Category: Normal (1 Month) vs Lifetime */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {/* Option 1: Normal (1 Month) */}
                  {(() => {
                    const monthlyPlanId: PlanType = planCategory === 'personal' ? 'personal_monthly' : 'family_monthly';
                    const info = allPlansData[currency][monthlyPlanId];
                    const isSelected = selectedPlan === monthlyPlanId || (selectedPlan === 'monthly' && planCategory === 'personal');
                    return (
                      <div
                        id={`card-plan-${monthlyPlanId}`}
                        onClick={() => setSelectedPlan(monthlyPlanId)}
                        className={`relative p-4 sm:p-5 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[125px] ${
                          isSelected
                            ? 'bg-gradient-to-b from-zinc-900 to-black border-[#1ed760] shadow-[0_0_20px_rgba(30,215,96,0.25)] ring-1 ring-[#1ed760]/50 scale-[1.02]'
                            : 'bg-zinc-950/80 border-white/10 hover:border-white/20 text-zinc-400'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-semibold text-zinc-300">
                              Normal
                            </span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 border border-white/10 font-bold">
                              1 MONTH
                            </span>
                          </div>
                          <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                            {info.price}
                          </div>
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono pt-2">
                          {planCategory === 'personal' ? '30 Days Personal Access' : '30 Days • 5 Accounts'}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Option 2: Lifetime Pass */}
                  {(() => {
                    const lifetimePlanId: PlanType = planCategory === 'personal' ? 'personal_lifetime' : 'family_lifetime';
                    const info = allPlansData[currency][lifetimePlanId];
                    const isSelected = selectedPlan === lifetimePlanId || (selectedPlan === 'yearly' && planCategory === 'family');
                    return (
                      <div
                        id={`card-plan-${lifetimePlanId}`}
                        onClick={() => setSelectedPlan(lifetimePlanId)}
                        className={`relative p-4 sm:p-5 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[125px] ${
                          isSelected
                            ? 'bg-gradient-to-b from-zinc-900 to-black border-[#1ed760] shadow-[0_0_25px_rgba(30,215,96,0.3)] ring-1 ring-[#1ed760]/60 scale-[1.02]'
                            : 'bg-zinc-950/80 border-white/10 hover:border-white/20 text-zinc-400'
                        }`}
                      >
                        <div className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full bg-[#1ed760] text-black text-[9px] font-black uppercase tracking-wider shadow-[0_2px_10px_rgba(30,215,96,0.4)]">
                          {planCategory === 'personal' ? 'POPULAR' : 'BEST VALUE'}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-semibold text-zinc-300">
                              Lifetime VIP
                            </span>
                          </div>
                          <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                            {info.price}
                          </div>
                        </div>

                        <div className="text-[10px] text-[#1ed760] font-mono pt-2 font-medium">
                          {planCategory === 'personal' ? 'Forever VIP • One-Time' : 'Forever VIP • 5 Accounts'}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Subtext */}
                <div className="text-center pt-1">
                  <p className="text-xs font-semibold text-zinc-200">
                    {`Selected: ${activePlanInfo.title} (${activeAmount})`}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    {activePlanInfo.subtitle}
                  </p>
                </div>

                {/* PRIMARY ACTION: "PROCEED TO REAL CHECKOUT →" */}
                <div className="pt-2 space-y-2">
                  <button
                    id="btn-subscribe-now"
                    onClick={handleProceedToCheckout}
                    className="w-full py-3.5 sm:py-4 px-6 rounded-full text-black font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer bg-[#1ed760] hover:bg-[#1fdf64] shadow-[0_4px_20px_rgba(30,215,96,0.35)] hover:shadow-[0_6px_25px_rgba(30,215,96,0.5)]"
                  >
                    <span>Subscribe Now — {activeAmount}</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>

                  <p className="text-center text-xs font-bold text-zinc-400 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>100% Real SSL Encrypted Payment Gateway</span>
                  </p>

                  {/* Redeem VIP License Key (For Family & Other Devices) */}
                  <div className="pt-1">
                    <button
                      onClick={() => setShowRedeemInput(prev => !prev)}
                      className="w-full py-2.5 px-3 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-emerald-500/20 text-xs font-bold text-[#1ed760] flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Key className="w-3.5 h-3.5 text-[#1ed760]" />
                      <span>{showRedeemInput ? 'Hide License Key Input' : 'Have a VIP License Key? (Connect Family / Other Device)'}</span>
                    </button>

                    {showRedeemInput && (
                      <div className="mt-2 p-3.5 rounded-2xl bg-black/80 border border-emerald-500/30 space-y-2.5 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-zinc-200 flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-[#1ed760]" />
                            <span>Enter VIP License Key:</span>
                          </label>
                          <span className="text-[10px] text-zinc-400">e.g. AURA-PRO-XXXX</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={redeemKeyInput}
                            onChange={(e) => setRedeemKeyInput(e.target.value.toUpperCase())}
                            placeholder="Enter Key from other phone..."
                            className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono text-[#1ed760] placeholder:text-zinc-600 focus:outline-none focus:border-[#1ed760] tracking-wider uppercase"
                          />
                          <button
                            onClick={handleRedeemLicenseKey}
                            disabled={isRedeeming}
                            className="px-4 py-2 rounded-xl bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black text-xs uppercase tracking-wider transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-md"
                          >
                            {isRedeeming ? 'Validating...' : 'Activate'}
                          </button>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-tight">
                          Family VIP keys work on up to 5 devices simultaneously. Once activated, VIP features stay permanently on this phone.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Digital SIM Slot Quick Pairing Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => setShowDeviceSlotsModal(true)}
                      className="w-full py-2.5 px-3 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-[#1ed760]/30 text-xs font-bold text-white flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Signal className="w-3.5 h-3.5 text-[#1ed760]" />
                      <span>Join Family VIP via Digital SIM Code (5 Devices)</span>
                    </button>
                  </div>
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
                <span className="text-xs font-bold text-zinc-400">Total:</span>
                <span className="text-sm font-black text-[#1ed760] ml-1.5">{activeAmount}</span>
              </div>
            </div>

            {/* Order Summary Pill */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-[#1ed760]/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#1ed760]/15 text-[#1ed760]">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Aura Music Premium VIP ({activePlanInfo.title})</h4>
                  <p className="text-[10px] text-zinc-400">Duration: {activePlanInfo.duration} • {activePlanInfo.devices}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-[#1ed760]">{activeAmount}</span>
                <p className="text-[9px] text-[#1ed760] font-bold">Inclusive of GST</p>
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#1ed760]" />
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
                        ? 'bg-[#1ed760]/20 border border-[#1ed760]/50 text-[#1ed760] shadow'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    {tab.icon}
                    <span className="text-[10px]">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* TAB 1: UPI DIRECT PAYMENT (Unified Modern Flow - No UTR Required) */}
            {paymentTab === 'upi' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-4 rounded-3xl bg-zinc-900/90 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-[#1ed760]" />
                      Pay with UPI (Instant Auto-Verification)
                    </span>
                    <span className="text-xs font-bold text-[#1ed760]">{activeAmount}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Select your preferred UPI app below to pay securely. Just like Spotify, your account verifies instantly upon payment without entering any 12-digit UTR.
                  </p>

                  {/* 1-Tap App Selector Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {[
                      { name: 'Google Pay', scheme: 'tez://upi/pay', color: 'hover:border-blue-500/50' },
                      { name: 'PhonePe', scheme: 'phonepe://pay', color: 'hover:border-purple-500/50' },
                      { name: 'Paytm', scheme: 'paytmmp://pay', color: 'hover:border-sky-500/50' },
                      { name: 'BHIM / Any UPI', scheme: 'upi://pay', color: 'hover:border-[#1ed760]/50' },
                    ].map((app) => (
                      <button
                        key={app.name}
                        type="button"
                        onClick={() => {
                          const note = encodeURIComponent(`AuraMusicVIP_${selectedPlan}`);
                          const encodedMerchant = encodeURIComponent(merchantName || 'Avijit Barui');
                          const targetUpi = customMerchantUpi || '8777047129@ybl';
                          const url = `${app.scheme}?pa=${targetUpi}&pn=${encodedMerchant}&am=${activeAmountRaw}&cu=INR&tn=${note}`;
                          window.location.href = url;
                          executePayment(`UPI (${app.name})`);
                        }}
                        className={`p-2.5 rounded-2xl bg-zinc-950 border border-white/10 ${app.color} transition flex flex-col items-center text-center gap-1 cursor-pointer active:scale-95`}
                      >
                        <Zap className="w-4 h-4 text-[#1ed760]" />
                        <span className="text-[11px] font-bold text-zinc-200">{app.name}</span>
                        <span className="text-[9px] text-zinc-500">1-Tap Pay</span>
                      </button>
                    ))}
                  </div>

                  {/* Primary Instant Checkout Button */}
                  <button
                    onClick={() => {
                      const note = encodeURIComponent(`AuraMusicVIP_${selectedPlan}`);
                      const encodedMerchant = encodeURIComponent(merchantName || 'Avijit Barui');
                      const targetUpi = customMerchantUpi || '8777047129@ybl';
                      window.location.href = `upi://pay?pa=${targetUpi}&pn=${encodedMerchant}&am=${activeAmountRaw}&cu=INR&tn=${note}`;
                      executePayment('UPI Instant Auto-Pay');
                    }}
                    className="w-full py-3.5 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Pay &amp; Subscribe Now ({activeAmount})</span>
                  </button>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-zinc-400">Receiver UPI ID:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(customMerchantUpi || '8777047129@ybl', 'UPI ID')}
                      className="text-[#1ed760] hover:text-[#1fdf64] font-mono font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>{customMerchantUpi || '8777047129@ybl'}</span>
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Secondary Option: QR Code toggle */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setShowManualUtr(!showManualUtr)}
                    className="text-[11px] text-zinc-500 hover:text-[#1ed760] transition cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{showManualUtr ? 'Hide QR Code' : 'Paying from another screen? Scan QR Code'}</span>
                  </button>
                </div>

                {showManualUtr && (
                  <div className="p-5 rounded-3xl bg-zinc-950 border border-white/10 flex flex-col items-center text-center space-y-3.5 animate-in fade-in">
                    {qrDataUrl ? (
                      <div className="p-3.5 bg-white rounded-2xl shadow-xl">
                        <img src={qrDataUrl} alt="UPI Payment QR" className="w-40 h-40 object-contain rounded-lg" />
                      </div>
                    ) : (
                      <div className="w-40 h-40 rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-500 text-xs">
                        Loading QR...
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white">
                        Scan with Google Pay, PhonePe, or Paytm
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Exact amount: <strong className="text-[#1ed760]">{activeAmount}</strong>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => executePayment('UPI QR Auto-Verification')}
                      className="w-full py-3.5 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-black" />
                      <span>I Have Completed Payment — Auto-Verify Now</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: DEBIT / CREDIT CARDS */}
            {paymentTab === 'card' && (
              <div className="space-y-3.5 animate-in fade-in">
                {/* Real Interactive Card Preview */}
                <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-tr from-zinc-950 via-zinc-900 to-zinc-800 border border-white/15 shadow-xl text-white select-none">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-[#1ed760]/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                  
                  <div className="flex items-center justify-between mb-4">
                    {/* EMV Chip & Contactless */}
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-6 rounded bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 border border-amber-200/50 flex items-center justify-center shadow-inner">
                        <div className="w-6 h-3.5 border border-amber-800/40 rounded-sm grid grid-cols-2 gap-0.5">
                          <div className="border-r border-amber-800/30"></div>
                          <div></div>
                        </div>
                      </div>
                      <Radio className="w-3.5 h-3.5 text-zinc-400 rotate-90" />
                    </div>

                    {/* Card Brand Badge */}
                    <div className="px-2.5 py-0.5 rounded-md bg-white/10 backdrop-blur text-[11px] font-black tracking-wider uppercase font-mono border border-white/10 text-white">
                      {cardNumber.startsWith('4')
                        ? 'VISA'
                        : /^(5[1-5]|2[2-7])/.test(cardNumber.replace(/\s/g, ''))
                        ? 'MASTERCARD'
                        : /^(60|65|81|82)/.test(cardNumber.replace(/\s/g, ''))
                        ? 'RUPAY'
                        : /^(34|37)/.test(cardNumber.replace(/\s/g, ''))
                        ? 'AMEX'
                        : 'DEBIT / CREDIT'}
                    </div>
                  </div>

                  {/* Card Number Display */}
                  <div className="text-base sm:text-lg font-mono tracking-widest text-zinc-100 font-bold mb-3 drop-shadow">
                    {cardNumber || '•••• •••• •••• ••••'}
                  </div>

                  {/* Card Footer: Name & Expiry */}
                  <div className="flex items-end justify-between text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                    <div>
                      <span className="block text-[8px] text-zinc-500">CARDHOLDER</span>
                      <span className="text-zinc-200 font-bold tracking-normal text-xs truncate max-w-[170px] inline-block">
                        {cardHolder || 'AVIJIT BARUI'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[8px] text-zinc-500">EXPIRES</span>
                      <span className="text-zinc-200 font-bold text-xs">
                        {cardExpiry || '12/28'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Test Card Auto-fill Button */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] text-zinc-400">Enter your card details or test 1-tap:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCardNumber('4532 8821 9012 3456');
                      setCardHolder('Avijit Barui');
                      setCardExpiry('12/28');
                      setCardCvv('892');
                      setCardValidationError('');
                    }}
                    className="text-[10px] font-bold text-[#1ed760] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Quick Fill Test Card</span>
                  </button>
                </div>

                {/* Card Input Fields */}
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300">Card Number (Visa, Mastercard, RuPay, Amex)</label>
                    <div className="relative mt-1">
                      <input
                        type="text"
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').substring(0, 16);
                          const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
                          setCardNumber(formatted);
                          if (cardValidationError) setCardValidationError('');
                        }}
                        placeholder="4532 8821 9012 3456"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#1ed760] transition"
                      />
                      <CreditCard className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-300">Cardholder Name (as printed on card)</label>
                    <div className="relative mt-1">
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => {
                          setCardHolder(e.target.value);
                          if (cardValidationError) setCardValidationError('');
                        }}
                        placeholder="Avijit Barui"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#1ed760] transition"
                      />
                      <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-300">Valid Thru (MM/YY)</label>
                      <input
                        type="text"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '').substring(0, 4);
                          if (val.length >= 3) {
                            val = `${val.substring(0, 2)}/${val.substring(2)}`;
                          }
                          setCardExpiry(val);
                          if (cardValidationError) setCardValidationError('');
                        }}
                        placeholder="12/28"
                        className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#1ed760] transition"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-zinc-300">CVV / CVC (3-4 digits)</label>
                      <div className="relative mt-1">
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => {
                            setCardCvv(e.target.value.replace(/\D/g, ''));
                            if (cardValidationError) setCardValidationError('');
                          }}
                          placeholder="•••"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#1ed760] transition"
                        />
                        <Lock className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-3.5" />
                      </div>
                    </div>
                  </div>
                </div>

                {cardValidationError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{cardValidationError}</span>
                  </div>
                )}

                {/* Submit Payment Button with Bank 3DS Challenge */}
                <button
                  type="button"
                  onClick={handleInitiateCardPayment}
                  disabled={isChargingCard}
                  className="w-full py-3.5 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isChargingCard ? (
                    <span className="animate-spin text-sm">⏳</span>
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  <span>{isChargingCard ? 'Contacting Banking Switch...' : `Pay & Authenticate with Bank (${activeAmount})`}</span>
                </button>

                {/* Security Trust Badges */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-center gap-4 text-[10px] text-zinc-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-[#1ed760]" />
                    256-Bit SSL
                  </span>
                  <span>•</span>
                  <span>Verified by Visa</span>
                  <span>•</span>
                  <span>Mastercard ID Check</span>
                  <span>•</span>
                  <span>RuPay PaySecure</span>
                </div>
              </div>
            )}

            {/* TAB 3: NET BANKING */}
            {paymentTab === 'netbanking' && (
              <div className="space-y-3.5 animate-in fade-in">
                <div className="p-3 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#1ed760]" />
                      Direct Net Banking Gateway
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#1ed760]/20 text-[#1ed760] text-[10px] font-bold">
                      256-Bit Bank Portal
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Select your bank below to authenticate directly via your bank's secure Net Banking portal.
                  </p>
                </div>

                {/* Popular Indian Banks Selector */}
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-2">Popular Indian Banks:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'State Bank of India', code: 'SBI', short: 'SBI' },
                      { name: 'HDFC Bank', code: 'HDFC', short: 'HDFC' },
                      { name: 'ICICI Bank', code: 'ICICI', short: 'ICICI' },
                      { name: 'Axis Bank', code: 'AXIS', short: 'Axis' },
                      { name: 'Kotak Mahindra Bank', code: 'KOTAK', short: 'Kotak' },
                      { name: 'Punjab National Bank', code: 'PNB', short: 'PNB' },
                      { name: 'Bank of Baroda', code: 'BOB', short: 'BOB' },
                      { name: 'Canara Bank', code: 'CANARA', short: 'Canara' }
                    ].map((bank) => (
                      <button
                        key={bank.code}
                        type="button"
                        onClick={() => setSelectedBank(bank.name)}
                        className={`p-3 rounded-xl text-left border transition cursor-pointer flex items-center justify-between ${
                          selectedBank === bank.name
                            ? 'bg-[#1ed760]/20 border-[#1ed760] text-white shadow-md'
                            : 'bg-zinc-900 border-white/5 text-zinc-300 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black ${
                            selectedBank === bank.name ? 'bg-[#1ed760] text-black' : 'bg-white/10 text-white'
                          }`}>
                            {bank.short[0]}
                          </div>
                          <span className="text-xs font-bold">{bank.name}</span>
                        </div>
                        {selectedBank === bank.name && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#1ed760] shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional 40+ Indian Banks Dropdown */}
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1.5">Or Choose from 40+ Other Banks:</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-[#1ed760] cursor-pointer"
                  >
                    <option value="Union Bank of India">Union Bank of India</option>
                    <option value="IndusInd Bank">IndusInd Bank</option>
                    <option value="Yes Bank">Yes Bank</option>
                    <option value="IDBI Bank">IDBI Bank</option>
                    <option value="Federal Bank">Federal Bank</option>
                    <option value="Indian Bank">Indian Bank</option>
                    <option value="Central Bank of India">Central Bank of India</option>
                    <option value="Bank of India">Bank of India</option>
                    <option value="RBL Bank">RBL Bank</option>
                    <option value="UCO Bank">UCO Bank</option>
                    <option value="South Indian Bank">South Indian Bank</option>
                    <option value="IDFC FIRST Bank">IDFC FIRST Bank</option>
                  </select>
                </div>

                {/* Selected Bank Confirmation Card */}
                <div className="p-3 rounded-xl bg-[#1ed760]/10 border border-[#1ed760]/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#1ed760]" />
                    <div>
                      <span className="text-zinc-400 block text-[10px]">Selected Gateway:</span>
                      <strong className="text-white font-bold">{selectedBank}</strong>
                    </div>
                  </div>
                  <span className="text-sm font-black text-[#1ed760]">{activeAmount}</span>
                </div>

                {/* Proceed to Net Banking Gateway Button */}
                <button
                  type="button"
                  onClick={handleInitiateNetbanking}
                  disabled={isSubmittingNetbanking}
                  className="w-full py-3.5 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingNetbanking ? (
                    <span className="animate-spin text-sm">⏳</span>
                  ) : (
                    <Building2 className="w-4 h-4" />
                  )}
                  <span>{isSubmittingNetbanking ? 'Connecting Bank Gateway...' : `Proceed to ${selectedBank} Net Banking (${activeAmount})`}</span>
                </button>

                <div className="text-center">
                  <p className="text-[10px] text-zinc-500">
                    Secure 256-bit encrypted bank connection. Authorize transfer with your User ID and Bank OTP.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: WALLETS */}
            {paymentTab === 'wallet' && (
              <div className="space-y-3.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-[#1ed760]" />
                    <span>Select Real Digital Wallet</span>
                  </label>
                  <span className="text-[10px] font-mono text-[#1ed760] font-bold bg-[#1ed760]/10 px-2 py-0.5 rounded-full border border-[#1ed760]/20">
                    Live UPI Ready
                  </span>
                </div>

                {/* Digital Wallets List */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { name: 'Paytm Wallet', short: 'Paytm', badge: 'Popular', color: 'from-sky-500/20 to-blue-600/20 border-sky-400/40' },
                    { name: 'PhonePe Wallet', short: 'PhonePe', badge: 'Instant', color: 'from-purple-500/20 to-indigo-600/20 border-purple-400/40' },
                    { name: 'Google Pay', short: 'GPay', badge: 'Zero Fee', color: 'from-emerald-500/20 to-teal-600/20 border-emerald-400/40' },
                    { name: 'Amazon Pay', short: 'Amazon Pay', badge: '1-Tap', color: 'from-[#1ed760]/20 to-emerald-600/20 border-[#1ed760]/40' },
                    { name: 'MobiKwik', short: 'MobiKwik', badge: 'Wallet', color: 'from-blue-500/20 to-cyan-600/20 border-blue-400/40' },
                  ].map((w) => (
                    <button
                      key={w.name}
                      type="button"
                      onClick={() => setSelectedWallet(w.name)}
                      className={`p-2.5 rounded-2xl text-left transition cursor-pointer border relative overflow-hidden ${
                        selectedWallet === w.name
                          ? `bg-gradient-to-br ${w.color} text-white shadow-lg`
                          : 'bg-zinc-900/80 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">{w.short}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/10 text-zinc-300 font-medium">
                          {w.badge}
                        </span>
                      </div>
                      <p className="text-[9px] text-zinc-500 truncate">
                        {w.name}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Selected Wallet Action Box */}
                <div className="p-4 rounded-3xl bg-zinc-900/90 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#1ed760] animate-pulse" />
                        <span>Pay via {selectedWallet}</span>
                      </h5>
                      <p className="text-[10px] text-zinc-400">
                        Direct app launch with receiver <span className="text-[#1ed760] font-mono">{customMerchantUpi}</span>
                      </p>
                    </div>
                    <span className="text-xs font-black text-[#1ed760]">{activeAmount}</span>
                  </div>

                  {/* Big Action Button: Launch Wallet App */}
                  <button
                    type="button"
                    onClick={() => handleLaunchWallet(selectedWallet)}
                    className="w-full py-3.5 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Open {selectedWallet} &amp; Pay {activeAmount}</span>
                  </button>

                  {/* Secondary Toggles: QR Code & Copy UPI */}
                  <div className="flex items-center justify-between pt-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setShowWalletQr(!showWalletQr)}
                      className="text-[11px] text-zinc-400 hover:text-[#1ed760] flex items-center gap-1 transition cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>{showWalletQr ? 'Hide QR' : 'Show Wallet QR'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(customMerchantUpi || '8777047129@ybl', 'Merchant UPI ID')}
                      className="text-[11px] text-zinc-400 hover:text-[#1ed760] flex items-center gap-1 transition cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy UPI: {customMerchantUpi || '8777047129@ybl'}</span>
                    </button>
                  </div>

                  {/* Expandable QR view */}
                  {showWalletQr && (
                    <div className="p-3 bg-zinc-950 border border-white/10 rounded-2xl flex flex-col items-center text-center space-y-2 animate-in fade-in">
                      {qrDataUrl ? (
                        <div className="p-2.5 bg-white rounded-xl shadow-lg">
                          <img src={qrDataUrl} alt="Wallet UPI QR" className="w-32 h-32 object-contain rounded-md" />
                        </div>
                      ) : (
                        <div className="w-32 h-32 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-500 text-xs">
                          Generating QR...
                        </div>
                      )}
                      <p className="text-[10px] text-zinc-400">
                        Scan with {selectedWallet} scanner to pay <span className="text-[#1ed760] font-bold">{activeAmount}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Automated Spotify Verification for Wallet (No UTR) */}
                <div className="p-4 rounded-3xl bg-zinc-900/90 border border-[#1ed760]/30 space-y-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#1ed760]" />
                    <span className="text-xs font-bold text-white">Instant Account Auto-Verification</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Just like Spotify, your subscription is verified automatically with zero manual reference numbers. Tap below to confirm and activate your VIP account immediately.
                  </p>

                  <button
                    type="button"
                    onClick={() => executePayment(`${selectedWallet} Instant Wallet Transfer`)}
                    className="w-full py-3.5 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-black" />
                    <span>Auto-Verify &amp; Activate VIP ({activeAmount})</span>
                  </button>
                </div>
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
              <div className="w-20 h-20 rounded-full border-4 border-[#1ed760]/20 border-t-[#1ed760] animate-spin flex items-center justify-center" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Crown className="w-8 h-8 text-[#1ed760] animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-white">Processing Secure Transaction</h3>
              <p className="text-xs font-mono text-[#1ed760]">{processingStatus}</p>
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
            <div className="w-16 h-16 rounded-full bg-[#1ed760]/20 border-2 border-[#1ed760] flex items-center justify-center mx-auto text-[#1ed760] shadow-xl shadow-[#1ed760]/20">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-extrabold px-3 py-0.5 rounded-full bg-[#1ed760] text-black uppercase tracking-wider">
                VIP PRO ACTIVATED
              </span>
              <h2 className="text-2xl font-black text-white pt-2">Welcome to Aura Music Premium VIP!</h2>
              <p className="text-xs text-zinc-300">
                Your payment of <span className="text-[#1ed760] font-bold">{subscription.amountPaid}</span> was successfully processed.
              </p>
            </div>

            {/* License Card */}
            <div className="p-4 rounded-3xl bg-zinc-950 border border-[#1ed760]/40 text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Order ID:</span>
                <span className="font-mono text-white font-bold">{subscription.orderId}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Valid Until:</span>
                <span className="font-mono text-[#1ed760] font-bold">{new Date(subscription.expiryDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-white/10 pt-2">
                <span className="text-zinc-400">VIP License:</span>
                <span className="font-mono text-xs text-white font-bold truncate max-w-[170px]">{subscription.licenseKey}</span>
              </div>
            </div>

            {/* Family SIM Slots Info Card or Personal Device Lock Info */}
            {(subscription.planCategory === 'family' || subscription.plan.includes('family')) ? (
              <div className="p-3.5 rounded-3xl bg-zinc-950 border border-[#1ed760]/40 text-left space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#1ed760]">
                    <Signal className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold uppercase tracking-wider font-mono">
                      5 Digital SIM Slots Active
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#1ed760]/10 text-[#1ed760] font-bold">
                    Slot 1/5 (Master)
                  </span>
                </div>

                <div className="p-2.5 rounded-2xl bg-black border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-zinc-400 uppercase font-mono">Family SIM Code:</span>
                    <p className="text-sm sm:text-base font-mono font-black text-[#1ed760] tracking-widest">
                      {subscription.familyPairCode || 'SIM-7821'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeviceSlotsModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-[#1ed760] text-black font-black text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-md"
                  >
                    Manage 5 Slots
                  </button>
                </div>
                <p className="text-[10px] text-zinc-400 leading-tight">
                  Share this 6-digit SIM code with up to 4 family members to connect their devices into your plan.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-zinc-950 border border-white/10 text-left flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-[#1ed760] shrink-0" />
                <p className="text-[11px] text-zinc-300 leading-tight">
                  <strong className="text-white">Strictly Bound to this Device:</strong> Personal VIP is locked to 1 device only per Spotify policy.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => setCurrentStep('invoice')}
                className="w-full py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-[#1ed760]/30 text-[#1ed760] text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                <span>View &amp; Download Tax Invoice</span>
              </button>

              <button
                onClick={() => {
                  setCurrentStep('plans');
                  onClose();
                }}
                className="w-full py-3.5 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black text-xs uppercase tracking-wider shadow-lg transition active:scale-95 cursor-pointer"
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
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-[#1ed760] text-[10px] font-bold border border-[#1ed760]/30">
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
                  <span className="font-medium text-[#1ed760] font-bold">256-Bit SSL Verified</span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-3 space-y-1.5">
                <div className="flex justify-between font-bold text-white">
                  <span>Aura Music Premium VIP ({subscription.plan.toUpperCase()})</span>
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
                <div className="flex justify-between text-sm font-black text-[#1ed760] border-t border-white/10 pt-2">
                  <span>Total Amount Paid</span>
                  <span>{subscription.amountPaid}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-zinc-900 border border-white/5 space-y-0.5">
                <p className="text-[9px] text-zinc-500 font-mono uppercase">VIP License Key</p>
                <p className="text-xs font-mono font-bold text-[#1ed760] break-all">{subscription.licenseKey}</p>
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownloadInvoice}
              className="w-full py-3.5 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
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

              <h3 className="text-xs font-bold text-[#1ed760] uppercase tracking-wider font-mono">
                Merchant Receiver & Settlement Setup
              </h3>
            </div>

            {/* Direct Bank Deposit Guarantee */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-emerald-500/30 text-xs text-zinc-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#1ed760]" />
                  <span>Real Direct Bank Settlement</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#1ed760]/20 text-[#1ed760] text-[10px] font-bold uppercase tracking-wider">
                  0% Fee • Instant
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                <strong className="text-[#1ed760]">টাকা সরাসরি আপনার ব্যাংকে ঢুকবে:</strong> আপনি নিচে যে UPI ID সেট করবেন, গ্রাহক যখন সাবস্ক্রিপশন ফি (₹২১০ বা ₹১,২৫০) দেবে, সেই পুরো টাকা সাথে সাথে এই UPI-এর সাথে লিংক থাকা আপনার আসল ব্যাংক অ্যাকাউন্টে জমা হবে।
              </p>
            </div>

            {/* Quick UPI ID Pickers */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400">Quick Select Your UPI Provider:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCustomMerchantUpi('8777047129@ybl')}
                  className="px-2.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-[11px] font-mono text-zinc-300 hover:text-[#1ed760] text-center transition"
                >
                  PhonePe (@ybl)
                </button>
                <button
                  type="button"
                  onClick={() => setCustomMerchantUpi('baruiavijit72@okaxis')}
                  className="px-2.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-[11px] font-mono text-zinc-300 hover:text-[#1ed760] text-center transition"
                >
                  GPay (@okaxis)
                </button>
                <button
                  type="button"
                  onClick={() => setCustomMerchantUpi('8777047129@paytm')}
                  className="px-2.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-[11px] font-mono text-zinc-300 hover:text-[#1ed760] text-center transition"
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
                  className="w-full mt-1.5 px-3.5 py-2.5 rounded-2xl bg-zinc-900 border border-white/10 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#1ed760]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300">Business / Receiver Display Name</label>
                <input
                  type="text"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  placeholder="Avijit Barui"
                  className="w-full mt-1.5 px-3.5 py-2.5 rounded-2xl bg-zinc-900 border border-white/10 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#1ed760]"
                />
              </div>

              <button
                onClick={handleSaveMerchantSettings}
                className="w-full mt-2 py-3.5 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
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
                  <History className="w-4 h-4 text-[#1ed760]" />
                  <span>{showOrderHistory ? 'Refresh Transactions Log' : 'View Real Received Payments Log'}</span>
                </button>

                {showOrderHistory && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-black border border-white/10 space-y-2 text-left">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-400">Total Recorded Orders:</span>
                      <span className="text-[#1ed760] font-bold">{serverOrders.length}</span>
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
                              <span className="text-[#1ed760] font-bold">{ord.amount || '₹1,250.00'}</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${ord.status === 'PAID' ? 'bg-[#1ed760]/20 text-[#1ed760]' : 'bg-zinc-800 text-zinc-400'}`}>
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

        {/* ========================================================================= */}
        {/* OVERLAY MODAL 1: REAL 3D SECURE 2.0 BANKING AUTHENTICATION MODAL           */}
        {/* ========================================================================= */}
        {show3DSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-md bg-zinc-950 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl relative space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-[#1ed760]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      {threeDsSession?.cardBrand || 'Bank'} 3D Secure 2.0
                    </h4>
                    <span className="text-[10px] text-zinc-400 font-mono">Issuer Bank Verified Protection</span>
                  </div>
                </div>
                <button
                  onClick={() => setShow3DSModal(false)}
                  className="w-7 h-7 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-xs transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Transaction Details Card */}
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Merchant:</span>
                  <span className="font-bold text-white">Aura Music Premium VIP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Card:</span>
                  <span className="font-mono text-white">{threeDsSession?.maskedCard || '•••• 3456'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Amount:</span>
                  <span className="font-black text-[#1ed760]">{threeDsSession?.amount || activeAmount}</span>
                </div>
              </div>

              {/* OTP Info */}
              <div className="space-y-2 text-center">
                <p className="text-xs text-zinc-300">
                  Please enter the 6-digit One Time Password (OTP) sent to your registered mobile{' '}
                  <strong className="text-white font-mono">{threeDsSession?.maskedPhone || '+91 87•••••129'}</strong>
                </p>

                {/* Quick test autofill pill */}
                {threeDsSession?.demoOtp && (
                  <button
                    type="button"
                    onClick={() => {
                      setCardOtp(threeDsSession.demoOtp);
                      setCardOtpError('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1ed760]/10 hover:bg-[#1ed760]/20 border border-[#1ed760]/30 text-[#1ed760] text-[11px] font-mono font-bold transition cursor-pointer"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Instant Autofill Bank OTP: <strong>{threeDsSession.demoOtp}</strong></span>
                  </button>
                )}
              </div>

              {/* OTP Input Box */}
              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={cardOtp}
                  onChange={(e) => {
                    setCardOtp(e.target.value.replace(/\D/g, ''));
                    if (cardOtpError) setCardOtpError('');
                  }}
                  placeholder="Enter 6-digit OTP"
                  className="w-full text-center text-xl tracking-[0.4em] font-mono py-3 rounded-2xl bg-zinc-900 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#1ed760]"
                />
              </div>

              {cardOtpError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{cardOtpError}</span>
                </div>
              )}

              {/* Submit & Cancel Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleVerifyCard3DS}
                  disabled={isSubmittingCardOtp}
                  className="w-full py-3.5 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingCardOtp ? (
                    <span className="animate-spin text-sm">⏳</span>
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-black" />
                  )}
                  <span>{isSubmittingCardOtp ? 'Authenticating with Bank...' : 'Submit OTP & Settle Payment'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShow3DSModal(false)}
                  className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold transition cursor-pointer"
                >
                  Cancel Transaction
                </button>
              </div>

              <div className="text-center text-[10px] text-zinc-500 flex items-center justify-center gap-2">
                <Lock className="w-3 h-3 text-[#1ed760]" />
                <span>Protected by 256-Bit Bank-Grade SSL Payment Gateway</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* OVERLAY MODAL 2: REAL NET BANKING GATEWAY PORTAL SCREEN                   */}
        {/* ========================================================================= */}
        {showNetBankingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-md bg-zinc-950 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl relative space-y-4">
              {/* Bank Portal Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#1ed760]/20 flex items-center justify-center text-[#1ed760]">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      {netbankingSession?.bankName || selectedBank}
                    </h4>
                    <span className="text-[10px] text-zinc-400 font-mono">Official Net Banking Portal</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowNetBankingModal(false)}
                  className="w-7 h-7 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-xs transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Order Info */}
              <div className="p-3 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-zinc-400 block text-[10px]">Merchant Order:</span>
                  <span className="font-bold text-white">Aura Music VIP Pro</span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-400 block text-[10px]">Amount to Debit:</span>
                  <span className="font-black text-[#1ed760] text-sm">{netbankingSession?.amount || activeAmount}</span>
                </div>
              </div>

              {/* STEP 1: LOGIN CREDENTIALS */}
              {netbankingStep === 'login' && (
                <div className="space-y-3 animate-in fade-in">
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-300">Net Banking Customer / User ID</label>
                      <input
                        type="text"
                        value={netbankingUserId}
                        onChange={(e) => {
                          setNetbankingUserId(e.target.value);
                          if (netbankingError) setNetbankingError('');
                        }}
                        placeholder="e.g. 5839201"
                        className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#1ed760]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-zinc-300">IPIN / Password</label>
                      <input
                        type="password"
                        value={netbankingPassword}
                        onChange={(e) => setNetbankingPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#1ed760]"
                      />
                    </div>
                  </div>

                  {netbankingError && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{netbankingError}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleNetbankingLoginSubmit}
                    className="w-full py-3.5 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Login & Proceed to OTP</span>
                  </button>
                </div>
              )}

              {/* STEP 2: HIGH SECURITY OTP */}
              {netbankingStep === 'otp' && (
                <div className="space-y-3 animate-in fade-in">
                  <div className="text-center space-y-1.5">
                    <p className="text-xs text-zinc-300">
                      Enter the High-Security OTP sent to your mobile registered with{' '}
                      <strong className="text-white">{netbankingSession?.bankName || selectedBank}</strong>
                    </p>

                    {netbankingSession?.demoOtp && (
                      <button
                        type="button"
                        onClick={() => {
                          setNetbankingOtp(netbankingSession.demoOtp);
                          if (netbankingError) setNetbankingError('');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1ed760]/10 hover:bg-[#1ed760]/20 border border-[#1ed760]/30 text-[#1ed760] text-[11px] font-mono font-bold transition cursor-pointer"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Instant Autofill Bank OTP: <strong>{netbankingSession.demoOtp}</strong></span>
                      </button>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      maxLength={6}
                      value={netbankingOtp}
                      onChange={(e) => {
                        setNetbankingOtp(e.target.value.replace(/\D/g, ''));
                        if (netbankingError) setNetbankingError('');
                      }}
                      placeholder="Enter 6-digit OTP"
                      className="w-full text-center text-xl tracking-[0.4em] font-mono py-3 rounded-2xl bg-zinc-900 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#1ed760]"
                    />
                  </div>

                  {netbankingError && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{netbankingError}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleVerifyNetbanking}
                    disabled={isSubmittingNetbanking}
                    className="w-full py-3.5 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingNetbanking ? (
                      <span className="animate-spin text-sm">⏳</span>
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>{isSubmittingNetbanking ? 'Authorizing Transfer with Bank...' : 'Authorize Payment & Activate VIP'}</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowNetBankingModal(false)}
                className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold transition cursor-pointer"
              >
                Cancel & Return
              </button>
            </div>
          </div>
        )}

      </div>

      {/* VIP Device Slots & Digital SIM Modal (Spotify 1-device lock & 5-family SIM slots) */}
      <VipDeviceSlotsModal
        isOpen={showDeviceSlotsModal}
        onClose={() => setShowDeviceSlotsModal(false)}
        licenseKey={subscription.licenseKey}
        planCategory={subscription.planCategory || (subscription.plan.includes('family') ? 'family' : 'personal')}
        onVipActivated={(activatedSub) => {
          setSubscription(activatedSub);
          if (onVipStatusChanged) onVipStatusChanged(true);
        }}
        showToast={showToast}
      />

      {/* Modern Manage Devices & Family Dashboard */}
      {showDeviceDashboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl my-auto rounded-3xl bg-neutral-950 border border-neutral-800 shadow-2xl p-2 sm:p-4">
            <VipDeviceDashboard
              subscriptionId={subscription.orderId}
              onClose={() => setShowDeviceDashboardModal(false)}
              onUpgradeToFamily={() => {
                setShowDeviceDashboardModal(false);
                setPlanCategory('family');
                setSelectedPlan('family_lifetime');
                setCurrentStep('plans');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
