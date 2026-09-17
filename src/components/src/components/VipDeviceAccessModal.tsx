import React from 'react';
import { ShieldAlert, Smartphone, Users, Sparkles, ChevronRight, X, Lock } from 'lucide-react';

interface VipDeviceAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  planType: 'personal_vip' | 'family_vip' | string;
  errorMessage: string;
  onUpgradeToFamily?: () => void;
  onOpenManageDevices?: () => void;
}

export const VipDeviceAccessModal: React.FC<VipDeviceAccessModalProps> = ({
  isOpen,
  onClose,
  planType,
  errorMessage,
  onUpgradeToFamily,
  onOpenManageDevices
}) => {
  if (!isOpen) return null;

  const isPersonal = planType === 'personal_vip' || errorMessage.includes('Personal VIP');

  return (
    <div id="vip-device-access-blocked-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl p-6 sm:p-8 bg-neutral-950 border border-neutral-800 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-5">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/30 inline-block">
            {isPersonal ? 'Personal VIP • 1 Device Limit' : 'Family VIP • 5/5 Slots Filled'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Device Access Restricted
          </h2>
          <p className="text-sm text-neutral-300 leading-relaxed pt-1">
            {errorMessage || (isPersonal
              ? 'Personal VIP is restricted to 1 active device. Please log in from your registered device or upgrade to Family VIP.'
              : 'Device limit reached (5/5). Please remove an existing device from the Manage Family dashboard to add this device.')}
          </p>
        </div>

        {/* Informative breakdown card */}
        <div className="mt-5 p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
          <div className="flex items-center gap-3 text-xs text-neutral-300">
            {isPersonal ? (
              <>
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Your account is currently bound to your primary device hardware slot.</span>
              </>
            ) : (
              <>
                <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>All 5 Digital SIM slots in your Family Plan are currently occupied.</span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          {isPersonal ? (
            <>
              <button
                type="button"
                id="btn-modal-upgrade-family"
                onClick={() => {
                  onClose();
                  onUpgradeToFamily?.();
                }}
                className="w-full py-3.5 px-5 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 fill-black" />
                Upgrade to Family VIP (5 Devices)
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-2xl text-xs font-semibold text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                Continue in Free Ad-Supported Mode
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                id="btn-modal-manage-slots"
                onClick={() => {
                  onClose();
                  onOpenManageDevices?.();
                }}
                className="w-full py-3.5 px-5 rounded-2xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                Open Manage Family Dashboard
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-2xl text-xs font-semibold text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                Dismiss
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
