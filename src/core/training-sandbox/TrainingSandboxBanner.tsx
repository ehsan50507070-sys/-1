// Persistent Top Bar for Isolated Training Sandbox Sessions
// Compact, responsive, RTL, light/dark compatible with Quick Role Switcher, Reset Dummy Data, and Exit.
import React, { useState } from 'react';
import { GraduationCap, LogOut, RotateCcw, UserCog } from 'lucide-react';
import type { RoleId } from '../../types/domain';
import { useSchoolData } from '../data/DataContext';
import { useRouter } from '../router/RouterContext';
import { useToast } from '../ui/ToastContext';
import { TRAINING_SANDBOX_ROLE_OPTIONS } from './trainingSandboxSeed';

export const TrainingSandboxBanner: React.FC = () => {
  const {
    isTrainingSandbox,
    activeRole,
    switchTrainingSandboxRole,
    resetTrainingSandboxData,
    exitTrainingSandbox,
  } = useSchoolData();
  const { navigate } = useRouter();
  const { showToast } = useToast();
  const [resetting, setResetting] = useState(false);

  if (!isTrainingSandbox) return null;

  const handleRoleSwitch = (nextRole: RoleId) => {
    switchTrainingSandboxRole(nextRole);
    const label =
      TRAINING_SANDBOX_ROLE_OPTIONS.find((r) => r.role === nextRole)?.labelFa ?? nextRole;
    navigate('/dashboard');
    showToast(`نقش تمرینی به «${label}» تغییر یافت (مدرسه نمونه آموزشی).`, 'info');
  };

  const handleReset = async () => {
    if (resetting) return;
    setResetting(true);
    try {
      const res = await resetTrainingSandboxData();
      if (res.ok) {
        showToast('تمامی داده‌های مثالی محیط آموزشی با موفقیت به حالت اولیه بازنشانی شد.', 'success');
      }
    } finally {
      setResetting(false);
    }
  };

  const handleExit = () => {
    exitTrainingSandbox();
    navigate('/login', { replace: true });
    showToast('از محیط آموزشی خارج شدید.', 'info');
  };

  return (
    <div
      role="status"
      data-testid="training-sandbox-banner"
      dir="rtl"
      className="bg-amber-50 dark:bg-amber-950/90 border-b border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100 px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs"
    >
      <div className="flex items-center gap-2 font-bold min-w-0">
        <GraduationCap className="w-4 h-4 text-amber-700 dark:text-amber-300 shrink-0" />
        <span className="leading-5">
          محیط آموزشی (داده‌های مثالی) — تغییرات این بخش روی اطلاعات واقعی مدارس ثبت نمی‌شود
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
        {/* 1. Quick Training Role Switcher */}
        <label className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 px-2 py-1 text-[11px] font-bold text-slate-800 dark:text-slate-100">
          <UserCog className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300 shrink-0" />
          <span className="hidden sm:inline whitespace-nowrap">نقش تمرینی:</span>
          <select
            aria-label="تغییر سریع نقش تمرینی"
            data-testid="training-role-switcher"
            value={activeRole}
            onChange={(e) => handleRoleSwitch(e.target.value as RoleId)}
            className="bg-transparent text-[11px] font-extrabold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
          >
            {TRAINING_SANDBOX_ROLE_OPTIONS.map((opt) => (
              <option
                key={opt.role}
                value={opt.role}
                className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white"
              >
                {opt.labelFa}
              </option>
            ))}
          </select>
        </label>

        {/* 2. Reset Dummy Data */}
        <button
          type="button"
          data-testid="training-reset-btn"
          disabled={resetting}
          onClick={() => void handleReset()}
          className="min-h-[34px] inline-flex items-center gap-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 hover:bg-amber-100 dark:hover:bg-amber-900/60 px-2.5 py-1 text-[11px] font-bold text-amber-900 dark:text-amber-100 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 shrink-0 ${resetting ? 'animate-spin' : ''}`} />
          <span>{resetting ? 'در حال بازنشانی...' : 'بازنشانی داده‌های مثالی'}</span>
        </button>

        {/* 3. Exit Training Sandbox */}
        <button
          type="button"
          data-testid="training-exit-btn"
          onClick={handleExit}
          className="min-h-[34px] inline-flex items-center gap-1.5 rounded-lg bg-amber-800 hover:bg-amber-900 dark:bg-amber-600 dark:hover:bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white transition-colors whitespace-nowrap shrink-0"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span>خروج از محیط آموزش</span>
        </button>
      </div>
    </div>
  );
};
