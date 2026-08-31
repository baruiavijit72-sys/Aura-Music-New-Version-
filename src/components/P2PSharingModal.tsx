import React, { useState, useEffect } from 'react';
import { 
  X, 
  Share2, 
  QrCode, 
  Radio, 
  Smartphone, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Send, 
  History, 
  Zap,
  Download,
  Copy,
  Check,
  Edit3,
  ExternalLink,
  Music,
  FolderDown,
  AlertCircle,
  Play,
  Share,
  Bluetooth
} from 'lucide-react';
import { Track, Playlist, P2PPeer, P2PTransferLog } from '../types';
import { 
  getStoredDeviceName, 
  saveStoredDeviceName, 
  downloadTrackToDevice,
  shareTrackViaNativeOS,
  createRealTransferRoom,
  listenToTransferRoom,
  receiveTransferRoomByPin,
  broadcastLiveDevicePresence,
  subscribeToLiveMeshPeers
} from '../utils/audioTransfer';

interface P2PSharingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  playlists: Playlist[];
  initialSelectedTrack?: Track | null;
  transferLogs: P2PTransferLog[];
  onAddTransferLog: (log: P2PTransferLog) => void;
  onImportTrack?: (newTrack: Track) => void;
  onPlayTrack?: (track: Track) => void;
  initialPin?: string | null;
}

export const P2PSharingModal: React.FC<P2PSharingModalProps> = ({
  isOpen,
  onClose,
  tracks,
  initialSelectedTrack,
  transferLogs,
  onAddTransferLog,
  onImportTrack,
  onPlayTrack,
  initialPin
}) => {
  const [activeTab, setActiveTab] = useState<'send' | 'receive' | 'history'>(
    initialPin ? 'receive' : 'send'
  );
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>(
    initialSelectedTrack ? [initialSelectedTrack.id] : (tracks.length > 0 ? [tracks[0].id] : [])
  );
  
  // Device Name State
  const [deviceName, setDeviceName] = useState<string>(getStoredDeviceName());
  const [isEditingDeviceName, setIsEditingDeviceName] = useState(false);
  const [tempDeviceName, setTempDeviceName] = useState(deviceName);

  // Mesh Discovered Peers
  const [livePeers, setLivePeers] = useState<P2PPeer[]>([]);

  // Active Transfer Session (Sender)
  const [activeSessionPin, setActiveSessionPin] = useState<string | null>(null);
  const [sessionShareUrl, setSessionShareUrl] = useState<string>('');
  const [sessionQrCode, setSessionQrCode] = useState<string>('');
  const [sessionStatus, setSessionStatus] = useState<string>('IDLE');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  
  // Receive Mode States
  const [receivePinInput, setReceivePinInput] = useState<string>(initialPin || '');
  const [isReceiving, setIsReceiving] = useState(false);
  const [receivedSuccessTracks, setReceivedSuccessTracks] = useState<Track[]>([]);

  // Feedback & Progress
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isExportingFile, setIsExportingFile] = useState(false);

  useEffect(() => {
    if (initialPin) {
      setReceivePinInput(initialPin);
      setActiveTab('receive');
    }
  }, [initialPin]);

  // Subscribe to Live Peers in real-time
  useEffect(() => {
    if (!isOpen) return;
    const unsubscribePeers = subscribeToLiveMeshPeers((peers) => {
      setLivePeers(peers);
    });
    return () => unsubscribePeers();
  }, [isOpen]);

  // Broadcast Live Beacon when in Receive Mode
  useEffect(() => {
    if (!isOpen || activeTab !== 'receive') return;
    const cleanupBeacon = broadcastLiveDevicePresence(deviceName);
    return () => cleanupBeacon();
  }, [isOpen, activeTab, deviceName]);

  // Listen to Active Transfer Room updates
  useEffect(() => {
    if (!activeSessionPin) return;

    const unsubscribeRoom = listenToTransferRoom(activeSessionPin, (data) => {
      if (data.status === 'COMPLETED') {
        setSessionStatus('COMPLETED');
        const firstTrack = tracks.find(t => t.id === selectedTrackIds[0]) || tracks[0];
        
        onAddTransferLog({
          id: `transfer-${Date.now()}`,
          fileName: `${firstTrack?.title || 'Song'}.${firstTrack?.format?.toLowerCase() || 'mp3'}`,
          trackTitle: selectedTrackIds.length > 1 ? `${selectedTrackIds.length} Songs Package` : (firstTrack?.title || 'Audio Track'),
          fileSizeBytes: selectedTrackIds.reduce((acc, id) => {
            const tr = tracks.find(t => t.id === id);
            return acc + (tr?.fileSizeBytes || 8000000);
          }, 0),
          speedMbps: 48.5,
          progressPercent: 100,
          direction: 'SENT',
          peerDeviceName: data.receiverDeviceName || 'Recipient Phone',
          protocol: 'WIFI_DIRECT',
          status: 'COMPLETED',
          timestamp: Date.now(),
        });

        setStatusMessage({
          type: 'success',
          text: `Transfer Complete! Received by ${data.receiverDeviceName || 'Recipient Phone'}.`
        });
      }
    });

    return () => unsubscribeRoom();
  }, [activeSessionPin, tracks, selectedTrackIds, onAddTransferLog]);

  if (!isOpen) return null;

  const toggleSelectTrack = (id: string) => {
    if (selectedTrackIds.includes(id)) {
      setSelectedTrackIds(selectedTrackIds.filter(t => t !== id));
    } else {
      setSelectedTrackIds([...selectedTrackIds, id]);
    }
  };

  const handleSaveDeviceName = () => {
    if (tempDeviceName.trim()) {
      setDeviceName(tempDeviceName.trim());
      saveStoredDeviceName(tempDeviceName.trim());
      setIsEditingDeviceName(false);
      setStatusMessage({ type: 'success', text: `Device renamed to "${tempDeviceName.trim()}".` });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Create Real Transfer Room (6-Digit PIN + QR Code)
  const handleCreateLiveSession = async () => {
    if (selectedTrackIds.length === 0) {
      setStatusMessage({ type: 'error', text: 'Select at least one song to transfer.' });
      return;
    }

    try {
      setIsCreatingSession(true);
      const selectedTracks = tracks.filter(t => selectedTrackIds.includes(t.id));
      setStatusMessage({ type: 'info', text: 'Creating transfer room...' });
      
      const { pinCode, shareUrl, qrDataUrl } = await createRealTransferRoom(selectedTracks, deviceName);
      setActiveSessionPin(pinCode);
      setSessionShareUrl(shareUrl);
      setSessionQrCode(qrDataUrl);
      setSessionStatus('WAITING');
      setStatusMessage({ 
        type: 'success', 
        text: `Room created! PIN: ${pinCode}` 
      });
    } catch (err: any) {
      console.error('Transfer session error:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to create transfer room.' });
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Mobile OS Share Sheet
  const handleNativeShare = async () => {
    if (selectedTrackIds.length === 0) {
      setStatusMessage({ type: 'error', text: 'Select at least one song to share.' });
      return;
    }

    const firstTrack = tracks.find(t => t.id === selectedTrackIds[0]) || tracks[0];
    setStatusMessage({ type: 'info', text: 'Opening share menu...' });

    const result = await shareTrackViaNativeOS(firstTrack);
    if (result.success) {
      onAddTransferLog({
        id: `transfer-${Date.now()}`,
        fileName: `${firstTrack.title}.${firstTrack.format.toLowerCase()}`,
        trackTitle: firstTrack.title,
        fileSizeBytes: firstTrack.fileSizeBytes,
        speedMbps: 28.0,
        progressPercent: 100,
        direction: 'SENT',
        peerDeviceName: 'System Share',
        protocol: 'WIFI_DIRECT',
        status: 'COMPLETED',
        timestamp: Date.now(),
      });

      setStatusMessage({ type: 'success', text: result.message });
      setTimeout(() => setStatusMessage(null), 4000);
    } else {
      setStatusMessage({ type: 'error', text: result.message });
    }
  };

  // Direct File Download
  const handleDownloadDirectFile = async () => {
    if (selectedTrackIds.length === 0) return;
    setIsExportingFile(true);
    setStatusMessage({ type: 'info', text: 'Saving audio file...' });

    try {
      const selectedTracks = tracks.filter(t => selectedTrackIds.includes(t.id));
      for (const track of selectedTracks) {
        await downloadTrackToDevice(track);
      }
      setStatusMessage({ 
        type: 'success', 
        text: `Saved ${selectedTracks.length} song(s) to Downloads folder.` 
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Download failed: ' + err.message });
    } finally {
      setIsExportingFile(false);
    }
  };

  // Receive Tracks by entering 6-Digit PIN
  const handleReceiveByPin = async (customPin?: string) => {
    const pinToUse = customPin || receivePinInput;
    if (!pinToUse.trim() || pinToUse.length !== 6) {
      setStatusMessage({ type: 'error', text: 'Enter a valid 6-digit PIN code.' });
      return;
    }

    setIsReceiving(true);
    setStatusMessage({ type: 'info', text: 'Receiving songs...' });

    try {
      const result = await receiveTransferRoomByPin(pinToUse, deviceName);
      
      if (onImportTrack && result.tracks.length > 0) {
        result.tracks.forEach((track) => {
          onImportTrack(track);
        });
      }

      setReceivedSuccessTracks(result.tracks);

      onAddTransferLog({
        id: `transfer-${Date.now()}`,
        fileName: `${result.tracks[0].title}.${result.tracks[0].format.toLowerCase()}`,
        trackTitle: result.tracks.length > 1 ? `${result.tracks.length} Songs Package` : result.tracks[0].title,
        fileSizeBytes: result.tracks.reduce((acc, t) => acc + (t.fileSizeBytes || 8000000), 0),
        speedMbps: 52.4,
        progressPercent: 100,
        direction: 'RECEIVED',
        peerDeviceName: result.senderName,
        protocol: 'WIFI_DIRECT',
        status: 'COMPLETED',
        timestamp: Date.now(),
      });

      setStatusMessage({
        type: 'success',
        text: `Received ${result.tracks.length} song(s) from "${result.senderName}".`
      });
    } catch (err: any) {
      console.error('Receive error:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Room not found. Check the PIN.' });
    } finally {
      setIsReceiving(false);
    }
  };

  const handleCopyPin = () => {
    if (activeSessionPin) {
      navigator.clipboard.writeText(activeSessionPin);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (sessionShareUrl) {
      navigator.clipboard.writeText(sessionShareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-2xl bg-black/85">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col bg-zinc-950 border border-white/15 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Clean Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-none">Song Transfer</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[11px] text-zinc-400">Device:</span>
                {isEditingDeviceName ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={tempDeviceName}
                      onChange={(e) => setTempDeviceName(e.target.value)}
                      className="px-2 py-0.5 rounded bg-zinc-900 border border-emerald-500/50 text-[11px] text-white outline-none w-28"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveDeviceName}
                      className="p-1 rounded bg-emerald-600 text-white"
                      title="Save"
                    >
                      <Check className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditingDeviceName(true)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:underline"
                    title="Rename device"
                  >
                    <span>{deviceName}</span>
                    <Edit3 className="w-2.5 h-2.5 opacity-70" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Clean 3-Tab Switcher */}
        <div className="grid grid-cols-3 gap-1 p-1.5 bg-zinc-900/90 border-b border-white/10">
          <button
            onClick={() => setActiveTab('send')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition ${
              activeTab === 'send'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>

          <button
            onClick={() => setActiveTab('receive')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition ${
              activeTab === 'receive'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Receive</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History ({transferLogs.length})</span>
          </button>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div className={`px-4 py-2 text-xs font-medium flex items-center justify-between border-b ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30' 
              : statusMessage.type === 'error'
              ? 'bg-rose-950/80 text-rose-300 border-rose-500/30'
              : 'bg-zinc-900 text-zinc-300 border-white/10'
          }`}>
            <div className="flex items-center gap-2 truncate">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-indigo-400 animate-spin flex-shrink-0" />
              )}
              <span className="truncate">{statusMessage.text}</span>
            </div>
            <button 
              onClick={() => setStatusMessage(null)}
              className="text-zinc-400 hover:text-white ml-2 text-xs p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* TAB 1: SEND */}
          {activeTab === 'send' && (
            <div className="space-y-4">
              
              {/* Active Session Card */}
              {activeSessionPin ? (
                <div className="p-4 rounded-2xl bg-zinc-900 border border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Transfer Room Active</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                      {sessionStatus === 'COMPLETED' ? 'COMPLETED' : 'WAITING'}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-xl bg-black/60 border border-white/10">
                    {sessionQrCode && (
                      <div className="flex flex-col items-center">
                        <img 
                          src={sessionQrCode} 
                          alt="Transfer QR Code" 
                          className="w-36 h-36 rounded-lg border border-emerald-500/20"
                        />
                      </div>
                    )}

                    <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-zinc-400">Transfer PIN:</p>
                        <p className="text-3xl font-mono font-black text-emerald-400 tracking-widest mt-0.5">
                          {activeSessionPin.slice(0, 3)} {activeSessionPin.slice(3)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                        <button
                          onClick={handleCopyPin}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition border border-white/10"
                        >
                          {copiedPin ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedPin ? 'Copied' : 'Copy PIN'}</span>
                        </button>

                        <button
                          onClick={handleCopyLink}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition border border-white/10"
                        >
                          {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <ExternalLink className="w-3 h-3" />}
                          <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Action Buttons Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={handleCreateLiveSession}
                  disabled={selectedTrackIds.length === 0 || isCreatingSession}
                  className="py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow"
                >
                  <Zap className="w-4 h-4" />
                  <span>Create Room</span>
                </button>

                <button
                  onClick={handleNativeShare}
                  disabled={selectedTrackIds.length === 0}
                  className="py-3 px-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow"
                >
                  <Share className="w-4 h-4" />
                  <span>Share</span>
                </button>

                <button
                  onClick={handleDownloadDirectFile}
                  disabled={selectedTrackIds.length === 0 || isExportingFile}
                  className="py-3 px-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white text-xs font-bold transition flex items-center justify-center gap-2 border border-white/10"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Save to Device</span>
                </button>
              </div>

              {/* Track Selection Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase text-zinc-400">
                    Selected Songs ({selectedTrackIds.length})
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      onClick={() => setSelectedTrackIds(tracks.map(t => t.id))}
                      className="text-emerald-400 hover:underline font-semibold"
                    >
                      Select All
                    </button>
                    <span className="text-zinc-600">•</span>
                    <button
                      onClick={() => setSelectedTrackIds([])}
                      className="text-zinc-400 hover:text-white"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {tracks.map((track) => {
                    const isSelected = selectedTrackIds.includes(track.id);
                    return (
                      <div
                        key={track.id}
                        onClick={() => toggleSelectTrack(track.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                          isSelected
                            ? 'bg-emerald-500/15 border border-emerald-500/40 text-white'
                            : 'bg-zinc-900 border border-white/5 text-zinc-400 hover:bg-zinc-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="accent-emerald-500 rounded"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-white truncate">{track.title}</p>
                            <p className="text-[11px] text-zinc-400 truncate">{track.artist}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 ml-2">
                          {(track.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Nearby Devices */}
              {livePeers.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold uppercase text-zinc-400">Nearby Devices</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {livePeers.map((peer) => (
                      <div
                        key={peer.id}
                        className="p-2.5 rounded-xl bg-zinc-900 border border-emerald-500/30 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                            style={{ background: peer.avatarColor }}
                          >
                            <Smartphone className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-white truncate">{peer.name}</p>
                            <p className="text-[10px] text-emerald-400">{peer.signalStrength}% Signal</p>
                          </div>
                        </div>

                        <button
                          onClick={handleCreateLiveSession}
                          disabled={selectedTrackIds.length === 0}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Send</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: RECEIVE */}
          {activeTab === 'receive' && (
            <div className="space-y-4">
              
              {/* Receiver Card */}
              <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-zinc-900 border border-emerald-500/30 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">Receive Mode Active</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Broadcasting as: <span className="text-emerald-400 font-bold">{deviceName}</span>
                  </p>
                </div>
              </div>

              {/* PIN Receiver Input Box */}
              <div className="p-4 rounded-2xl bg-zinc-900 border border-white/10 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <h4 className="text-xs font-bold uppercase text-white">Enter 6-Digit PIN</h4>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 582914"
                    value={receivePinInput}
                    onChange={(e) => setReceivePinInput(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 px-3 py-2.5 rounded-xl bg-black/60 border border-white/15 text-center text-base font-mono font-bold text-emerald-400 tracking-widest placeholder-zinc-600 outline-none focus:border-emerald-500"
                  />

                  <button
                    onClick={() => handleReceiveByPin()}
                    disabled={receivePinInput.length !== 6 || isReceiving}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <FolderDown className="w-3.5 h-3.5" />
                    <span>{isReceiving ? 'Receiving...' : 'Receive'}</span>
                  </button>
                </div>
              </div>

              {/* Received Success Showcase */}
              {receivedSuccessTracks.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Received {receivedSuccessTracks.length} Song(s):</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    {receivedSuccessTracks.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-2 rounded-xl bg-black/40 text-xs">
                        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                          <Music className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span className="font-bold text-white truncate">{t.title}</span>
                          <span className="text-zinc-400 truncate">• {t.artist}</span>
                        </div>
                        <div className="flex items-center gap-1.5 ml-2">
                          {onPlayTrack && (
                            <button
                              onClick={() => {
                                onPlayTrack(t);
                                onClose();
                              }}
                              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition"
                              title="Play"
                            >
                              <Play className="w-3 h-3 fill-current" />
                            </button>
                          )}
                          <button
                            onClick={() => downloadTrackToDevice(t)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition"
                            title="Download"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-2">
              {transferLogs.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  No previous transfer records.
                </div>
              ) : (
                transferLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className={`p-1.5 rounded-lg ${log.direction === 'SENT' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {log.direction === 'SENT' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{log.trackTitle}</p>
                        <p className="text-[10px] text-zinc-400 truncate">{log.peerDeviceName}</p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                        COMPLETED
                      </span>
                      <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                        {(log.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
