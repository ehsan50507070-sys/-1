// Phase 9-D: Public SEO Homepage (Route '/' — Accessible Without Login)
// Minimalist academic Persian design, native SEO + Schema.org EducationalOrganization JSON-LD,
// Dynamic multi-school showcase, News & Honors filterable by school, and Lead-only Pre-Registration Form.
import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  LogIn,
  Mail,
  MapPin,
  Menu,
  Moon,
  Newspaper,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCheck,
  X,
} from 'lucide-react';
import {
  OFFICIAL_COMPLEX_NAME_FA,
  OFFICIAL_SYSTEM_NAME_FA,
  SystemBrandLogo,
} from '../branding/BrandLogo';
import { useSchoolData } from '../data/DataContext';
import { useRouter } from '../router/RouterContext';
import { toPersianDigits } from '../../lib/digits';
import {
  ALL_PUBLIC_GRADE_OPTIONS,
  COMPLEX_GENERAL_PREREG_ID,
  filterPublicHonors,
  filterPublicNews,
  getSchoolPublicProfile,
  GRADE_LEVEL_OPTIONS_BY_SCHOOL_LEVEL,
  HONOR_CATEGORY_LABELS_FA,
  resolveComplexPortalConfig,
  validateIranianMobile,
} from '../../services/phase9d/publicPortalService';
import {
  applyPublicPortalSeo,
  removePublicPortalJsonLd,
} from '../../services/phase9d/seoHelper';
import type { PublicPortalNews } from '../../types/domain';
import heroCampusImg from '../../assets/images/hero_golestan_campus_1795519994539.jpg';

const HERO_CAMPUS_IMAGE_SRC = heroCampusImg;

const NAV_SECTIONS = [
  { id: 'schools', label: 'مدارس مجموعه' },
  { id: 'news', label: 'اخبار و اطلاعیه‌ها' },
  { id: 'honors', label: 'افتخارات' },
  { id: 'prereg', label: 'پیش‌ثبت‌نام' },
] as const;

export const PublicHomepage: React.FC = () => {
  const {
    session,
    darkMode,
    toggleDarkMode,
    allSchools,
    schoolBrandingConfigs,
    globalSystemConfig,
    publicPortalConfigs,
    publicPortalNews,
    publicPortalHonors,
    submitPublicPreRegRequest,
  } = useSchoolData();
  const { navigate } = useRouter();

  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string | 'all'>('all');
  const [activeNewsModal, setActiveNewsModal] = useState<PublicPortalNews | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [heroImageError, setHeroImageError] = useState(false);

  // Pre-registration form state (lead capture ONLY — never creates a user account)
  const [parentName, setParentName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [mobile, setMobile] = useState('');
  const [targetSchoolId, setTargetSchoolId] = useState<string>(
    () => allSchools[0]?.id ?? COMPLEX_GENERAL_PREREG_ID
  );
  const [gradeLabel, setGradeLabel] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedReceipt, setSubmittedReceipt] = useState<{
    trackingCode: string;
    targetSchoolName: string;
    studentName: string;
  } | null>(null);

  const complexConfig = useMemo(
    () => resolveComplexPortalConfig(publicPortalConfigs),
    [publicPortalConfigs]
  );

  const schoolConfigs = useMemo(
    () => publicPortalConfigs.filter((c) => c.scope === 'school'),
    [publicPortalConfigs]
  );

  const brandingBySchoolId = useMemo(
    () => new Map(schoolBrandingConfigs.map((b) => [b.schoolId, b])),
    [schoolBrandingConfigs]
  );

  const schoolNameById = useMemo(
    () => new Map(allSchools.map((s) => [s.id, s.name])),
    [allSchools]
  );

  const heroTitle = complexConfig?.heroTitle?.trim() || OFFICIAL_SYSTEM_NAME_FA;
  const heroSubtitle =
    complexConfig?.heroSubtitle?.trim() ||
    'بستر یکپارچه آموزش، ارزیابی هوشمند، پیگیری تحصیلی و ارتباط شفاف میان خانه و مدرسه در تمامی مقاطع تحصیلی.';
  const seoDescription =
    complexConfig?.seoDescription?.trim() ||
    `${OFFICIAL_SYSTEM_NAME_FA} — معرفی مدارس مجموعه، تازه‌ترین اخبار و افتخارات علمی و ثبت درخواست مشاوره و پیش‌ثبت‌نام.`;

  // Native SEO: document.title, meta description, OpenGraph & Schema.org EducationalOrganization JSON-LD
  useEffect(() => {
    const selectedSchool =
      selectedSchoolFilter !== 'all'
        ? allSchools.find((s) => s.id === selectedSchoolFilter)
        : null;
    const pageTitle = selectedSchool
      ? `${selectedSchool.name} | ${OFFICIAL_SYSTEM_NAME_FA}`
      : `${OFFICIAL_SYSTEM_NAME_FA} | ${OFFICIAL_COMPLEX_NAME_FA}`;

    applyPublicPortalSeo({
      title: pageTitle,
      description: seoDescription,
      siteName: OFFICIAL_SYSTEM_NAME_FA,
      complexName: OFFICIAL_COMPLEX_NAME_FA,
      complexConfig,
      schools: allSchools,
      schoolConfigs,
    });

    return () => {
      removePublicPortalJsonLd();
    };
  }, [allSchools, complexConfig, schoolConfigs, selectedSchoolFilter, seoDescription]);

  // Keep targetSchoolId valid if school list changes
  useEffect(() => {
    if (
      targetSchoolId !== COMPLEX_GENERAL_PREREG_ID &&
      allSchools.length > 0 &&
      !allSchools.some((s) => s.id === targetSchoolId)
    ) {
      setTargetSchoolId(allSchools[0].id);
    }
  }, [allSchools, targetSchoolId]);

  const gradeOptions = useMemo(() => {
    if (targetSchoolId === COMPLEX_GENERAL_PREREG_ID) return ALL_PUBLIC_GRADE_OPTIONS;
    const school = allSchools.find((s) => s.id === targetSchoolId);
    if (school?.gradeLevel && GRADE_LEVEL_OPTIONS_BY_SCHOOL_LEVEL[school.gradeLevel]) {
      return GRADE_LEVEL_OPTIONS_BY_SCHOOL_LEVEL[school.gradeLevel];
    }
    return ALL_PUBLIC_GRADE_OPTIONS;
  }, [allSchools, targetSchoolId]);

  useEffect(() => {
    if (gradeOptions.length > 0 && !gradeOptions.includes(gradeLabel)) {
      setGradeLabel(gradeOptions[0]);
    }
  }, [gradeOptions, gradeLabel]);

  const filteredNews = useMemo(
    () => filterPublicNews(publicPortalNews, selectedSchoolFilter),
    [publicPortalNews, selectedSchoolFilter]
  );

  const filteredHonors = useMemo(
    () => filterPublicHonors(publicPortalHonors, selectedSchoolFilter),
    [publicPortalHonors, selectedSchoolFilter]
  );

  const selectedSchoolObj = useMemo(
    () =>
      selectedSchoolFilter === 'all'
        ? null
        : allSchools.find((s) => s.id === selectedSchoolFilter) ?? null,
    [allSchools, selectedSchoolFilter]
  );

  const scrollToSection = (sectionId: string) => {
    setMobileNavOpen(false);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectSchoolCard = (schoolId: string) => {
    setSelectedSchoolFilter((prev) => (prev === schoolId ? 'all' : schoolId));
    setTargetSchoolId(schoolId);
  };

  const handlePreRegSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const mobileCheck = validateIranianMobile(mobile);
    if (!mobileCheck.valid) {
      setFormError(mobileCheck.errorFa ?? 'شماره همراه معتبر نیست.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitPublicPreRegRequest({
        parentName,
        studentName,
        mobile: mobileCheck.normalized,
        targetSchoolId,
        gradeLabel,
        message,
      });
      if (!res.ok || !res.trackingCode) {
        setFormError(res.errorFa ?? 'ثبت درخواست با خطا مواجه شد. لطفاً مجدداً تلاش کنید.');
        return;
      }
      setSubmittedReceipt({
        trackingCode: res.trackingCode,
        targetSchoolName:
          res.request?.targetSchoolName ??
          (targetSchoolId === COMPLEX_GENERAL_PREREG_ID
            ? 'مشاوره عمومی مجموعه مدارس گلستان راه روشن'
            : schoolNameById.get(targetSchoolId) ?? OFFICIAL_COMPLEX_NAME_FA),
        studentName: studentName.trim(),
      });
      setParentName('');
      setStudentName('');
      setMobile('');
      setMessage('');
    } finally {
      setSubmitting(false);
    }
  };

  const highlights =
    complexConfig?.highlights && complexConfig.highlights.length > 0
      ? complexConfig.highlights
      : [
          'پایش هوشمند حضور و غیاب و کارنامه تحصیلی آنلاین',
          'ارتباط امن و مستقیم اولیا با کادر آموزشی و مشاوره',
          'آرشیو درس‌محور ویدیوها، تکالیف و آزمون‌های استاندارد',
        ];

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col"
    >
      {/* Semantic Top Bar: Strict 3-Zone Single-Line Architecture */}
      <header className="sticky top-0 z-40 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Identity */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 min-w-0 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b5b84] rounded-xl"
          >
            <SystemBrandLogo
              logoDataUrl={globalSystemConfig.systemLogoDataUrl}
              size="sm"
              alt={OFFICIAL_SYSTEM_NAME_FA}
            />
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 truncate">
                {OFFICIAL_COMPLEX_NAME_FA}
              </div>
              <div className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 truncate">
                سامانه هوشمند مدیریت و آموزش
              </div>
            </div>
          </a>

          {/* Zone 2: Clean Inline Navigation Links */}
          <nav
            aria-label="بخش‌های صفحه اصلی"
            className="hidden md:flex items-center gap-6"
          >
            {NAV_SECTIONS.map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => scrollToSection(sec.id)}
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-[#1e3a5f] dark:hover:text-sky-300 transition-colors whitespace-nowrap"
              >
                {sec.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Theme Switch + Prominent Auth Action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleDarkMode}
              title={darkMode ? 'تغییر به حالت روشن' : 'تغییر به حالت شب'}
              aria-label={darkMode ? 'تغییر به حالت روشن' : 'تغییر به حالت شب'}
              className="h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => navigate(session ? '/dashboard' : '/login')}
              className="min-h-[40px] inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] hover:bg-[#162d4a] dark:bg-sky-600 dark:hover:bg-sky-500 text-white text-xs sm:text-sm font-bold px-3.5 sm:px-4 py-2 transition-colors whitespace-nowrap shadow-xs"
            >
              {session ? (
                <>
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span>بازگشت به پنل کاربری</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 shrink-0" />
                  <span>ورود به سامانه</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              aria-label="منوی بخش‌ها"
              className="md:hidden h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center"
            >
              {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileNavOpen && (
          <nav
            aria-label="منوی موبایل"
            className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 flex flex-col gap-1.5 shadow-md"
          >
            {NAV_SECTIONS.map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => scrollToSection(sec.id)}
                className="w-full text-right rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {sec.label}
              </button>
            ))}
          </nav>
        )}
      </header>

      <main id="top" className="flex-1">
        {/* SECTION 1: Editorial Academic Hero */}
        <section className="relative overflow-hidden bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Text & Primary Actions */}
              <div className="lg:col-span-6 space-y-6 text-right">
                <div className="text-xs sm:text-sm font-bold text-[#2b5b84] dark:text-sky-400 tracking-tight">
                  {OFFICIAL_COMPLEX_NAME_FA}
                  {complexConfig?.foundedYearJalali
                    ? ` · فعالیت آموزشی از سال ${toPersianDigits(complexConfig.foundedYearJalali)}`
                    : ''}
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-slate-50 leading-[1.35] tracking-tight">
                  {heroTitle}
                </h1>

                <p className="text-sm sm:text-base leading-8 text-slate-600 dark:text-slate-300 max-w-2xl">
                  {heroSubtitle}
                </p>

                {/* Primary CTAs */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => navigate(session ? '/dashboard' : '/login')}
                    className="min-h-[46px] inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] hover:bg-[#162d4a] dark:bg-sky-600 dark:hover:bg-sky-500 text-white text-sm font-bold px-5 py-2.5 transition-colors shadow-xs"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{session ? 'ورود به میز کار سامانه' : 'ورود به سامانه هوشمند'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollToSection('prereg')}
                    className="min-h-[46px] inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm font-semibold px-5 py-2.5 transition-colors"
                  >
                    <span>درخواست مشاوره و پیش‌ثبت‌نام</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>

                {/* Transparent Summary Stats */}
                <div className="grid grid-cols-3 gap-4 pt-5 border-t border-slate-200/80 dark:border-slate-800">
                  <div>
                    <div className="text-xl sm:text-2xl font-extrabold text-[#1e3a5f] dark:text-sky-400 tabular-nums">
                      {toPersianDigits(allSchools.length)}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      مدرسه فعال مجموعه
                    </div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-extrabold text-[#1e3a5f] dark:text-sky-400 tabular-nums">
                      {toPersianDigits(12)}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      پایه تحصیلی (اول تا دوازدهم)
                    </div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-extrabold text-[#1e3a5f] dark:text-sky-400 tabular-nums">
                      {toPersianDigits(highlights.length)}+
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      سامانه هوشمند یکپارچه
                    </div>
                  </div>
                </div>
              </div>

              {/* Architectural Campus Visual */}
              <div className="lg:col-span-6">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 aspect-[16/10] shadow-xs">
                  {!heroImageError ? (
                    <img
                      src={HERO_CAMPUS_IMAGE_SRC}
                      alt={`نمای محوطه و فضای آموزشی ${OFFICIAL_COMPLEX_NAME_FA}`}
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImageError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1e3a5f] via-[#2b5b84] to-slate-800 flex flex-col items-center justify-center p-8 text-center text-white">
                      <Building2 className="w-14 h-14 text-amber-300/90 mb-4" />
                      <div className="text-lg font-extrabold">{OFFICIAL_COMPLEX_NAME_FA}</div>
                      <p className="text-xs sm:text-sm text-sky-100/90 mt-2 max-w-md leading-6">
                        محیطی آرام، استاندارد و مجهز به فناوری‌های نوین آموزشی برای رشد علمی و تربیتی دانش‌آموزان
                      </p>
                    </div>
                  )}
                </div>

                {/* Smart Capabilities Strip */}
                <ul className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {highlights.slice(0, 3).map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-800 px-3 py-2.5 text-xs leading-5 text-slate-700 dark:text-slate-200"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#2b5b84] dark:text-sky-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Dynamic Multi-School Showcase */}
        <section
          id="schools"
          className="scroll-mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-[#2b5b84] dark:text-sky-400">
                واحدهای آموزشی مجموعه
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                مدارس {OFFICIAL_COMPLEX_NAME_FA}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                با انتخاب هر مدرسه، اخبار، افتخارات و فرم پیش‌ثبت‌نام به‌صورت اختصاصی برای همان واحد فیلتر می‌شود.
              </p>
            </div>

            {selectedSchoolFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedSchoolFilter('all')}
                className="self-start sm:self-auto min-h-[40px] inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold px-3.5 py-2 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>نمایش همه مدارس مجموعه</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allSchools.map((school) => {
              const profile = getSchoolPublicProfile(school, publicPortalConfigs);
              const branding = brandingBySchoolId.get(school.id);
              const isSelected = selectedSchoolFilter === school.id;

              return (
                <article
                  key={school.id}
                  onClick={() => handleSelectSchoolCard(school.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectSchoolCard(school.id);
                    }
                  }}
                  aria-pressed={isSelected}
                  className={`group cursor-pointer rounded-2xl border p-6 transition-all flex flex-col justify-between bg-white dark:bg-slate-900 ${
                    isSelected
                      ? 'border-[#1e3a5f] dark:border-sky-500 ring-2 ring-[#1e3a5f]/15 dark:ring-sky-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start gap-3.5">
                      <SystemBrandLogo
                        logoDataUrl={branding?.logoDataUrl || globalSystemConfig.systemLogoDataUrl}
                        size="md"
                        alt={school.name}
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 leading-6">
                          {school.name}
                        </h3>
                        <div className="text-xs font-medium text-[#2b5b84] dark:text-sky-400 mt-1">
                          {profile.gradesSummary}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {profile.introText}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="leading-5">{profile.address}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 tabular-nums">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span dir="ltr">{toPersianDigits(profile.phone)}</span>
                      </div>
                      <span className="font-bold text-[#1e3a5f] dark:text-sky-400 group-hover:underline">
                        {isSelected ? 'انتخاب‌شده · همه مدارس' : 'مشاهده اخبار و افتخارات'}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* SECTION 3: Public News & Announcements */}
        <section
          id="news"
          className="scroll-mt-20 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800 py-14 sm:py-16"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-[#2b5b84] dark:text-sky-400 flex items-center gap-1.5">
                  <Newspaper className="w-3.5 h-3.5" />
                  <span>تازه‌ترین رویدادها</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                  اخبار و اطلاعیه‌های عمومی
                  {selectedSchoolObj ? ` — ${selectedSchoolObj.name}` : ''}
                </h2>
              </div>

              {/* School Filter Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSchoolFilter('all')}
                  className={`min-h-[36px] rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    selectedSchoolFilter === 'all'
                      ? 'bg-[#1e3a5f] text-white dark:bg-sky-600'
                      : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  همه مدارس
                </button>
                {allSchools.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSchoolFilter(s.id)}
                    className={`min-h-[36px] rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                      selectedSchoolFilter === s.id
                        ? 'bg-[#1e3a5f] text-white dark:bg-sky-600'
                        : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {filteredNews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center text-sm text-slate-500 dark:text-slate-400">
                هنوز خبر یا اطلاعیه‌ای برای این مدرسه منتشر نشده است.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredNews.map((item) => {
                  const scopeLabel =
                    item.scope === 'complex'
                      ? OFFICIAL_COMPLEX_NAME_FA
                      : schoolNameById.get(item.schoolId) ?? OFFICIAL_COMPLEX_NAME_FA;
                  return (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-950/60 p-6 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          <span className="font-semibold text-[#2b5b84] dark:text-sky-400">
                            {scopeLabel}
                          </span>
                          <span>·</span>
                          <span>{item.categoryLabel}</span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {toPersianDigits(item.publishedAtJalali)}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 leading-7">
                          {item.title}
                        </h3>

                        <p className="text-xs sm:text-sm leading-7 text-slate-600 dark:text-slate-300">
                          {item.summary}
                        </p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {item.authorName}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveNewsModal(item)}
                          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1e3a5f] dark:text-sky-400 hover:underline"
                        >
                          <span>مطالعه متن کامل</span>
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* SECTION 4: Honors & Achievements */}
        <section
          id="honors"
          className="scroll-mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16"
        >
          <div className="space-y-1.5 mb-8">
            <div className="text-xs font-bold text-[#2b5b84] dark:text-sky-400 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>دستاوردهای علمی، پرورشی و پژوهشی</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              افتخارات دانش‌آموزان و مدارس
              {selectedSchoolObj ? ` — ${selectedSchoolObj.name}` : ''}
            </h2>
          </div>

          {filteredHonors.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              هنوز افتخاری برای این بخش ثبت نشده است.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredHonors.map((honor) => {
                const scopeLabel =
                  honor.scope === 'complex'
                    ? OFFICIAL_COMPLEX_NAME_FA
                    : schoolNameById.get(honor.schoolId) ?? OFFICIAL_COMPLEX_NAME_FA;
                return (
                  <article
                    key={honor.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          {toPersianDigits(honor.awardDateJalali)}
                        </span>
                      </div>

                      <div className="text-[11px] font-semibold text-[#2b5b84] dark:text-sky-400">
                        {HONOR_CATEGORY_LABELS_FA[honor.category]} · {scopeLabel}
                      </div>

                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 leading-6">
                        {honor.title}
                      </h3>

                      <p className="text-xs leading-6 text-slate-600 dark:text-slate-300">
                        {honor.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                        {honor.recipientLabel}
                      </span>
                      {honor.rankLabel && (
                        <span className="font-bold text-amber-700 dark:text-amber-400 shrink-0">
                          {honor.rankLabel}
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* SECTION 5: Consultation & Pre-Registration Form (Lead Capture ONLY) */}
        <section
          id="prereg"
          className="scroll-mt-20 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 py-14 sm:py-16"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Guidance & Contact Info */}
              <div className="lg:col-span-5 space-y-5">
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#2b5b84] dark:text-sky-400 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" />
                    <span>پذیرش و راهنمایی خانواده‌ها</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                    درخواست مشاوره و پیش‌ثبت‌نام
                  </h2>
                  <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                    با ثبت اطلاعات اولیه در این فرم، کد پیگیری اختصاصی دریافت می‌کنید و کارشناسان پذیرش مدرسه انتخابی در کوتاه‌ترین زمان با شما تماس خواهند گرفت.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-950/60 p-5 space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    اطلاعات دبیرخانه مرکزی مجموعه
                  </div>
                  {complexConfig?.address && (
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-[#2b5b84] dark:text-sky-400 shrink-0 mt-0.5" />
                      <span className="leading-6">{complexConfig.address}</span>
                    </div>
                  )}
                  {complexConfig?.phone && (
                    <div className="flex items-center gap-2.5 tabular-nums">
                      <Phone className="w-4 h-4 text-[#2b5b84] dark:text-sky-400 shrink-0" />
                      <span dir="ltr">{toPersianDigits(complexConfig.phone)}</span>
                    </div>
                  )}
                  {complexConfig?.workingHours && (
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-[#2b5b84] dark:text-sky-400 shrink-0" />
                      <span>{toPersianDigits(complexConfig.workingHours)}</span>
                    </div>
                  )}
                  {complexConfig?.contactEmail && (
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-[#2b5b84] dark:text-sky-400 shrink-0" />
                      <span dir="ltr" className="text-xs font-mono">
                        {complexConfig.contactEmail}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">
                  توجه: تکمیل این فرم صرفاً جهت ثبت درخواست مشاوره و پیش‌ثبت‌نام است و حساب کاربری سامانه تنها پس از ثبت‌نام قطعی توسط مدیر مدرسه صادر می‌گردد.
                </p>
              </div>

              {/* Pre-Registration Form Card */}
              <div className="lg:col-span-7">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-950/60 p-6 sm:p-8">
                  {submittedReceipt ? (
                    <div className="space-y-5 text-right">
                      <div className="flex items-start gap-3 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-7 h-7 shrink-0 mt-0.5" />
                        <div>
                          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
                            درخواست مشاوره و پیش‌ثبت‌نام با موفقیت ثبت شد
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-6">
                            درخواست برای دانش‌آموز <strong>{submittedReceipt.studentName}</strong> در{' '}
                            <strong>{submittedReceipt.targetSchoolName}</strong> در صف پیگیری مدیریت قرار گرفت.
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                          کد پیگیری اختصاصی شما:
                        </span>
                        <span className="text-lg font-extrabold text-[#1e3a5f] dark:text-sky-400 tabular-nums">
                          {submittedReceipt.trackingCode}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSubmittedReceipt(null)}
                        className="min-h-[42px] inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold px-4 py-2 text-slate-700 dark:text-slate-200 transition-colors"
                      >
                        ثبت درخواست جدید دیگر
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handlePreRegSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label
                            htmlFor="prereg-parent"
                            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                          >
                            نام و نام خانوادگی ولی *
                          </label>
                          <input
                            id="prereg-parent"
                            type="text"
                            required
                            value={parentName}
                            onChange={(e) => setParentName(e.target.value)}
                            placeholder="مثلاً: محمدرضا رضایی"
                            className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2b5b84]"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label
                            htmlFor="prereg-student"
                            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                          >
                            نام و نام خانوادگی دانش‌آموز *
                          </label>
                          <input
                            id="prereg-student"
                            type="text"
                            required
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            placeholder="مثلاً: امیرعلی رضایی"
                            className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2b5b84]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label
                            htmlFor="prereg-mobile"
                            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                          >
                            شماره همراه معتبر ایران *
                          </label>
                          <input
                            id="prereg-mobile"
                            type="tel"
                            dir="ltr"
                            required
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            placeholder="09123456789"
                            className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-sm text-left tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2b5b84]"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label
                            htmlFor="prereg-school"
                            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                          >
                            مدرسه مقصد *
                          </label>
                          <select
                            id="prereg-school"
                            value={targetSchoolId}
                            onChange={(e) => setTargetSchoolId(e.target.value)}
                            className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2b5b84]"
                          >
                            {allSchools.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                            <option value={COMPLEX_GENERAL_PREREG_ID}>
                              مشاوره عمومی مجموعه مدارس گلستان راه روشن
                            </option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="prereg-grade"
                          className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                        >
                          پایه تحصیلی مورد نظر *
                        </label>
                        <select
                          id="prereg-grade"
                          value={gradeLabel}
                          onChange={(e) => setGradeLabel(e.target.value)}
                          className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2b5b84]"
                        >
                          {gradeOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="prereg-message"
                          className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                        >
                          پیام کوتاه یا ساعت مناسب برای تماس (اختیاری)
                        </label>
                        <textarea
                          id="prereg-message"
                          rows={3}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="سؤال یا توضیح خود را بنویسید..."
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2b5b84]"
                        />
                      </div>

                      {formError && (
                        <div
                          role="alert"
                          className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-xs sm:text-sm text-rose-700 dark:text-rose-300"
                        >
                          {formError}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full sm:w-auto min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] hover:bg-[#162d4a] dark:bg-sky-600 dark:hover:bg-sky-500 disabled:opacity-60 text-white text-sm font-bold px-6 py-2.5 transition-colors shadow-xs"
                      >
                        <Send className="w-4 h-4" />
                        <span>{submitting ? 'در حال ثبت درخواست...' : 'ثبت درخواست مشاوره و پیش‌ثبت‌نام'}</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Semantic Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <SystemBrandLogo
                  logoDataUrl={globalSystemConfig.systemLogoDataUrl}
                  size="sm"
                  alt={OFFICIAL_SYSTEM_NAME_FA}
                />
                <div>
                  <div className="text-sm font-extrabold text-white">{OFFICIAL_SYSTEM_NAME_FA}</div>
                  <div className="text-xs text-slate-400">{OFFICIAL_COMPLEX_NAME_FA}</div>
                </div>
              </div>
              <p className="text-xs leading-6 text-slate-400">
                {complexConfig?.introText || heroSubtitle}
              </p>
            </div>

            <div className="space-y-2.5">
              <h3 className="text-sm font-bold text-white">مدارس فعال مجموعه</h3>
              <ul className="space-y-1.5 text-xs text-slate-400">
                {allSchools.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSchoolFilter(s.id);
                        scrollToSection('schools');
                      }}
                      className="hover:text-white transition-colors"
                    >
                      {s.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">دسترسی سریع سامانه</h3>
              <div className="text-xs text-slate-400 space-y-1.5">
                {complexConfig?.address && <div>{complexConfig.address}</div>}
                {complexConfig?.phone && (
                  <div className="tabular-nums">تلفن دبیرخانه: {toPersianDigits(complexConfig.phone)}</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => navigate(session ? '/dashboard' : '/login')}
                className="min-h-[40px] inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold px-4 py-2 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>{session ? 'بازگشت به پنل کاربری' : 'ورود اعضا و اولیا به سامانه'}</span>
              </button>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div>© {toPersianDigits('1404')} {OFFICIAL_SYSTEM_NAME_FA} — تمامی حقوق محفوظ است.</div>
            <div className="inline-flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>پورتال رسمی اطلاع‌رسانی و مدیریت هوشمند</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Full News Reader Modal */}
      {activeNewsModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="news-modal-title"
          onClick={() => setActiveNewsModal(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  <span className="font-semibold text-[#2b5b84] dark:text-sky-400">
                    {activeNewsModal.scope === 'complex'
                      ? OFFICIAL_COMPLEX_NAME_FA
                      : schoolNameById.get(activeNewsModal.schoolId) ?? OFFICIAL_COMPLEX_NAME_FA}
                  </span>
                  <span> · </span>
                  <span>{activeNewsModal.categoryLabel}</span>
                  <span> · </span>
                  <span>{toPersianDigits(activeNewsModal.publishedAtJalali)}</span>
                </div>
                <h2
                  id="news-modal-title"
                  className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 leading-8"
                >
                  {activeNewsModal.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveNewsModal(null)}
                aria-label="بستن"
                className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3 text-sm leading-8 text-slate-700 dark:text-slate-200">
              {activeNewsModal.body
                .split('\n')
                .filter((p) => p.trim().length > 0)
                .map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>تنظیم و انتشار: {activeNewsModal.authorName}</span>
              <button
                type="button"
                onClick={() => setActiveNewsModal(null)}
                className="rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold px-4 py-2"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicHomepage;
