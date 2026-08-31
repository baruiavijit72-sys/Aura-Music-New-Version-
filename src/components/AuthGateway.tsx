import React, { useState } from 'react';
import { motion } from 'motion/react';
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
  Play
} from 'lucide-react';
import { UserProfile } from '../types';
import { 
  signInWithGoogle, 
  signInWithFacebook,
  signInWithEmail, 
  signUpWithEmail 
} from '../lib/firebase';
import { AuraAppIcon } from './AuraAppIcon';

interface AuthGatewayProps {
  onAuthenticated: (profile: UserProfile) => void;
  onExploreGuest: () => void;
}

export const AuthGateway: React.FC<AuthGatewayProps> = ({
  onAuthenticated,
  onExploreGuest,
}) => {
  // Step mode: 'SIGNIN' (Login) or 'SIGNUP' (Create Account)
  const [authStep, setAuthStep] = useState<'SIGNIN' | 'SIGNUP'>('SIGNIN');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & Loading
  const [isLoading, setIsLoading] = useState(false);
  const [authProviderLoading, setAuthProviderLoading] = useState<'GOOGLE' | 'FACEBOOK' | 'EMAIL' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // Google 1-Click Popup Sign In
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setAuthProviderLoading('GOOGLE');
    setErrorMessage(null);
    try {
      const user = await signInWithGoogle();
      setSuccessMessage('Google authentication verified! Entering Aura Music...');
      setTimeout(() => {
        onAuthenticated({
          id: user.uid,
          name: user.displayName || 'Google Music Listener',
          email: user.email || '',
          avatarUrl: user.photoURL || undefined,
          authProvider: 'GOOGLE',
          isCloudSyncEnabled: true,
          totalListeningSeconds: 0,
          lastCloudBackup: Date.now()
        });
      }, 500);
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      if (!err.message?.includes('popup-closed-by-user')) {
        setErrorMessage(err.message || 'Google Sign-In was cancelled or encountered an error.');
      }
    } finally {
      setIsLoading(false);
      setAuthProviderLoading(null);
    }
  };

  // Facebook 1-Click Popup Sign In
  const handleFacebookAuth = async () => {
    setIsLoading(true);
    setAuthProviderLoading('FACEBOOK');
    setErrorMessage(null);
    try {
      const user = await signInWithFacebook();
      setSuccessMessage('Facebook authentication verified! Entering Aura Music...');
      setTimeout(() => {
        onAuthenticated({
          id: user.uid,
          name: user.displayName || 'Facebook Music Listener',
          email: user.email || '',
          avatarUrl: user.photoURL || undefined,
          authProvider: 'FACEBOOK',
          isCloudSyncEnabled: true,
          totalListeningSeconds: 0,
          lastCloudBackup: Date.now()
        });
      }, 500);
    } catch (err: any) {
      console.error('Facebook Sign-In failed:', err);
      if (!err.message?.includes('popup-closed-by-user')) {
        setErrorMessage(err.message || 'Facebook Sign-In was cancelled or encountered an error.');
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
            {authStep === 'SIGNIN' 
              ? 'Sign in to access your cloud playlists, lossless audio, & custom equalizer.'
              : 'Create an account to unlock real cloud backup & lossless audio soundscapes.'}
          </p>
        </div>

        {/* Auth Mode Toggle Pill (Sign In / Create Account) */}
        <div className="grid grid-cols-2 p-1 bg-zinc-900/90 rounded-xl border border-white/10 mb-6 text-xs font-semibold">
          <button
            type="button"
            id="tab-auth-signin"
            onClick={() => {
              setAuthStep('SIGNIN');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
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
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
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

        {/* Social Authentication Buttons (Google & Facebook) */}
        <div className="space-y-2.5 mb-5">
          {/* Real Google Sign-In */}
          <button
            type="button"
            id="btn-google-auth"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-medium text-xs sm:text-sm transition active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {authProviderLoading === 'GOOGLE' ? (
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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

          {/* Real Facebook Sign-In */}
          <button
            type="button"
            id="btn-facebook-auth"
            onClick={handleFacebookAuth}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-[#1877F2]/15 hover:bg-[#1877F2]/25 border border-[#1877F2]/40 text-white font-medium text-xs sm:text-sm transition active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {authProviderLoading === 'FACEBOOK' ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            ) : (
              <svg className="w-4 h-4 shrink-0 fill-[#1877F2]" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            )}
            <span>
              {authStep === 'SIGNIN' ? 'Continue with Facebook' : 'Sign up with Facebook'}
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">or with email</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* Email/Password Form */}
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
        </form>

        {/* Step Transition Footer Link */}
        <div className="mt-5 pt-3.5 border-t border-white/5 text-center">
          {authStep === 'SIGNIN' ? (
            <p className="text-xs text-zinc-400">
              Don't have an account?{' '}
              <button
                type="button"
                id="link-switch-to-signup"
                onClick={() => {
                  setAuthStep('SIGNUP');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-cyan-400 hover:text-cyan-300 font-bold underline transition cursor-pointer"
              >
                Create one here
              </button>
            </p>
          ) : (
            <p className="text-xs text-zinc-400">
              Already have an account?{' '}
              <button
                type="button"
                id="link-switch-to-signin"
                onClick={() => {
                  setAuthStep('SIGNIN');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-cyan-400 hover:text-cyan-300 font-bold underline transition cursor-pointer"
              >
                Sign In here
              </button>
            </p>
          )}
        </div>

        {/* Offline / Guest Mode Access */}
        <div className="mt-3.5 text-center">
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
    </div>
  );
};

export default AuthGateway;
