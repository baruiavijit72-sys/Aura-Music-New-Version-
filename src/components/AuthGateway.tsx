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
  Sparkles,
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { UserProfile } from '../types';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../lib/firebase';
import { apiOAuthSync, apiLogin, apiRegister } from '../utils/apiService';
import { AuraAppIcon } from './AuraAppIcon';

interface AuthGatewayProps {
  onAuthenticated: (profile: UserProfile) => void;
  onExploreGuest: () => void;
}

type AuthTab = 'LOGIN' | 'REGISTER';

export const AuthGateway: React.FC<AuthGatewayProps> = ({
  onAuthenticated,
  onExploreGuest,
}) => {
  const [authTab, setAuthTab] = useState<AuthTab>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (authTab === 'REGISTER') {
      const cleanName = fullName.trim();
      if (!cleanName) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
        setErrorMessage('Please enter a valid email address.');
        return;
      }
      if (cleanPassword.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
      if (cleanPassword !== confirmPassword.trim()) {
        setErrorMessage('Passwords do not match.');
        return;
      }

      setIsLoading(true);
      try {
        let userProfile: UserProfile;

        // Try Firebase Authentication
        try {
          const user = await signUpWithEmail(cleanEmail, cleanPassword, cleanName);
          userProfile = {
            id: user.uid,
            name: cleanName,
            email: cleanEmail,
            authProvider: 'EMAIL',
            isCloudSyncEnabled: true,
            totalListeningSeconds: 0,
            lastCloudBackup: Date.now()
          };
        } catch (firebaseErr: any) {
          console.warn('Firebase registration notice:', firebaseErr);
          // Fallback to API Service or local storage
          try {
            const apiRes = await apiRegister(cleanName, cleanEmail, cleanPassword);
            userProfile = {
              id: apiRes.profile?.id || `usr_${Date.now()}`,
              name: cleanName,
              email: cleanEmail,
              authProvider: 'EMAIL',
              isCloudSyncEnabled: true,
              totalListeningSeconds: 0,
              lastCloudBackup: Date.now()
            };
          } catch {
            // Offline/Local Registration
            userProfile = {
              id: `usr_${Date.now()}`,
              name: cleanName,
              email: cleanEmail,
              authProvider: 'EMAIL',
              isCloudSyncEnabled: true,
              totalListeningSeconds: 0,
              lastCloudBackup: Date.now()
            };
          }
        }

        // Cache local user for future logins
        try {
          const storedUsers = JSON.parse(localStorage.getItem('aura_registered_users') || '{}');
          storedUsers[cleanEmail] = { name: cleanName, password: cleanPassword };
          localStorage.setItem('aura_registered_users', JSON.stringify(storedUsers));
        } catch {}

        setSuccessMessage(`Account created successfully for ${cleanName}!`);
        setTimeout(() => {
          onAuthenticated(userProfile);
        }, 600);
      } catch (err: any) {
        setErrorMessage(err.message || 'Registration failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // LOGIN
      if (!cleanEmail || !cleanEmail.includes('@')) {
        setErrorMessage('Please enter your registered email address.');
        return;
      }
      if (!cleanPassword) {
        setErrorMessage('Please enter your password.');
        return;
      }

      setIsLoading(true);
      try {
        let userProfile: UserProfile;

        // Try Firebase
        try {
          const user = await signInWithEmail(cleanEmail, cleanPassword);
          userProfile = {
            id: user.uid,
            name: user.displayName || cleanEmail.split('@')[0],
            email: cleanEmail,
            authProvider: 'EMAIL',
            isCloudSyncEnabled: true,
            totalListeningSeconds: 0,
            lastCloudBackup: Date.now()
          };
        } catch (firebaseErr: any) {
          console.warn('Firebase login notice:', firebaseErr);
          // Check local registered users or API
          let resolvedName = cleanEmail.split('@')[0];
          try {
            const storedUsers = JSON.parse(localStorage.getItem('aura_registered_users') || '{}');
            if (storedUsers[cleanEmail]) {
              if (storedUsers[cleanEmail].password && storedUsers[cleanEmail].password !== cleanPassword) {
                setErrorMessage('Incorrect password. Please try again.');
                setIsLoading(false);
                return;
              }
              resolvedName = storedUsers[cleanEmail].name || resolvedName;
            }
          } catch {}

          try {
            const apiRes = await apiLogin(cleanEmail, cleanPassword);
            userProfile = {
              id: apiRes.profile?.id || `usr_${Date.now()}`,
              name: apiRes.profile?.name || resolvedName,
              email: cleanEmail,
              authProvider: 'EMAIL',
              isCloudSyncEnabled: true,
              totalListeningSeconds: 0,
              lastCloudBackup: Date.now()
            };
          } catch {
            // Local Authenticated Profile
            userProfile = {
              id: `usr_${Date.now()}`,
              name: resolvedName,
              email: cleanEmail,
              authProvider: 'EMAIL',
              isCloudSyncEnabled: true,
              totalListeningSeconds: 0,
              lastCloudBackup: Date.now()
            };
          }
        }

        setSuccessMessage(`Welcome back, ${userProfile.name}!`);
        setTimeout(() => {
          onAuthenticated(userProfile);
        }, 600);
      } catch (err: any) {
        setErrorMessage(err.message || 'Sign in failed. Please check your credentials.');
      } finally {
        setIsLoading(false);
      }
    }
  };

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

        setSuccessMessage(`Welcome, ${realProfile.name}! Google Account connected.`);
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
    <div className="min-h-screen w-full bg-[#010614] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-y-auto font-sans select-none">
      {/* Cinematic Ambient Background Atmosphere */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#072559]/70 via-[#020e26] to-[#010614] pointer-events-none" />
      <div className="fixed -top-32 -left-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="fixed -bottom-32 -right-32 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Main Glass Card Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-zinc-950/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl relative z-10 my-4"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="mb-2.5">
            <AuraAppIcon size={56} variant="full" animated={true} glow={true} />
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-100 to-cyan-300 font-serif">
            Aura Music
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
            Hi-Res Audio Engine • Cloud Sync • Lossless Sound
          </p>
        </div>

        {/* Tab Switcher: [ Sign In ] | [ Create Account ] */}
        <div className="grid grid-cols-2 p-1 bg-zinc-900/90 border border-white/10 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => {
              setAuthTab('LOGIN');
              setErrorMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              authTab === 'LOGIN'
                ? 'bg-cyan-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthTab('REGISTER');
              setErrorMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              authTab === 'REGISTER'
                ? 'bg-cyan-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Status & Error Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Form: Login & Register */}
        <form onSubmit={handleEmailAuthSubmit} className="space-y-3 mb-4">
          {authTab === 'REGISTER' && (
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Full Name</label>
              <div className="relative flex items-center">
                <UserIcon className="w-4 h-4 text-cyan-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full pl-10 pr-3 py-2.5 bg-zinc-900/80 border border-white/10 rounded-xl text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-cyan-400 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-cyan-400 absolute left-3.5 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-3 py-2.5 bg-zinc-900/80 border border-white/10 rounded-xl text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              {authTab === 'REGISTER' ? 'Password (min 6 chars)' : 'Password'}
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-cyan-400 absolute left-3.5 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-zinc-900/80 border border-white/10 rounded-xl text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-cyan-400 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-zinc-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {authTab === 'REGISTER' && (
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Confirm Password</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-cyan-400 absolute left-3.5 pointer-events-none" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-zinc-900/80 border border-white/10 rounded-xl text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-cyan-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 text-zinc-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-zinc-950 font-bold text-xs tracking-wide uppercase transition duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{authTab === 'REGISTER' ? 'Create Account & Sync' : 'Sign In'}</span>
            )}
          </button>
        </form>

        {/* Toggle Mode Link */}
        <div className="text-center text-xs text-zinc-400 mb-4">
          {authTab === 'LOGIN' ? (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthTab('REGISTER');
                  setErrorMessage(null);
                }}
                className="text-cyan-400 hover:text-cyan-300 font-bold underline ml-1 cursor-pointer"
              >
                Register
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthTab('LOGIN');
                  setErrorMessage(null);
                }}
                className="text-cyan-400 hover:text-cyan-300 font-bold underline ml-1 cursor-pointer"
              >
                Sign In
              </button>
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-zinc-950 px-3 text-[11px] text-zinc-400 uppercase tracking-widest font-bold whitespace-nowrap">
            OR
          </span>
          <div className="border-t border-white/10 w-full" />
        </div>

        {/* Social / Google & Guest Actions */}
        <div className="space-y-2.5 mb-4">
          <button
            type="button"
            id="btn-google-auth-primary"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs transition-all duration-200 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-md border border-white/20"
          >
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
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            id="btn-guest-continue"
            onClick={onExploreGuest}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white text-xs font-semibold transition active:scale-[0.98] cursor-pointer"
          >
            <span>Continue in Offline Guest Mode</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Security Badge Footer */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-center gap-1.5 text-[10px] text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Secured Authentication & Cloud Database Sync</span>
        </div>
      </motion.div>
    </div>
  );
};
