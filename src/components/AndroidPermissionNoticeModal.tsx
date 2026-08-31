import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Smartphone, 
  FolderSearch, 
  CheckCircle2, 
  AlertTriangle, 
  HardDrive, 
  FileAudio, 
  X, 
  ChevronRight, 
  Copy, 
  Check, 
  Terminal,
  ExternalLink,
  Lock
} from 'lucide-react';
import { isNativeAndroidApp, requestNativeDeviceScan } from '../utils/nativeBridge';

interface AndroidPermissionNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerFolderScan: () => void;
}

export const AndroidPermissionNoticeModal: React.FC<AndroidPermissionNoticeModalProps> = ({
  isOpen,
  onClose,
  onTriggerFolderScan
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'permission' | 'manifest' | 'instructions'>('permission');

  if (!isOpen) return null;

  const isAndroidContainer = isNativeAndroidApp();

  const manifestSnippet = `<!-- AndroidManifest.xml for Aura Music Native APK -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.auramusic.player">

    <!-- Android 13+ (API 33+) Granular Audio Permission -->
    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
    
    <!-- Android 12 and below (API <= 32) Storage Permission -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" 
        android:maxSdkVersion="32" />
        
    <!-- Background playback & foreground audio service -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:requestLegacyExternalStorage="true"
        android:label="Aura Music"
        android:icon="@mipmap/ic_launcher">
        ...
    </application>
</manifest>`;

  const nativeBridgeCode = `// Native MediaStore Scanner Bridge (MainActivity.kt)
class WebAppInterface(private val context: Context, private val webView: WebView) {

    @JavascriptInterface
    fun requestPermissionAndScan() {
        val permission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            Manifest.permission.READ_MEDIA_AUDIO
        } else {
            Manifest.permission.READ_EXTERNAL_STORAGE
        }
        
        if (ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED) {
            val jsonMedia = queryDeviceMediaStore(context)
            webView.post {
                webView.evaluateJavascript("window.onNativeMediaStoreScanComplete('\$jsonMedia');", null)
            }
        } else {
            ActivityCompat.requestPermissions(activity, arrayOf(permission), REQUEST_CODE)
        }
    }
}`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-xl bg-zinc-950 border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
        
        {/* Ambient Glows */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-black shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Android Storage Permission & MediaStore
              </h2>
              <p className="text-xs text-zinc-400">
                READ_MEDIA_AUDIO & READ_EXTERNAL_STORAGE Integration
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 pt-4 pb-2 relative z-10 border-b border-white/5">
          <button
            onClick={() => setActiveTab('permission')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'permission'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🛡️ Permission Status
          </button>
          <button
            onClick={() => setActiveTab('instructions')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'instructions'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            📂 Load Local 1,000+ Songs
          </button>
          <button
            onClick={() => setActiveTab('manifest')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'manifest'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ⚙️ APK Manifest & Bridge
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 relative z-10 scrollbar-thin">
          
          {activeTab === 'permission' && (
            <div className="space-y-4">
              {/* Permission Banner */}
              <div className="p-4 rounded-2xl bg-zinc-900 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white">Runtime Environment</h3>
                      <p className="text-[11px] text-zinc-400">
                        {isAndroidContainer ? 'Android Native WebApp Container Detected' : 'Modern Sandboxed Web Browser'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                    isAndroidContainer 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}>
                    {isAndroidContainer ? 'Native Mode' : 'Browser Sandbox'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="font-semibold">READ_MEDIA_AUDIO (Android 13+)</span>
                    <span className="font-mono text-emerald-400 font-bold">Enabled in Manifest</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="font-semibold">READ_EXTERNAL_STORAGE (Android &lt;= 12)</span>
                    <span className="font-mono text-emerald-400 font-bold">Enabled in Manifest</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="font-semibold">Android MediaStore ContentResolver</span>
                    <span className="font-mono text-indigo-400 font-bold">Auto-Query Configured</span>
                  </div>
                </div>

                {isAndroidContainer ? (
                  <button
                    onClick={() => requestNativeDeviceScan()}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black text-xs font-bold transition flex items-center justify-center gap-2 shadow cursor-pointer active:scale-95"
                  >
                    <ShieldCheck className="w-4 h-4 text-black" />
                    <span>Request OS Storage Permission Now</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed">
                    <strong>Browser Security Notice:</strong> Browsers do not allow websites to silently scan internal storage without user permission. To import your <strong>1,000+ local songs</strong> immediately into the player, tap below to select your <strong>Music</strong> folder or files from your file manager once.
                  </div>
                )}
              </div>

              {/* Direct Folder Import Action Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-zinc-900 to-indigo-950/20 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                    <FolderSearch className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Import Your Entire Local Music Folder</h4>
                    <p className="text-[11px] text-zinc-400">Select /Music or /Download to load all 1,000+ songs instantly</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onTriggerFolderScan();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer active:scale-95 flex items-center justify-center gap-2 shadow"
                >
                  <FileAudio className="w-4 h-4" />
                  <span>Select Local Music Folder</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="space-y-3 text-xs text-zinc-300">
              <div className="p-4 rounded-2xl bg-zinc-900 border border-white/10 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  How to Access All 1,000+ Songs Right Now
                </h3>
                
                <ol className="space-y-2.5 list-decimal list-inside text-zinc-400">
                  <li className="leading-relaxed">
                    <strong className="text-zinc-200">Select Folder:</strong> Click the <span className="text-emerald-400 font-semibold">📁 Scan Folder</span> button in the library.
                  </li>
                  <li className="leading-relaxed">
                    <strong className="text-zinc-200">Pick Directory:</strong> In your device's file manager popup, navigate to your internal storage <code className="text-amber-300 font-mono bg-zinc-950 px-1 py-0.5 rounded">/Music</code> or <code className="text-amber-300 font-mono bg-zinc-950 px-1 py-0.5 rounded">/Download</code> folder.
                  </li>
                  <li className="leading-relaxed">
                    <strong className="text-zinc-200">Instant Indexing:</strong> Aura Music will parse all subfolders, extract ID3 track metadata, embedded artwork, lossless FLAC/WAV bitrate, and save them to local IndexedDB storage.
                  </li>
                  <li className="leading-relaxed">
                    <strong className="text-zinc-200">Persistent Playback:</strong> All loaded tracks will stay in your player even after closing or refreshing the app.
                  </li>
                </ol>

                <button
                  onClick={() => {
                    onClose();
                    onTriggerFolderScan();
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black text-xs font-black transition flex items-center justify-center gap-2 shadow cursor-pointer active:scale-95 mt-2"
                >
                  <span>Select Music Folder & Load Songs Now</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'manifest' && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    AndroidManifest.xml Permissions
                  </span>
                  <button
                    onClick={() => copyToClipboard(manifestSnippet, 'manifest')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300 font-semibold transition cursor-pointer"
                  >
                    {copiedSection === 'manifest' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy XML</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-zinc-950 border border-white/5 font-mono text-[10px] text-zinc-300 overflow-x-auto">
                  {manifestSnippet}
                </pre>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    Native Android JavascriptInterface Bridge
                  </span>
                  <button
                    onClick={() => copyToClipboard(nativeBridgeCode, 'bridge')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300 font-semibold transition cursor-pointer"
                  >
                    {copiedSection === 'bridge' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Kotlin</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-zinc-950 border border-white/5 font-mono text-[10px] text-zinc-300 overflow-x-auto">
                  {nativeBridgeCode}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 relative z-10 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            Close
          </button>

          <button
            onClick={() => {
              onClose();
              onTriggerFolderScan();
            }}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition flex items-center gap-2 cursor-pointer shadow"
          >
            <FolderSearch className="w-3.5 h-3.5 text-black" />
            <span>Select Local Music Folder</span>
          </button>
        </div>

      </div>
    </div>
  );
};
