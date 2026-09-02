import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Loader2, 
  Radio, 
  Disc, 
  Zap, 
  ShieldCheck,
  Play,
  Phone,
  Smartphone,
  KeyRound,
  RotateCcw,
  Copy,
  ChevronLeft,
  ChevronDown,
  Search,
  Globe
} from 'lucide-react';
import { UserProfile } from '../types';
import { 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail,
  syncUserProfileToFirestore
} from '../lib/firebase';
import { 
  apiRegister, 
  apiLogin, 
  apiOAuthSync, 
  apiSendSmsOtp, 
  apiVerifySmsOtp 
} from '../utils/apiService';
import { ALL_COUNTRY_CODES, CountryCodeItem } from '../data/countryCodes';
import { AuraAppIcon } from './AuraAppIcon';

interface AuthGatewayProps {
  onAuthenticated: (profile: UserProfile) => void;
  onExploreGuest: () => void;
}

export const AuthGateway: React.FC<AuthGatewayProps> = ({
  onAuthenticated,
  onExploreGuest,
}) => {
  // Auth Channel: 'EMAIL' | 'PHONE'
  const [authChannel, setAuthChannel] = useState<'EMAIL' | 'PHONE'>('EMAIL');

  // Step mode: 'SIGNIN' (Login) or 'SIGNUP' (Create Account)
  const [authStep, setAuthStep] = useState<'SIGNIN' | 'SIGNUP'>('SIGNIN');

  // Phone Auth specific phase: 'INPUT_NUMBER' | 'VERIFY_OTP'
  const [phonePhase, setPhonePhase] = useState<'INPUT_NUMBER' | 'VERIFY_OTP'>('INPUT_NUMBER');
  const [selectedCountry, setSelectedCountry] = useState<CountryCodeItem>(
    ALL_COUNTRY_CODES.find((c) => c.code === '+91' && c.iso === 'IN') || ALL_COUNTRY_CODES[0]
  );
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpCountdown, setOtpCountdown] = useState(30);
  const [isOtpTimerActive, setIsOtpTimerActive] = useState(false);
  const [realSmsDelivered, setRealSmsDelivered] = useState(false);
  const [gatewayProviderInfo, setGatewayProviderInfo] = useState<string | null>(null);
  const [smsFallbackCode, setSmsFallbackCode] = useState<string | null>(null);

  // Email Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & Loading
  const [isLoading, setIsLoading] = useState(false);
  const [authProviderLoading, setAuthProviderLoading] = useState<'GOOGLE' | 'EMAIL' | 'PHONE' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // OTP Countdown Timer
  useEffect(() => {
    let interval: any = null;
    if (isOtpTimerActive && otpCountdown > 0) {
      interval = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    } else if (otpCountdown === 0) {
      setIsOtpTimerActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOtpTimerActive, otpCountdown]);

  // Handle Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanNum = phoneNumber.replace(/\D/g, '');
    if (cleanNum.length < 8 || cleanNum.length > 15) {
      setErrorMessage('Please enter a valid phone number (minimum 8 digits).');
      return;
    }

    setIsLoading(true);
    setAuthProviderLoading('PHONE');

    try {
      setOtpDigits(['', '', '', '', '', '']);

      // Call Backend SMS Gateway (Twilio / Fast2SMS)
      const res = await apiSendSmsOtp(selectedCountry.code, cleanNum);

      if (!res.success) {
        throw new Error(res.message || 'Failed to dispatch SMS OTP.');
      }

      setRealSmsDelivered(Boolean(res.realSmsDelivered));
      setGatewayProviderInfo(res.gatewayProvider || null);
      setSmsFallbackCode(res.fallbackCode || null);
      setGeneratedOtp(res.fallbackCode || null);

      // Start countdown
      setOtpCountdown(30);
      setIsOtpTimerActive(true);

      const fullPhone = res.fullPhone || `${selectedCountry.code} ${cleanNum}`;
      setPhonePhase('VERIFY_OTP');

      if (res.realSmsDelivered) {
        setSuccessMessage(`Real SMS dispatched to ${fullPhone} via ${res.gatewayProvider}! Check your phone messages.`);
      } else {
        setSuccessMessage(`Verification code sent for ${fullPhone}.`);
      }

      // Focus on first digit input
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 300);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
      setAuthProviderLoading(null);
    }
  };

  // Handle OTP digit change
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Pasting full 6-digit code
      const pastedDigits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newDigits = [...otpDigits];
      pastedDigits.forEach((digit, i) => {
        if (i < 6) newDigits[i] = digit;
      });
      setOtpDigits(newDigits);
      const nextIdx = Math.min(pastedDigits.length, 5);
      otpInputRefs.current[nextIdx]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Backspace in OTP boxes
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Autofill code if available in fallback mode
  const handleAutofillOtp = () => {
    if (smsFallbackCode) {
      const digits = smsFallbackCode.split('');
      setOtpDigits(digits);
      otpInputRefs.current[5]?.focus();
    }
  };

  // Verify OTP and complete Phone Authentication
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length !== 6) {
      setErrorMessage('Please enter the full 6-digit OTP code.');
      return;
    }

    setIsLoading(true);
    setAuthProviderLoading('PHONE');

    const cleanNum = phoneNumber.replace(/\D/g, '');
    const fullPhone = `${selectedCountry.code} ${cleanNum}`;
    const userDisplayName = name.trim() || `User ${cleanNum.slice(-4)}`;
    const userId = `phone_${cleanNum}`;

    try {
      // Verify with backend REST API
      const res = await apiVerifySmsOtp(selectedCountry.code, cleanNum, enteredOtp, userDisplayName);
      if (!res.success) {
        throw new Error(res.message || 'Incorrect OTP code.');
      }

      const realProfile: UserProfile = {
        id: res.profile?.id || userId,
        name: res.profile?.name || userDisplayName,
        email: res.profile?.email || `${cleanNum}@phone.aura.music`,
        phoneNumber: res.profile?.phoneNumber || fullPhone,
        authProvider: 'PHONE',
        isCloudSyncEnabled: true,
        totalListeningSeconds: res.profile?.totalListeningSeconds || 0,
        lastCloudBackup: res.profile?.lastCloudBackup || Date.now()
      };

      // Sync to Firestore
      try {
        await syncUserProfileToFirestore(userId, {
          name: realProfile.name,
          email: realProfile.email,
          phoneNumber: fullPhone,
          authProvider: 'PHONE',
          lastLoginAt: Date.now()
        });
      } catch (fErr) {
        console.warn('Firestore profile sync note:', fErr);
      }

      setSuccessMessage(`Phone Number verified! Welcome, ${realProfile.name}!`);
      setTimeout(() => {
        onAuthenticated(realProfile);
      }, 600);
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification encountered an error.');
    } finally {
      setIsLoading(false);
      setAuthProviderLoading(null);
    }
  };


  // Submit Handler for Email/Password
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    if (authStep === 'SIGNUP') {
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
      if (confirmPassword && password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please verify your password.');
        return;
      }
    }

    setIsLoading(true);
    setAuthProviderLoading('EMAIL');

    try {
      if (authStep === 'SIGNUP') {
        // 1. Backend JWT
        try {
          const apiRes = await apiRegister(name.trim(), email.trim(), password);
          if (apiRes.success && apiRes.profile) {
            try {
              await signUpWithEmail(email.trim(), password, name.trim() || undefined);
            } catch {
              // optional secondary mirror
            }

            setSuccessMessage('Account securely created with Bcrypt encryption & JWT active!');
            setTimeout(() => {
              onAuthenticated(apiRes.profile!);
            }, 600);
            return;
          }
        } catch (serverErr) {
          console.warn('Backend server registering via fallback...', serverErr);
        }

        // Fallback to Firebase client SDK
        const user = await signUpWithEmail(email.trim(), password, name.trim() || undefined);
        setSuccessMessage('Account created successfully! Launching Aura Music...');
        setTimeout(() => {
          onAuthenticated({
            id: user.uid,
            name: name.trim() || user.displayName || user.email?.split('@')[0] || 'Aura Member',
            email: user.email || email,
            authProvider: 'EMAIL',
            isCloudSyncEnabled: true,
            totalListeningSeconds: 0,
            lastCloudBackup: Date.now()
          });
        }, 500);
      } else {
        // 1. First login with Full-Stack JWT Backend
        try {
          const apiRes = await apiLogin(email.trim(), password);
          if (apiRes.success && apiRes.profile) {
            setSuccessMessage('Verified with JWT & Bcrypt! Loading your soundscapes...');
            setTimeout(() => {
              onAuthenticated(apiRes.profile!);
            }, 600);
            return;
          }
        } catch (serverErr) {
          console.warn('Backend login fallback...', serverErr);
        }

        // Fallback to Firebase client SDK
        const user = await signInWithEmail(email.trim(), password);
        setSuccessMessage('Signed in successfully! Loading your library & soundscapes...');
        setTimeout(() => {
          onAuthenticated({
            id: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'Aura Member',
            email: user.email || email,
            avatarUrl: user.photoURL || undefined,
            authProvider: 'EMAIL',
            isCloudSyncEnabled: true,
            totalListeningSeconds: 0,
            lastCloudBackup: Date.now()
          });
        }, 500);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let message = err.message || 'Authentication failed. Please check your credentials.';
      if (message.includes('auth/email-already-in-use')) {
        message = 'This email is already registered. Please switch to Sign In below.';
      } else if (message.includes('auth/wrong-password') || message.includes('auth/invalid-credential')) {
        message = 'Incorrect email or password. Please try again.';
      } else if (message.includes('auth/user-not-found')) {
        message = 'No account found with this email. Please create an account first.';
      } else if (message.includes('auth/weak-password')) {
        message = 'Password should be at least 6 characters.';
      } else if (message.includes('auth/invalid-email')) {
        message = 'Please enter a valid email address.';
      }
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
      setAuthProviderLoading(null);
    }
  };

  // Google 1-Click Popup Sign In (Real Firebase Authentication)
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setAuthProviderLoading('GOOGLE');
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const user = await signInWithGoogle();
      if (user) {
        const realProfile: UserProfile = {
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Google User',
          email: user.email || '',
          avatarUrl: user.photoURL || undefined,
          authProvider: 'GOOGLE',
          isCloudSyncEnabled: true,
          totalListeningSeconds: 0,
          lastCloudBackup: Date.now()
        };

        try {
          await apiOAuthSync({
            provider: 'GOOGLE',
            email: user.email || '',
            name: user.displayName || undefined,
            avatarUrl: user.photoURL || undefined,
            providerUid: user.uid
          });
        } catch {
          // Backend optional sync
        }

        setSuccessMessage(`Welcome, ${realProfile.name}! Real Google Account connected.`);
        setTimeout(() => {
          onAuthenticated(realProfile);
        }, 600);
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setErrorMessage('Google Sign-In was cancelled. Tap Google Sign-In again when ready.');
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMessage('Sign-in popup was blocked by your browser. Please allow popups or use Phone / Email Sign-In.');
      } else if (err.code === 'auth/network-request-failed') {
        setErrorMessage('Network connection failed. Please check your internet connection.');
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        setErrorMessage('An account already exists with this email under a different sign-in method.');
      } else {
        console.warn('Google Sign-In note:', err);
        setErrorMessage(err.message || 'Google Sign-In encountered an issue. Please try again or use Phone / Email.');
      }
    } finally {
      setIsLoading(false);
      setAuthProviderLoading(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#010614] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none">
      {/* Cinematic Ambient Background Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#072559]/70 via-[#020e26] to-[#010614] pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent blur-3xl rounded-full pointer-events-none" />

      {/* Main Glass Card Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-zinc-950/85 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10"
      >
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3">
            <AuraAppIcon size={64} variant="full" animated={true} glow={true} />
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-100 to-cyan-300 font-serif">
            Aura Music
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs">
            {authChannel === 'PHONE' 
              ? (authStep === 'SIGNIN' ? 'Sign in with your phone number and instant OTP.' : 'Create an account via mobile number and instant OTP.')
              : (authStep === 'SIGNIN' 
                  ? 'Sign in to access your cloud playlists, lossless audio, & custom equalizer.'
                  : 'Create an account to unlock real cloud backup & lossless audio soundscapes.')}
          </p>
        </div>

        {/* Mode Selector Pill (Sign In / Create Account) */}
        <div className="grid grid-cols-2 p-1 bg-zinc-900/90 rounded-2xl border border-white/10 mb-5 text-xs font-semibold">
          <button
            type="button"
            id="tab-auth-signin"
            onClick={() => {
              setAuthStep('SIGNIN');
              setPhonePhase('INPUT_NUMBER');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
              authStep === 'SIGNIN'
                ? 'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white font-bold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>Sign In</span>
          </button>
          
          <button
            type="button"
            id="tab-auth-signup"
            onClick={() => {
              setAuthStep('SIGNUP');
              setPhonePhase('INPUT_NUMBER');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
              authStep === 'SIGNUP'
                ? 'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white font-bold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>Create Account</span>
          </button>
        </div>

        {/* Status & Error Alerts */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Primary Fast Auth Buttons: Google & Mobile */}
        <div className="space-y-2.5 mb-5">
          {/* Continue with Google */}
          <button
            type="button"
            id="btn-google-auth"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-xs sm:text-sm transition active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-lg"
          >
            {authProviderLoading === 'GOOGLE' ? (
              <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.4C.7 9.8 0 12 0 14.7s.7 4.9 1.9 7.3l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16.4C3.7 20.2 7.5 23.5 12 23.5z"
                />
              </svg>
            )}
            <span>
              {authStep === 'SIGNIN' ? 'Continue with Google' : 'Sign up with Google'}
            </span>
          </button>

          {/* Continue with Mobile (Right Under Google) */}
          <button
            type="button"
            id="btn-mobile-auth"
            onClick={() => {
              setAuthChannel('PHONE');
              setPhonePhase('INPUT_NUMBER');
              setErrorMessage(null);
              setSuccessMessage(null);
              setTimeout(() => {
                const el = document.getElementById('phone-input-number');
                if (el) el.focus();
              }, 150);
            }}
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl font-semibold text-xs sm:text-sm transition active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-lg ${
              authChannel === 'PHONE'
                ? 'bg-gradient-to-r from-cyan-950 to-blue-950 border-2 border-cyan-400 text-cyan-200 shadow-cyan-500/20'
                : 'bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-white'
            }`}
          >
            {authProviderLoading === 'PHONE' ? (
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            ) : (
              <Smartphone className={`w-5 h-5 shrink-0 ${authChannel === 'PHONE' ? 'text-cyan-400' : 'text-zinc-300'}`} />
            )}
            <span>
              {authStep === 'SIGNIN' ? 'Continue with Mobile' : 'Sign up with Mobile'}
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
            {authChannel === 'PHONE' ? 'Mobile Phone & OTP' : 'or with email'}
          </span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* CHANNEL 1: PHONE NUMBER & OTP FLOW */}
        {authChannel === 'PHONE' && (
          <div>
            {phonePhase === 'INPUT_NUMBER' ? (
              <form onSubmit={handleSendOtp} className="space-y-3.5">
                {/* Full Name for Account Creation */}
                {authStep === 'SIGNUP' && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Full Name / Username
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        id="phone-input-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rahul Sen"
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition"
                      />
                    </div>
                  </div>
                )}

                {/* Mobile Number with Country Code */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Mobile Phone Number
                  </label>
                  <div className="flex items-center gap-2">
                    {/* Interactive Country Code Picker Button */}
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        id="btn-country-picker"
                        onClick={() => {
                          setCountrySearchQuery('');
                          setIsCountryPickerOpen(true);
                        }}
                        className="h-[42px] px-3 bg-zinc-900 hover:bg-zinc-800/80 border border-white/10 hover:border-cyan-500/40 rounded-xl text-xs text-white flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-sm"
                      >
                        <span className="text-base leading-none">{selectedCountry.flag}</span>
                        <span className="font-bold text-zinc-200">{selectedCountry.code}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400 ml-0.5" />
                      </button>
                    </div>

                    {/* Phone Number Input */}
                    <div className="relative flex-1">
                      <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        id="phone-input-number"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Mobile number"
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1 flex items-center justify-between">
                    <span>A 6-digit verification code (OTP) will be sent.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCountrySearchQuery('');
                        setIsCountryPickerOpen(true);
                      }}
                      className="text-cyan-400 hover:underline cursor-pointer"
                    >
                      Change Country
                    </button>
                  </p>
                </div>

                {/* Send OTP Button */}
                <button
                  type="submit"
                  id="btn-send-otp"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 cursor-pointer"
                >
                  {isLoading && authProviderLoading === 'PHONE' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4" />
                      <span>Send Verification Code (OTP)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* OTP VERIFICATION PHASE */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {/* Number Info & Edit */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-white/5 text-xs">
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Verifying Number:</span>
                    <span className="font-semibold text-cyan-300">{selectedCountry.code} {phoneNumber}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPhonePhase('INPUT_NUMBER');
                      setErrorMessage(null);
                    }}
                    className="text-[11px] text-zinc-400 hover:text-white underline cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Change</span>
                  </button>
                </div>

                {/* SMS Dispatch Status & Fallback Assistant */}
                {realSmsDelivered ? (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-[11px]">
                      Real SMS sent via <b>{gatewayProviderInfo || 'SMS Gateway'}</b>! Check your phone's SMS inbox.
                    </span>
                  </motion.div>
                ) : smsFallbackCode ? (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2.5 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-xs text-white flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <div className="text-[10px] text-zinc-400">Instant Verification Code:</div>
                        <div className="font-mono font-bold text-cyan-300 tracking-wider text-xs">{smsFallbackCode}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAutofillOtp}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-[10px] cursor-pointer active:scale-95 transition"
                    >
                      Quick Fill
                    </button>
                  </motion.div>
                ) : null}

                {/* 6 Digit Input Boxes */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2 text-center">
                    Enter 6-Digit Code
                  </label>
                  <div className="flex items-center justify-center gap-2">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className={`w-11 h-12 text-center text-lg font-bold font-mono rounded-xl bg-zinc-900 border transition focus:outline-none ${
                          digit
                            ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                            : 'border-white/15 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Resend OTP & Timer */}
                <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                  <span>Didn't get code?</span>
                  {isOtpTimerActive ? (
                    <span className="text-zinc-500 font-mono">
                      Resend in {otpCountdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Resend OTP</span>
                    </button>
                  )}
                </div>

                {/* Verify Button */}
                <button
                  type="submit"
                  id="btn-verify-otp"
                  disabled={isLoading || otpDigits.join('').length !== 6}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 cursor-pointer"
                >
                  {isLoading && authProviderLoading === 'PHONE' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Verifying OTP...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>{authStep === 'SIGNIN' ? 'Verify & Sign In' : 'Verify & Create Account'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Quick Switch to Email */}
            <div className="mt-3.5 pt-2.5 border-t border-white/5 text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthChannel('EMAIL');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-[11px] text-zinc-400 hover:text-cyan-300 transition cursor-pointer"
              >
                Or use <span className="font-semibold text-cyan-400 underline">Email & Password</span>
              </button>
            </div>
          </div>
        )}

        {/* CHANNEL 2: EMAIL & PASSWORD FORM */}
        {authChannel === 'EMAIL' && (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Display Name (Account Creation / Sign-Up only) */}
            {authStep === 'SIGNUP' && (
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Full Name / Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="auth-input-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  id="auth-input-email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="auth-input-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Sign-Up only) */}
            {authStep === 'SIGNUP' && (
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="auth-input-confirm-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              id="btn-auth-submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 cursor-pointer"
            >
              {isLoading && authProviderLoading === 'EMAIL' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Processing...</span>
                </>
              ) : authStep === 'SIGNIN' ? (
                <>
                  <span>Sign In to Library</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Create Aura Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Switch to Mobile */}
            <div className="mt-3.5 pt-2.5 border-t border-white/5 text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthChannel('PHONE');
                  setPhonePhase('INPUT_NUMBER');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setTimeout(() => {
                    const el = document.getElementById('phone-input-number');
                    if (el) el.focus();
                  }, 150);
                }}
                className="text-[11px] text-zinc-400 hover:text-cyan-300 transition cursor-pointer"
              >
                Or sign in with <span className="font-semibold text-cyan-400 underline">Mobile Number & OTP</span>
              </button>
            </div>
          </form>
        )}

        {/* Offline / Guest Mode Access */}
        <div className="mt-5 text-center">
          <button
            type="button"
            id="btn-guest-mode"
            onClick={onExploreGuest}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Play className="w-3 h-3 fill-current text-cyan-400" />
            <span>Continue in Guest Mode (Offline)</span>
          </button>
        </div>

        {/* Feature Highlights Footer */}
        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[10px] text-zinc-400 border-t border-white/5 pt-3.5">
          <div className="flex flex-col items-center">
            <span className="text-cyan-400 font-bold">10-Band EQ</span>
            <span>Studio DSP</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sky-400 font-bold">Mesh Sync</span>
            <span>QR & P2P</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-indigo-400 font-bold">Cloud Sync</span>
            <span>Firestore DB</span>
          </div>
        </div>

      </motion.div>

      {/* SEARCHABLE ALL COUNTRY CODES MODAL */}
      <AnimatePresence>
        {isCountryPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm max-h-[85vh] flex flex-col bg-zinc-950 border border-white/15 rounded-3xl p-5 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">Select Country Code</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCountryPickerOpen(false)}
                  className="w-7 h-7 rounded-full bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Search input */}
              <div className="relative mt-3 mb-2">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={countrySearchQuery}
                  onChange={(e) => setCountrySearchQuery(e.target.value)}
                  placeholder="Search country or code (e.g. BD, India, +1)..."
                  autoFocus
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              {/* Country List */}
              <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar min-h-[260px] max-h-[360px] mt-1">
                {ALL_COUNTRY_CODES.filter((c) => {
                  const q = countrySearchQuery.toLowerCase().trim();
                  if (!q) return true;
                  return (
                    c.name.toLowerCase().includes(q) ||
                    c.code.includes(q) ||
                    c.iso.toLowerCase().includes(q)
                  );
                }).map((c, idx) => {
                  const isSelected = selectedCountry.iso === c.iso && selectedCountry.code === c.code;
                  return (
                    <button
                      key={`${c.iso}-${c.code}-${idx}`}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(c);
                        setIsCountryPickerOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl flex items-center justify-between transition cursor-pointer text-left ${
                        isSelected
                          ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-200'
                          : 'hover:bg-zinc-900/80 text-zinc-300 hover:text-white border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl leading-none">{c.flag}</span>
                        <span className="text-xs font-semibold truncate">{c.name}</span>
                        <span className="text-[10px] text-zinc-500 uppercase font-mono">({c.iso})</span>
                      </div>
                      <span className="text-xs font-bold font-mono text-cyan-400 shrink-0 ml-2">
                        {c.code}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthGateway;

