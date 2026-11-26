// Pure Business Logic for Phase 9-D Public Portal, CMS & Pre-Registration Requests
import { toAsciiDigits, toPersianDigits } from '../../lib/digits';
import { sanitizeText } from '../../core/security/sanitize';
import { GLOBAL_TENANT_ID } from '../../core/super-admin/superAdminHelpers';
import type {
  PreRegRequestStatus,
  PublicHonorCategory,
  PublicPortalConfig,
  PublicPortalHonor,
  PublicPortalNews,
  School,
} from '../../types/domain';

export const COMPLEX_GENERAL_PREREG_ID = '__complex_general__';

export const HONOR_CATEGORY_LABELS_FA: Record<PublicHonorCategory, string> = {
  academic: 'افتخار علمی و المپیاد',
  educational: 'دستاورد پرورشی و فرهنگی',
  research: 'پژوهش و فناوری',
  sports: 'ورزش و تندرستی',
};

export const PREREG_STATUS_META: Record<
  PreRegRequestStatus,
  { labelFa: string; toneClass: string }
> = {
  new: {
    labelFa: 'جدید (در انتظار تماس)',
    toneClass:
      'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
  },
  contacted: {
    labelFa: 'تماس گرفته شد',
    toneClass:
      'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
  },
  archived: {
    labelFa: 'بایگانی‌شده',
    toneClass:
      'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
  },
};

export const GRADE_LEVEL_OPTIONS_BY_SCHOOL_LEVEL: Record<
  NonNullable<School['gradeLevel']>,
  string[]
> = {
  elementary: ['پیش‌دبستانی', 'پایه اول', 'پایه دوم', 'پایه سوم', 'پایه چهارم', 'پایه پنجم', 'پایه ششم'],
  middle: ['پایه هفتم', 'پایه هشتم', 'پایه نهم'],
  high: ['پایه دهم (ریاضی/تجربی/انسانی)', 'پایه یازدهم', 'پایه دوازدهم'],
};

export const ALL_PUBLIC_GRADE_OPTIONS: string[] = [
  'پیش‌دبستانی',
  'پایه اول ابتدایی',
  'پایه دوم ابتدایی',
  'پایه سوم ابتدایی',
  'پایه چهارم ابتدایی',
  'پایه پنجم ابتدایی',
  'پایه ششم ابتدایی',
  'پایه هفتم (متوسطه اول)',
  'پایه هشتم (متوسطه اول)',
  'پایه نهم (متوسطه اول)',
  'پایه دهم (متوسطه دوم)',
  'پایه یازدهم (متوسطه دوم)',
  'پایه دوازدهم (متوسطه دوم)',
];

/**
 * Normalizes Persian/Arabic digits and spaces, then validates standard Iranian mobile numbers (09XXXXXXXXX).
 */
export function normalizeIranianMobile(raw: string): string {
  const digits = toAsciiDigits(raw).replace(/[^\d]/g, '');
  if (digits.startsWith('98') && digits.length === 12) {
    return `0${digits.slice(2)}`;
  }
  if (digits.startsWith('9') && digits.length === 10) {
    return `0${digits}`;
  }
  return digits;
}

export function validateIranianMobile(raw: string): { valid: boolean; normalized: string; errorFa?: string } {
  const normalized = normalizeIranianMobile(raw);
  if (!/^09\d{9}$/.test(normalized)) {
    return {
      valid: false,
      normalized,
      errorFa: 'شماره همراه باید ۱۱ رقم و با پیش‌شماره ۰۹ معتبر ایران باشد (مثلاً ۰۹۱۲۳۴۵۶۷۸۹).',
    };
  }
  return { valid: true, normalized };
}

export function generatePreRegTrackingCode(jalaliDate: string, existingCount: number): string {
  const year = toAsciiDigits(jalaliDate).split('/')[0] || '1404';
  const seq = String(1001 + existingCount + Math.floor(Math.random() * 89)).padStart(4, '0');
  return `پ‌ث-${toPersianDigits(year)}-${toPersianDigits(seq)}`;
}

export interface PreRegInput {
  parentName: string;
  studentName: string;
  mobile: string;
  targetSchoolId: string;
  gradeLabel: string;
  message?: string;
}

export function validatePreRegInput(input: PreRegInput): {
  valid: boolean;
  errorFa?: string;
  sanitized?: {
    parentName: string;
    studentName: string;
    mobile: string;
    targetSchoolId: string;
    gradeLabel: string;
    message: string;
  };
} {
  const parentName = sanitizeText(input.parentName, 120);
  const studentName = sanitizeText(input.studentName, 120);
  const gradeLabel = sanitizeText(input.gradeLabel, 80);
  const message = sanitizeText(input.message ?? '', 600);
  const targetSchoolId = sanitizeText(input.targetSchoolId, 80);

  if (parentName.length < 3) {
    return { valid: false, errorFa: 'لطفاً نام و نام خانوادگی ولی را به‌صورت کامل وارد کنید.' };
  }
  if (studentName.length < 2) {
    return { valid: false, errorFa: 'لطفاً نام دانش‌آموز را وارد کنید.' };
  }
  const mobileRes = validateIranianMobile(input.mobile);
  if (!mobileRes.valid) {
    return { valid: false, errorFa: mobileRes.errorFa };
  }
  if (!targetSchoolId) {
    return { valid: false, errorFa: 'لطفاً مدرسه مقصد یا مشاوره عمومی مجموعه را انتخاب کنید.' };
  }
  if (!gradeLabel) {
    return { valid: false, errorFa: 'لطفاً پایه تحصیلی مورد نظر را انتخاب کنید.' };
  }

  return {
    valid: true,
    sanitized: {
      parentName,
      studentName,
      mobile: mobileRes.normalized,
      targetSchoolId,
      gradeLabel,
      message,
    },
  };
}

export function resolveComplexPortalConfig(configs: PublicPortalConfig[]): PublicPortalConfig | null {
  return (
    configs.find((c) => c.scope === 'complex' || c.schoolId === GLOBAL_TENANT_ID) ?? null
  );
}

export function getSchoolPublicProfile(
  school: School,
  configs: PublicPortalConfig[]
): {
  introText: string;
  gradesSummary: string;
  address: string;
  phone: string;
  workingHours: string;
  config?: PublicPortalConfig;
} {
  const cfg = configs.find((c) => c.scope === 'school' && c.schoolId === school.id);
  const defaultGrades =
    school.gradeLevel === 'elementary'
      ? 'دوره ابتدایی (پایه‌های اول تا ششم)'
      : school.gradeLevel === 'middle'
        ? 'متوسطه دوره اول (پایه‌های هفتم تا نهم)'
        : school.gradeLevel === 'high'
          ? 'متوسطه دوره دوم (پایه‌های دهم تا دوازدهم)'
          : school.subtitle;

  return {
    introText:
      cfg?.introText?.trim() ||
      `${school.name} با بهره‌گیری از معلمان مجرب، برنامه‌ریزی هوشمند و پیگیری مستمر آموزشی در خدمت دانش‌آموزان و خانواده‌هاست.`,
    gradesSummary: cfg?.gradesSummary?.trim() || defaultGrades,
    address: cfg?.address?.trim() || school.address || 'نشانی در حال تکمیل',
    phone: cfg?.phone?.trim() || school.phone || '—',
    workingHours: cfg?.workingHours?.trim() || 'شنبه تا چهارشنبه · ۷:۳۰ تا ۱۴:۳۰',
    config: cfg,
  };
}

export function filterPublicNews(
  newsList: PublicPortalNews[],
  selectedSchoolId: string | 'all'
): PublicPortalNews[] {
  return newsList
    .filter((item) => {
      if (!item.published) return false;
      if (selectedSchoolId === 'all') return true;
      return item.schoolId === selectedSchoolId || item.scope === 'complex';
    })
    .sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
      return b.publishedAtJalali.localeCompare(a.publishedAtJalali) || b.createdAtIso.localeCompare(a.createdAtIso);
    });
}

export function filterPublicHonors(
  honorsList: PublicPortalHonor[],
  selectedSchoolId: string | 'all'
): PublicPortalHonor[] {
  return honorsList
    .filter((item) => {
      if (!item.published) return false;
      if (selectedSchoolId === 'all') return true;
      return item.schoolId === selectedSchoolId || item.scope === 'complex';
    })
    .sort((a, b) => b.awardDateJalali.localeCompare(a.awardDateJalali) || b.createdAtIso.localeCompare(a.createdAtIso));
}
