import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Disc, 
  ShieldCheck,
  ArrowRight,
  Cloud,
  Sliders,
  Sparkles
} from 'lucide-react';
import { UserProfile } from '../types';
import { signInWithGoogle } from '../lib/firebase';
import { apiOAuthSync } from '../utils/apiService';
import { AuraAppIcon } from './AuraAppIcon';

interface AuthGatewayProps {
  onAuthenticated: (profile: UserProfile) => void;
  onExploreGuest: () => void;
}

export const AuthGateway: React.FC<AuthGatewayProps> = ({
  onAuthenticated,
  onExploreGuest,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGoogleAuth = async () => {
    setIsLoading(true);
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
        setErrorMessage('Google Sign-In was closed. Tap "Continue with Google" again to sign in.');
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMessage('Popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (err.code === 'auth/network-request-failed') {
        setErrorMessage('Network connection failed. Please verify your internet connection.');
      } else {
        console.warn('Google Sign-In notice:', err);
        setErrorMessage(err.message || 'Google Sign-In encountered an issue. Please try again.');
      }
    } finally {
      setIsLoading(false);
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
        className="w-full max-w-md bg-zinc-950/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3">
            <AuraAppIcon size={64} variant="full" animated={true} glow={true} />
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-100 to-cyan-300 font-serif">
            Aura Music
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
            Real Original Google Authentication & Lossless Audio Cloud Sync.
          </p>
        </div>

        {/* Cloud Features Highlight */}
        <div className="mb-6 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2">
          <div className="flex items-center gap-2.5 text-xs text-zinc-300">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
              <Cloud className="w-3.5 h-3.5" />
            </div>
            <span>Cloud Library & Playlist Sync across all your devices</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-zinc-300">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
              <Sliders className="w-3.5 h-3.5" />
            </div>
            <span>Studio 10-Band EQ & 32-Bit Lossless Audio Settings</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-zinc-300">
            <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span>VIP Diamond membership & ad-free streaming status</span>
          </div>
        </div>

        {/* Status & Error Alerts */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Sole Primary Action: Real Original Continue with Google */}
        <div className="space-y-3 mb-6">
          <button
            type="button"
            id="btn-google-auth-primary"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-xl shadow-cyan-500/10 border border-white/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
                <span>Signing in with Google...</span>
              </>
            ) : (
              <>
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
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Guest Mode Fallback */}
          <button
            type="button"
            id="btn-guest-continue"
            onClick={onExploreGuest}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white text-xs font-semibold transition active:scale-[0.98] cursor-pointer"
          >
            <span>Continue in Offline Guest Mode</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Security Badge Footer */}
        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-center gap-2 text-[11px] text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Secured by Google Firebase Authentication • 256-bit SSL</span>
        </div>
      </motion.div>
    </div>
  );
};
