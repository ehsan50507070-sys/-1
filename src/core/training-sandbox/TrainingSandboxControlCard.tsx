// Exclusive Super Admin Control Card for Isolated Training Sandbox
// Placed in real SuperAdminPage and /data-health-migration security settings.
import React, { useState } from 'react';
import { GraduationCap, Lock, ShieldCheck } from 'lucide-react';
import { toPersianDigits } from '../../lib/digits';
import { useSchoolData } from '../data/DataContext';
import { useToast } from '../ui/ToastContext';

export interface TrainingSandboxControlCardProps {
  variant?: 'compact' | 'full';
  onStatusChange?: (feedback: { type: 'ok' | 'err'; text: string }) => void;
}

export const TrainingSandboxControlCard: React.FC<TrainingSandboxControlCardProps> = ({
  variant = 'full',
  onStatusChange,
}) => {
  const {
    realSession,
    isTrainingSandbox,
    trainingSandboxEnabled,
    globalSystemConfig,
    setTrainingSandboxEnabled,
  } = useSchoolData();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const isRealSuperAdmin = !isTrainingSandbox && realSession?.role === 'super_admin';
  const isCompact = variant === 'compact';

  const handleToggle = async () => {
    if (!isRealSuperAdmin || submitting) return;
    setSubmitting(true);
    try {
      const next = !trainingSandboxEnabled;
      const res = await setTrainingSandboxEnabled(next);
      if (res.ok) {
        const msg = next
          ? 'حالت آموزش (محیط تمرینی ایزوله) در صفحه ورود فعال شد و در زنجیره امنیتی SHA-256 ثبت گردید.'
          : 'حالت آموزش (محیط تمرینی ایزوله) در صفحه ورود غیرفعال شد و در زنجیره امنیتی SHA-256 ثبت گردید.';
        onStatusChange?.({ type: 'ok', text: msg });
        showToast(msg, next ? 'warning' : 'success');
      } else {
        const errMsg = res.errorFa ?? 'تغییر وضعیت حالت آموزش ناموفق بود.';
        onStatusChange?.({ type: 'err', text: errMsg });
        showToast(errMsg, 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      aria-label="حالت آموزش (محیط تمرینی ایزوله در صفحه ورود)"
      data-testid={`training-sandbox-control-${variant}`}
      dir="rtl"
      className={`rounded-2xl border transition-colors ${
        trainingSandboxEnabled && !isTrainingSandbox
          ? 'border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/30'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
      } ${isCompact ? 'p-4' : 'p-5'} space-y-3 shadow-xs`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              trainingSandboxEnabled && !isTrainingSandbox
                ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                حالت آموزش (محیط تمرینی ایزوله در صفحه ورود)
              </h2>
              <span
                className={`text-xs font-bold ${
                  trainingSandboxEnabled && !isTrainingSandbox
                    ? 'text-amber-800 dark:text-amber-300'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                · {trainingSandboxEnabled && !isTrainingSandbox ? 'روشن (فعال در صفحه ورود)' : 'خاموش (پیش‌فرض ایمن)'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-5">
              در صورت فعال بودن، باکس ورود سریع تمرینی با داده‌های ۱۰۰٪ فرضی و مدرسه نمونه ایزوله در صفحه ورود نمایش داده می‌شود و هیچ دسترسی به اطلاعات واقعی مدارس مجموعه وجود نخواهد داشت.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {isTrainingSandbox ? (
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 px-3 py-2 text-xs font-bold text-amber-900 dark:text-amber-200">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>فقط از پنل واقعی راهبر ارشد قابل تغییر است</span>
            </div>
          ) : (
            <button
              type="button"
              role="switch"
              aria-checked={trainingSandboxEnabled}
              aria-label="تغییر وضعیت حالت آموزش (محیط تمرینی ایزوله در صفحه ورود)"
              data-testid="training-sandbox-toggle-btn"
              disabled={!isRealSuperAdmin || submitting}
              onClick={() => void handleToggle()}
              className={`min-h-[42px] inline-flex items-center gap-2.5 rounded-xl border px-3.5 py-2 text-xs font-extrabold transition-colors whitespace-nowrap shrink-0 disabled:opacity-50 ${
                trainingSandboxEnabled
                  ? 'border-amber-400 dark:border-amber-600 bg-amber-600 hover:bg-amber-700 text-white'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100'
              }`}
            >
              <span
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                  trainingSandboxEnabled ? 'bg-white/30' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform ${
                    trainingSandboxEnabled ? '-translate-x-4.5' : '-translate-x-1'
                  }`}
                />
              </span>
              <span>{trainingSandboxEnabled ? 'خاموش کردن حالت آموزش' : 'روشن کردن حالت آموزش'}</span>
            </button>
          )}
        </div>
      </div>

      {!isCompact && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 dark:border-slate-800 pt-2.5 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              ایزوله‌سازی کامل مخزن (sessionStorage مجزا) · هر تغییر در زنجیره ممیزی ضددستکاری SHA-256 ثبت می‌شود.
            </span>
          </div>
          {globalSystemConfig.trainingSandboxUpdatedAt && !isTrainingSandbox && (
            <span className="tabular-nums">
              آخرین تغییر: {toPersianDigits(globalSystemConfig.trainingSandboxUpdatedAt)}
              {globalSystemConfig.trainingSandboxUpdatedByName
                ? ` توسط ${globalSystemConfig.trainingSandboxUpdatedByName}`
                : ''}
            </span>
          )}
        </div>
      )}
    </section>
  );
};
