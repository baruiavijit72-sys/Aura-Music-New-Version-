import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cloud, 
  User, 
  CloudUpload, 
  CloudDownload, 
  Database, 
  CheckCircle2, 
  LogOut, 
  AlertCircle,
  Mail,
  Lock,
  Loader2,
  KeyRound,
  ShieldCheck,
  Smartphone,
  Phone
} from 'lucide-react';
import { UserProfile } from '../types';
import { exportAllDataJson, restoreAllDataJson } from '../utils/storage';
import { 
  auth, 
  onAuthStateChanged,
  signInWithGoogle,
  signInWithFacebook,
  signInWithEmail,
  signUpWithEmail,
  logOut,
  saveCloudBackupToFirestore,
  fetchCloudBackupFromFirestore,
  fetchUserProfileFromFirestore
} from '../lib/firebase';
import { 
  apiPushBackup, 
  apiRestoreBackup, 
  apiRegister, 
  apiLogin, 
  apiOAuthSync,
  clearJwtToken 
} from '../utils/apiService';

interface ProfileCloudModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
}

export const ProfileCloudModal: React.FC<ProfileCloudModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
}) => {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP' | 'PROFILE'>('PROFILE');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setAuthMode('PROFILE');
        const providerId = user.providerData[0]?.providerId || '';
        let providerType: 'GOOGLE' | 'FACEBOOK' | 'EMAIL' = 'EMAIL';
        if (providerId.includes('google')) providerType = 'GOOGLE';
        else if (providerId.includes('facebook')) providerType = 'FACEBOOK';

        onUpdateProfile({
          ...userProfile,
          name: user.displayName || user.email?.split('@')[0] || 'Aura Member',
          email: user.email || '',
          avatarUrl: user.photoURL || undefined,
          authProvider: providerType,
          isCloudSyncEnabled: true,
        });
      }
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        const realProfile: UserProfile = {
          ...userProfile,
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Google User',
          email: user.email || '',
          avatarUrl: user.photoURL || undefined,
          authProvider: 'GOOGLE',
          isCloudSyncEnabled: true,
          lastCloudBackup: Date.now(),
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

        onUpdateProfile(realProfile);
        setAuthMode('PROFILE');
        setStatusMessage(`Signed in with Google as ${realProfile.name}!`);
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setErrorMessage('Google Sign-In was cancelled. Tap again when ready.');
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMessage('Sign-in popup was blocked by your browser. Please allow popups or use Email Sign-In.');
      } else {
        console.warn('Google Sign-In note:', err);
        setErrorMessage(err.message || 'Google Sign-In encountered an issue. Please try again or use Email.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await signInWithFacebook();
      if (user) {
        const realProfile: UserProfile = {
          ...userProfile,
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Facebook User',
          email: user.email || '',
          avatarUrl: user.photoURL || undefined,
          authProvider: 'FACEBOOK',
          isCloudSyncEnabled: true,
          lastCloudBackup: Date.now(),
        };

        try {
          await apiOAuthSync({
            provider: 'FACEBOOK',
            email: user.email || '',
            name: user.displayName || undefined,
            avatarUrl: user.photoURL || undefined,
            providerUid: user.uid
          });
        } catch {
          // Backend optional sync
        }

        onUpdateProfile(realProfile);
        setAuthMode('PROFILE');
        setStatusMessage(`Signed in with Facebook as ${realProfile.name}!`);
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/admin-restricted-operation') {
        setErrorMessage('Facebook Login requires Meta App configuration in Firebase. Please use Google Sign-In or Email & Password.');
      } else if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setErrorMessage('Facebook Sign-In was cancelled. Tap again when ready.');
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMessage('Sign-in popup was blocked by browser. Please allow popups or use Google / Email Sign-In.');
      } else {
        console.warn('Facebook Sign-In note:', err);
        setErrorMessage(err.message || 'Facebook Sign-In encountered an issue. Please use Google or Email.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      let user;
      if (authMode === 'SIGNUP') {
        user = await signUpWithEmail(emailInput, passwordInput, nameInput);
      } else {
        user = await signInWithEmail(emailInput, passwordInput);
      }

      const updated: UserProfile = {
        ...userProfile,
        name: nameInput || user.displayName || user.email?.split('@')[0] || 'Aura Member',
        email: user.email || '',
        authProvider: 'EMAIL',
        isCloudSyncEnabled: true,
        lastCloudBackup: Date.now(),
      };
      onUpdateProfile(updated);

      setStatusMessage(`Successfully ${authMode === 'SIGNUP' ? 'created account' : 'signed in'}!`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      console.error('Email authentication error:', err);
      setErrorMessage(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      const guest: UserProfile = {
        ...userProfile,
        name: 'Guest Explorer',
        email: 'guest@auramusic.offline',
        authProvider: 'GUEST',
        avatarUrl: undefined,
        isCloudSyncEnabled: false,
      };
      onUpdateProfile(guest);
      setStatusMessage('Signed out. Switched to offline Guest Mode.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      console.error('Sign-out error:', err);
    }
  };

  const handleCloudBackup = async () => {
    setIsBackingUp(true);
    setErrorMessage(null);
    try {
      const dataJson = exportAllDataJson();
      const parsed = JSON.parse(dataJson);

      // 1. Sync to FullStack Express / Docker Backend
      try {
        await apiPushBackup({
          playlists: parsed.playlists || [],
          tracks: parsed.tracks || [],
          equalizer: parsed.equalizer || null,
          listeningLogs: parsed.listeningLogs || [],
          totalListeningSeconds: userProfile.totalListeningSeconds
        });
      } catch (beErr) {
        console.warn('Backend sync note:', beErr);
      }

      // 2. Sync to Firebase Firestore if logged in
      let backupTime = Date.now();
      if (auth.currentUser) {
        backupTime = await saveCloudBackupToFirestore(auth.currentUser.uid, dataJson);
      }

      onUpdateProfile({
        ...userProfile,
        lastCloudBackup: backupTime,
      });

      setStatusMessage('Cloud backup completed: Playlists, EQ & favorites securely saved to Cloud Database!');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error('Cloud backup error:', err);
      setErrorMessage(err.message || 'Cloud backup failed.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleCloudRestore = async () => {
    setIsRestoring(true);
    setErrorMessage(null);
    try {
      let restoredJson: string | null = null;

      // 1. Try Backend REST API first
      try {
        const beRestore = await apiRestoreBackup();
        if (beRestore.success && beRestore.hasData && beRestore.backup) {
          restoredJson = JSON.stringify(beRestore.backup);
        }
      } catch (beErr) {
        console.warn('Backend restore note:', beErr);
      }

      // 2. Try Firestore fallback
      if (!restoredJson && auth.currentUser) {
        restoredJson = await fetchCloudBackupFromFirestore(auth.currentUser.uid);
      }

      if (restoredJson) {
        const success = restoreAllDataJson(restoredJson);
        if (success) {
          setStatusMessage('Cloud restore successful: Your playlists, presets, and library have been restored!');
          setTimeout(() => {
            setStatusMessage(null);
            window.location.reload();
          }, 1500);
        } else {
          setErrorMessage('Could not parse cloud backup data.');
        }
      } else {
        setErrorMessage('No previous cloud backup found for this account.');
      }
    } catch (err: any) {
      console.error('Cloud restore error:', err);
      setErrorMessage(err.message || 'Cloud restore failed.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleExportJson = () => {
    const jsonStr = exportAllDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura_music_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage('Local offline backup file exported successfully.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-2xl bg-black/85 animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[92vh] flex flex-col bg-zinc-950/95 border border-white/15 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Firebase Authentication & Cloud Sync</h2>
              <p className="text-xs text-zinc-400">Real Google Sign-In, Email Accounts & Firestore Database</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* User Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-indigo-950/70 via-zinc-900 to-zinc-900 border border-indigo-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {currentUser?.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt="Avatar" 
                  referrerPolicy="no-referrer" 
                  className="w-14 h-14 rounded-2xl object-cover border border-white/20 shadow-md"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-indigo-500/30">
                  {userProfile.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  {userProfile.name}
                  {currentUser && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Authenticated" />
                  )}
                </h3>
                <p className="text-xs text-zinc-400">{userProfile.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    currentUser ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}>
                    {currentUser ? `${userProfile.authProvider} AUTHENTICATED` : 'OFFLINE GUEST'}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {(userProfile.totalListeningSeconds / 3600).toFixed(1)} hrs listened
                  </span>
                </div>
              </div>
            </div>

            {currentUser && (
              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="p-2.5 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition border border-white/5"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Real Authentication Section */}
          {!currentUser ? (
            <div className="space-y-3 bg-zinc-900/80 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-zinc-300">Sign In to Your Account</span>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('LOGIN'); setErrorMessage(null); }}
                    className={`font-semibold transition ${authMode === 'LOGIN' ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Log In
                  </button>
                  <span className="text-zinc-600">|</span>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('SIGNUP'); setErrorMessage(null); }}
                    className={`font-semibold transition ${authMode === 'SIGNUP' ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Create Account
                  </button>
                </div>
              </div>

              {/* Social & Mobile Login Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full p-3 rounded-xl bg-white text-black font-semibold text-xs flex items-center justify-center gap-2.5 hover:bg-zinc-200 transition shadow-sm"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  )}
                  <span>Continue with Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                  }}
                  className="w-full p-3 rounded-xl bg-zinc-900 border border-white/10 hover:border-cyan-500/40 text-white font-semibold text-xs flex items-center justify-center gap-2.5 hover:bg-zinc-800 transition shadow-sm"
                >
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span>Continue with Mobile</span>
                </button>
              </div>

              <div className="flex items-center gap-2 my-2">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">or with email</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleEmailAuth} className="space-y-2.5">
                {authMode === 'SIGNUP' && (
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    placeholder="Password (min. 6 characters)"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{authMode === 'SIGNUP' ? 'Create Free Account' : 'Sign In'}</span>
                </button>
              </form>
            </div>
          ) : (
            /* Cloud Sync Operations for Authenticated Users */
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase text-zinc-400">Firestore Cloud Synchronization</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={handleCloudBackup}
                  disabled={isBackingUp}
                  className="p-3.5 rounded-2xl bg-zinc-900 border border-white/10 hover:border-indigo-500/40 flex items-center gap-3 text-zinc-300 hover:text-white transition group"
                >
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 group-hover:scale-110 transition">
                    <CloudUpload className={`w-5 h-5 ${isBackingUp ? 'animate-bounce' : ''}`} />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs font-bold text-white">{isBackingUp ? 'Syncing...' : 'Backup to Cloud'}</p>
                    <p className="text-[10px] text-zinc-400">Saves playlists, stats & EQ</p>
                  </div>
                </button>

                <button
                  onClick={handleCloudRestore}
                  disabled={isRestoring}
                  className="p-3.5 rounded-2xl bg-zinc-900 border border-white/10 hover:border-indigo-500/40 flex items-center gap-3 text-zinc-300 hover:text-white transition group"
                >
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 group-hover:scale-110 transition">
                    <CloudDownload className={`w-5 h-5 ${isRestoring ? 'animate-bounce' : ''}`} />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs font-bold text-white">{isRestoring ? 'Restoring...' : 'Restore from Cloud'}</p>
                    <p className="text-[10px] text-zinc-400">Pulls latest device snapshot</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Local SQLite / JSON Manual Backup/Export */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Manual Offline JSON Export</p>
                <p className="text-[10px] text-zinc-400">Export offline library snapshot to file</p>
              </div>
            </div>

            <button
              onClick={handleExportJson}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition flex-shrink-0"
            >
              Export JSON
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center gap-2.5 text-red-300 text-xs font-semibold animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center gap-2.5 text-emerald-300 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
