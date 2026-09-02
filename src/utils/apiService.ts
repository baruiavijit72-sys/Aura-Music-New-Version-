// Client-side API Service for Real Auth, JWT Token Management & Cloud Sync

const API_BASE = '/api';

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  profile?: {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    authProvider: 'EMAIL' | 'GOOGLE' | 'FACEBOOK' | 'PHONE' | 'GUEST';
    avatarUrl?: string;
    isCloudSyncEnabled: boolean;
    totalListeningSeconds: number;
    lastCloudBackup: number;
  };
}

export interface BackupResponse {
  success: boolean;
  message: string;
  updatedAt?: number;
  syncedCounts?: {
    playlists: number;
    tracks: number;
    logs: number;
  };
}

export interface RestoreResponse {
  success: boolean;
  hasData: boolean;
  message?: string;
  backup?: {
    playlists: any[];
    tracks: any[];
    equalizer: any;
    listeningLogs: any[];
    updatedAt: number;
  };
}

// Token Storage
const TOKEN_KEY = 'aura_auth_jwt_token';

export function getStoredJwtToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveJwtToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.error('Failed to store token', e);
  }
}

export function clearJwtToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.error('Failed to clear token', e);
  }
}

// 1. Health Check
export async function checkServerHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return await res.json();
  } catch (err) {
    return { status: 'offline', error: String(err) };
  }
}

// 2. Register with Email + Bcrypt Password
export async function apiRegister(name: string, email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data: AuthResponse = await res.json();
  if (data.success && data.token) {
    saveJwtToken(data.token);
  }
  return data;
}

// 3. Login with Email + Password
export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data: AuthResponse = await res.json();
  if (data.success && data.token) {
    saveJwtToken(data.token);
  }
  return data;
}

// 4. OAuth / Phone Auth Token Sync (Google / Phone / Facebook)
export async function apiOAuthSync(payload: {
  provider: 'GOOGLE' | 'FACEBOOK' | 'PHONE';
  email: string;
  name?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  providerUid?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/oauth-sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data: AuthResponse = await res.json();
  if (data.success && data.token) {
    saveJwtToken(data.token);
  }
  return data;
}

// 4.1 Real SMS OTP Dispatch API
export interface SendOtpResponse {
  success: boolean;
  message: string;
  fullPhone?: string;
  realSmsDelivered?: boolean;
  gatewayProvider?: string;
  deliveryDetails?: string;
  fallbackCode?: string;
  expiresInSeconds?: number;
}

export async function apiSendSmsOtp(countryCode: string, phoneNumber: string): Promise<SendOtpResponse> {
  const res = await fetch(`${API_BASE}/auth/send-sms-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ countryCode, phoneNumber }),
  });
  return await res.json();
}

// 4.2 Real SMS OTP Verification API
export async function apiVerifySmsOtp(countryCode: string, phoneNumber: string, code: string, name?: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/verify-sms-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ countryCode, phoneNumber, code, name }),
  });
  const data: AuthResponse = await res.json();
  if (data.success && data.token) {
    saveJwtToken(data.token);
  }
  return data;
}


// 5. Get Current User via JWT Token
export async function apiGetMe(): Promise<AuthResponse> {
  const token = getStoredJwtToken();
  if (!token) {
    return { success: false, message: 'No token stored' };
  }

  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await res.json();
}

// 6. Push Full Backup
export async function apiPushBackup(payload: {
  playlists: any[];
  tracks: any[];
  equalizer: any;
  listeningLogs: any[];
  totalListeningSeconds?: number;
}): Promise<BackupResponse> {
  const token = getStoredJwtToken();
  if (!token) {
    throw new Error('Please sign in with your Aura Account to sync with Cloud');
  }

  const res = await fetch(`${API_BASE}/sync/backup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  return await res.json();
}

// 7. Pull Backup from Cloud
export async function apiRestoreBackup(): Promise<RestoreResponse> {
  const token = getStoredJwtToken();
  if (!token) {
    throw new Error('Please sign in to restore from Cloud');
  }

  const res = await fetch(`${API_BASE}/sync/restore`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await res.json();
}
