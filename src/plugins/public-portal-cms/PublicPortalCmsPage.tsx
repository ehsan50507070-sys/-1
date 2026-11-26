// Phase 9-D: Public Portal Content Management System (/public-portal-cms)
// Role-scoped: super_admin (complex-wide + all schools) & principal (strictly own school)
import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  ExternalLink,
  Globe,
  Newspaper,
  Pencil,
  PhoneCall,
  Plus,
  Save,
  Settings2,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { OFFICIAL_COMPLEX_NAME_FA } from '../../core/branding/BrandLogo';
import { useSchoolData } from '../../core/data/DataContext';
import { useRouter } from '../../core/router/RouterContext';
import { generateUUID } from '../../core/security/sanitize';
import { GLOBAL_TENANT_ID } from '../../core/super-admin/superAdminHelpers';
import { useToast } from '../../core/ui/ToastContext';
import { toPersianDigits } from '../../lib/digits';
import { getTodayJalali } from '../../lib/jalali';
import {
  COMPLEX_GENERAL_PREREG_ID,
  getSchoolPublicProfile,
  HONOR_CATEGORY_LABELS_FA,
  PREREG_STATUS_META,
  resolveComplexPortalConfig,
} from '../../services/phase9d/publicPortalService';
import type {
  PreRegRequestStatus,
  PublicHonorCategory,
  PublicPortalConfig,
  PublicPortalHonor,
  PublicPortalNews,
  PublicPreRegRequest,
} from '../../types/domain';

type CmsTab = 'settings' | 'news' | 'honors' | 'prereg';

export const PublicPortalCmsPage: React.FC = () => {
  const {
    session,
    activeRole,
    activeSchool,
    allSchools,
    publicPortalConfigs,
    publicPortalNews,
    publicPortalHonors,
    publicPreRegRequests,
    upsertPublicPortalConfig,
    upsertPublicPortalNews,
    softDeletePublicPortalNews,
    upsertPublicPortalHonor,
    softDeletePublicPortalHonor,
    updatePublicPreRegRequest,
    softDeletePublicPreRegRequest,
  } = useSchoolData();
  const { navigate } = useRouter();
  const { showToast } = useToast();

  const isSuperAdmin = activeRole === 'super_admin';
  const [activeTab, setActiveTab] = useState<CmsTab>('settings');

  // Target scope selector: super_admin can switch between complex-wide ('complex') or any school; principal locked to own school
  const [selectedScopeTarget, setSelectedScopeTarget] = useState<string>(() =>
    isSuperAdmin ? GLOBAL_TENANT_ID : activeSchool.id
  );

  useEffect(() => {
    if (!isSuperAdmin) {
      setSelectedScopeTarget(activeSchool.id);
    }
  }, [isSuperAdmin, activeSchool.id]);

  const schoolNameById = useMemo(
    () => new Map(allSchools.map((s) => [s.id, s.name])),
    [allSchools]
  );

  // Settings Form State
  const currentConfig = useMemo<PublicPortalConfig | null>(() => {
    if (selectedScopeTarget === GLOBAL_TENANT_ID) {
      return resolveComplexPortalConfig(publicPortalConfigs);
    }
    return (
      publicPortalConfigs.find(
        (c) => c.scope === 'school' && c.schoolId === selectedScopeTarget
      ) ?? null
    );
  }, [publicPortalConfigs, selectedScopeTarget]);

  const selectedSchoolObj = useMemo(
    () => allSchools.find((s) => s.id === selectedScopeTarget) ?? null,
    [allSchools, selectedScopeTarget]
  );

  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [introText, setIntroText] = useState('');
  const [gradesSummary, setGradesSummary] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [foundedYearJalali, setFoundedYearJalali] = useState('');
  const [highlightsText, setHighlightsText] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (selectedScopeTarget === GLOBAL_TENANT_ID) {
      setHeroTitle(currentConfig?.heroTitle ?? 'سامانه هوشمند مدارس گلستان راه روشن');
      setHeroSubtitle(currentConfig?.heroSubtitle ?? '');
      setSeoDescription(currentConfig?.seoDescription ?? '');
      setIntroText(currentConfig?.introText ?? '');
      setGradesSummary('');
      setAddress(currentConfig?.address ?? '');
      setPhone(currentConfig?.phone ?? '');
      setWorkingHours(currentConfig?.workingHours ?? '');
      setContactEmail(currentConfig?.contactEmail ?? '');
      setFoundedYearJalali(currentConfig?.foundedYearJalali ?? '1388');
      setHighlightsText((currentConfig?.highlights ?? []).join('\n'));
    } else if (selectedSchoolObj) {
      const profile = getSchoolPublicProfile(selectedSchoolObj, publicPortalConfigs);
      setHeroTitle('');
      setHeroSubtitle('');
      setSeoDescription('');
      setIntroText(profile.introText);
      setGradesSummary(profile.gradesSummary);
      setAddress(profile.address);
      setPhone(profile.phone);
      setWorkingHours(profile.workingHours);
      setContactEmail('');
      setFoundedYearJalali('');
      setHighlightsText('');
    }
  }, [currentConfig, selectedScopeTarget, selectedSchoolObj, publicPortalConfigs]);

  // News CRUD State
  const [editingNews, setEditingNews] = useState<PublicPortalNews | null>(null);
  const [newsModalOpen, setNewsModalOpen] = useState(false);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsSummary, setNewsSummary] = useState('');
  const [newsBody, setNewsBody] = useState('');
  const [newsCategory, setNewsCategory] = useState('اخبار آموزشی');
  const [newsSchoolId, setNewsSchoolId] = useState<string>(() =>
    isSuperAdmin ? GLOBAL_TENANT_ID : activeSchool.id
  );
  const [newsPublished, setNewsPublished] = useState(true);
  const [newsPinned, setNewsPinned] = useState(false);

  // Honors CRUD State
  const [editingHonor, setEditingHonor] = useState<PublicPortalHonor | null>(null);
  const [honorModalOpen, setHonorModalOpen] = useState(false);
  const [honorTitle, setHonorTitle] = useState('');
  const [honorCategory, setHonorCategory] = useState<PublicHonorCategory>('academic');
  const [honorDesc, setHonorDesc] = useState('');
  const [honorRecipient, setHonorRecipient] = useState('');
  const [honorRank, setHonorRank] = useState('');
  const [honorDate, setHonorDate] = useState(() => getTodayJalali());
  const [honorSchoolId, setHonorSchoolId] = useState<string>(() =>
    isSuperAdmin ? GLOBAL_TENANT_ID : activeSchool.id
  );
  const [honorPublished, setHonorPublished] = useState(true);

  // Pre-registration Filter & Follow-up State
  const [preRegStatusFilter, setPreRegStatusFilter] = useState<PreRegRequestStatus | 'all'>('all');
  const [preRegSchoolFilter, setPreRegSchoolFilter] = useState<string>('all');
  const [editingPreReg, setEditingPreReg] = useState<PublicPreRegRequest | null>(null);
  const [preRegStatusEdit, setPreRegStatusEdit] = useState<PreRegRequestStatus>('contacted');
  const [preRegNoteEdit, setPreRegNoteEdit] = useState('');

  const scopedNews = useMemo(() => {
    const list = isSuperAdmin
      ? publicPortalNews
      : publicPortalNews.filter((n) => n.scope === 'school' && n.schoolId === activeSchool.id);
    return [...list].sort(
      (a, b) =>
        b.publishedAtJalali.localeCompare(a.publishedAtJalali) ||
        b.updatedAtIso.localeCompare(a.updatedAtIso)
    );
  }, [isSuperAdmin, publicPortalNews, activeSchool.id]);

  const scopedHonors = useMemo(() => {
    const list = isSuperAdmin
      ? publicPortalHonors
      : publicPortalHonors.filter((h) => h.scope === 'school' && h.schoolId === activeSchool.id);
    return [...list].sort(
      (a, b) =>
        b.awardDateJalali.localeCompare(a.awardDateJalali) ||
        b.updatedAtIso.localeCompare(a.updatedAtIso)
    );
  }, [isSuperAdmin, publicPortalHonors, activeSchool.id]);

  const scopedPreRegs = useMemo(() => {
    return publicPreRegRequests
      .filter((r) => {
        if (!isSuperAdmin && r.schoolId !== activeSchool.id && r.targetSchoolId !== activeSchool.id) {
          return false;
        }
        if (preRegStatusFilter !== 'all' && r.status !== preRegStatusFilter) return false;
        if (isSuperAdmin && preRegSchoolFilter !== 'all' && r.targetSchoolId !== preRegSchoolFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
  }, [
    publicPreRegRequests,
    isSuperAdmin,
    activeSchool.id,
    preRegStatusFilter,
    preRegSchoolFilter,
  ]);

  const newPreRegCount = useMemo(
    () => scopedPreRegs.filter((r) => r.status === 'new').length,
    [scopedPreRegs]
  );

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const nowIso = new Date().toISOString();
      const isComplex = selectedScopeTarget === GLOBAL_TENANT_ID;
      const cfg: PublicPortalConfig = {
        id: currentConfig?.id ?? (isComplex ? 'portal-cfg-complex' : `portal-cfg-${selectedScopeTarget}`),
        complexId: activeSchool.complexId ?? 'complex-1',
        schoolId: selectedScopeTarget,
        academicYearId: activeSchool.academicYear || '1404-1405',
        createdByUserId: currentConfig?.createdByUserId ?? session?.userId,
        createdAtIso: currentConfig?.createdAtIso ?? nowIso,
        updatedAtIso: nowIso,
        scope: isComplex ? 'complex' : 'school',
        heroTitle: isComplex ? heroTitle.trim() : undefined,
        heroSubtitle: isComplex ? heroSubtitle.trim() : undefined,
        seoDescription: isComplex ? seoDescription.trim() : undefined,
        introText: introText.trim(),
        gradesSummary: !isComplex ? gradesSummary.trim() : undefined,
        address: address.trim(),
        phone: phone.trim(),
        workingHours: workingHours.trim(),
        contactEmail: isComplex ? contactEmail.trim() : undefined,
        foundedYearJalali: isComplex ? foundedYearJalali.trim() : undefined,
        highlights: isComplex
          ? highlightsText
              .split('\n')
              .map((l) => l.trim())
              .filter(Boolean)
          : undefined,
      };
      const res = await upsertPublicPortalConfig(cfg);
      if (res.ok) {
        showToast('تنظیمات و معرفی صفحه عمومی با موفقیت ذخیره شد.', 'success');
      } else {
        showToast(res.errorFa ?? 'ذخیره تنظیمات با خطا مواجه شد.', 'error');
      }
    } finally {
      setSavingSettings(false);
    }
  };

  const openNewNewsModal = () => {
    setEditingNews(null);
    setNewsTitle('');
    setNewsSummary('');
    setNewsBody('');
    setNewsCategory('اخبار آموزشی');
    setNewsSchoolId(isSuperAdmin ? GLOBAL_TENANT_ID : activeSchool.id);
    setNewsPublished(true);
    setNewsPinned(false);
    setNewsModalOpen(true);
  };

  const openEditNewsModal = (item: PublicPortalNews) => {
    setEditingNews(item);
    setNewsTitle(item.title);
    setNewsSummary(item.summary);
    setNewsBody(item.body);
    setNewsCategory(item.categoryLabel);
    setNewsSchoolId(item.scope === 'complex' ? GLOBAL_TENANT_ID : item.schoolId);
    setNewsPublished(item.published);
    setNewsPinned(Boolean(item.pinned));
    setNewsModalOpen(true);
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsSummary.trim() || !newsBody.trim()) {
      showToast('تیتر، خلاصه و متن کامل خبر الزامی است.', 'warning');
      return;
    }
    const nowIso = new Date().toISOString();
    const targetId = isSuperAdmin ? newsSchoolId : activeSchool.id;
    const isComplex = targetId === GLOBAL_TENANT_ID;
    const item: PublicPortalNews = {
      id: editingNews?.id ?? generateUUID(),
      complexId: activeSchool.complexId ?? 'complex-1',
      schoolId: targetId,
      academicYearId: activeSchool.academicYear || '1404-1405',
      createdByUserId: editingNews?.createdByUserId ?? session?.userId,
      createdAtIso: editingNews?.createdAtIso ?? nowIso,
      updatedAtIso: nowIso,
      scope: isComplex ? 'complex' : 'school',
      title: newsTitle.trim(),
      summary: newsSummary.trim(),
      body: newsBody.trim(),
      categoryLabel: newsCategory.trim() || 'اخبار آموزشی',
      publishedAtJalali: editingNews?.publishedAtJalali ?? getTodayJalali(),
      authorName: editingNews?.authorName ?? session?.displayName ?? 'روابط عمومی',
      published: newsPublished,
      pinned: newsPinned,
    };
    const res = await upsertPublicPortalNews(item);
    if (res.ok) {
      showToast(editingNews ? 'خبر با موفقیت ویرایش شد.' : 'خبر جدید در صفحه عمومی ثبت شد.', 'success');
      setNewsModalOpen(false);
    } else {
      showToast(res.errorFa ?? 'خطا در ذخیره خبر.', 'error');
    }
  };

  const handleDeleteNews = async (item: PublicPortalNews) => {
    const res = await softDeletePublicPortalNews(item.id, item.schoolId);
    if (res.ok) {
      showToast('خبر به سطل بازیابی امن منتقل شد.', 'info');
    } else {
      showToast(res.errorFa ?? 'خطا در حذف خبر.', 'error');
    }
  };

  const openNewHonorModal = () => {
    setEditingHonor(null);
    setHonorTitle('');
    setHonorCategory('academic');
    setHonorDesc('');
    setHonorRecipient('');
    setHonorRank('');
    setHonorDate(getTodayJalali());
    setHonorSchoolId(isSuperAdmin ? GLOBAL_TENANT_ID : activeSchool.id);
    setHonorPublished(true);
    setHonorModalOpen(true);
  };

  const openEditHonorModal = (item: PublicPortalHonor) => {
    setEditingHonor(item);
    setHonorTitle(item.title);
    setHonorCategory(item.category);
    setHonorDesc(item.description);
    setHonorRecipient(item.recipientLabel);
    setHonorRank(item.rankLabel ?? '');
    setHonorDate(item.awardDateJalali);
    setHonorSchoolId(item.scope === 'complex' ? GLOBAL_TENANT_ID : item.schoolId);
    setHonorPublished(item.published);
    setHonorModalOpen(true);
  };

  const handleSaveHonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!honorTitle.trim() || !honorDesc.trim() || !honorRecipient.trim()) {
      showToast('عنوان، توضیح و نام برگزیده/گروه افتخار الزامی است.', 'warning');
      return;
    }
    const nowIso = new Date().toISOString();
    const targetId = isSuperAdmin ? honorSchoolId : activeSchool.id;
    const isComplex = targetId === GLOBAL_TENANT_ID;
    const item: PublicPortalHonor = {
      id: editingHonor?.id ?? generateUUID(),
      complexId: activeSchool.complexId ?? 'complex-1',
      schoolId: targetId,
      academicYearId: activeSchool.academicYear || '1404-1405',
      createdByUserId: editingHonor?.createdByUserId ?? session?.userId,
      createdAtIso: editingHonor?.createdAtIso ?? nowIso,
      updatedAtIso: nowIso,
      scope: isComplex ? 'complex' : 'school',
      title: honorTitle.trim(),
      category: honorCategory,
      description: honorDesc.trim(),
      awardDateJalali: honorDate.trim() || getTodayJalali(),
      recipientLabel: honorRecipient.trim(),
      rankLabel: honorRank.trim() || undefined,
      published: honorPublished,
    };
    const res = await upsertPublicPortalHonor(item);
    if (res.ok) {
      showToast(editingHonor ? 'افتخار ویرایش شد.' : 'افتخار جدید ثبت شد.', 'success');
      setHonorModalOpen(false);
    } else {
      showToast(res.errorFa ?? 'خطا در ذخیره افتخار.', 'error');
    }
  };

  const handleDeleteHonor = async (item: PublicPortalHonor) => {
    const res = await softDeletePublicPortalHonor(item.id, item.schoolId);
    if (res.ok) {
      showToast('افتخار به سطل بازیابی امن منتقل شد.', 'info');
    } else {
      showToast(res.errorFa ?? 'خطا در حذف افتخار.', 'error');
    }
  };

  const handleSavePreRegUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPreReg) return;
    const res = await updatePublicPreRegRequest(editingPreReg.id, editingPreReg.schoolId, {
      status: preRegStatusEdit,
      staffNote: preRegNoteEdit.trim(),
    });
    if (res.ok) {
      showToast('وضعیت درخواست پیش‌ثبت‌نام به‌روزرسانی شد.', 'success');
      setEditingPreReg(null);
    } else {
      showToast(res.errorFa ?? 'خطا در به‌روزرسانی درخواست.', 'error');
    }
  };

  const handleDeletePreReg = async (req: PublicPreRegRequest) => {
    const res = await softDeletePublicPreRegRequest(req.id, req.schoolId);
    if (res.ok) {
      showToast('درخواست به سطل بازیابی امن منتقل شد.', 'info');
    } else {
      showToast(res.errorFa ?? 'خطا در حذف درخواست.', 'error');
    }
  };

  const tabs: Array<{ id: CmsTab; label: string; icon: React.ReactNode; count?: number }> = [
    { id: 'settings', label: 'تنظیمات و معرفی', icon: <Settings2 className="w-4 h-4" /> },
    { id: 'news', label: 'اخبار و اطلاعیه‌ها', icon: <Newspaper className="w-4 h-4" />, count: scopedNews.length },
    { id: 'honors', label: 'افتخارات و دستاوردها', icon: <Award className="w-4 h-4" />, count: scopedHonors.length },
    { id: 'prereg', label: 'درخواست‌های پیش‌ثبت‌نام', icon: <UserPlus className="w-4 h-4" />, count: newPreRegCount },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#2b5b84] dark:text-sky-400">
            <Globe className="w-4 h-4" />
            <span>
              {isSuperAdmin ? 'مدیریت کل مجموعه و تمام مدارس' : `حوزه مدرسه: ${activeSchool.name}`}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            مدیریت صفحه اصلی عمومی و پیش‌ثبت‌نام
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            ویرایش محتوای صفحه معرفی (سئو)، انتشار اخبار و افتخارات و پیگیری درخواست‌های مشاوره اولیا.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="self-start sm:self-auto min-h-[42px] inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold px-4 py-2 text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap"
        >
          <ExternalLink className="w-4 h-4" />
          <span>مشاهده زنده صفحه عمومی (/)</span>
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`min-h-[42px] inline-flex items-center gap-2 rounded-t-xl px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-[#1e3a5f] dark:border-sky-400 text-[#1e3a5f] dark:text-sky-400 bg-slate-50/70 dark:bg-slate-900'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
              {typeof t.count === 'number' && t.count > 0 && (
                <span className="tabular-nums text-[11px] font-extrabold text-slate-500 dark:text-slate-400">
                  ({toPersianDigits(t.count)})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Settings & Intro */}
      {activeTab === 'settings' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-5">
          {isSuperAdmin && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  انتخاب واحد برای ویرایش مشخصات عمومی
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  به‌عنوان راهبر ارشد می‌توانید متن اصلی کل مجموعه (Hero و سئو) یا کارت معرفی هر مدرسه را ویرایش کنید.
                </div>
              </div>
              <select
                value={selectedScopeTarget}
                onChange={(e) => setSelectedScopeTarget(e.target.value)}
                className="min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-sm font-semibold text-slate-800 dark:text-slate-100"
              >
                <option value={GLOBAL_TENANT_ID}>تنظیمات کل مجموعه (Hero و سئو)</option>
                {allSchools.map((s) => (
                  <option key={s.id} value={s.id}>
                    معرفی مدرسه: {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4">
            {selectedScopeTarget === GLOBAL_TENANT_ID ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      تیتر اصلی صفحه عمومی (H1 Hero)
                    </label>
                    <input
                      type="text"
                      value={heroTitle}
                      onChange={(e) => setHeroTitle(e.target.value)}
                      className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      سال تأسیس مجموعه (شمسی)
                    </label>
                    <input
                      type="text"
                      value={foundedYearJalali}
                      onChange={(e) => setFoundedYearJalali(e.target.value)}
                      placeholder="1388"
                      className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-sm tabular-nums"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    زیرتیتر بخش معرفی (Hero Subtitle)
                  </label>
                  <textarea
                    rows={2}
                    value={heroSubtitle}
                    onChange={(e) => setHeroSubtitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    توضیحات متا سئو (Meta Description — گوگل و شبکه‌های اجتماعی)
                  </label>
                  <textarea
                    rows={2}
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    ویژگی‌های شاخص سامانه (هر سطر یک مورد — نمایش در زیر تصویر Hero)
                  </label>
                  <textarea
                    rows={3}
                    value={highlightsText}
                    onChange={(e) => setHighlightsText(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  عنوان مقطع و پایه‌های تحت پوشش
                </label>
                <input
                  type="text"
                  value={gradesSummary}
                  onChange={(e) => setGradesSummary(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-sm"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                متن معرفی کوتاه
              </label>
              <textarea
                rows={3}
                value={introText}
                onChange={(e) => setIntroText(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  نشانی
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  تلفن تماس
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-sm text-left tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  ساعات پاسخگویی
                </label>
                <input
                  type="text"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-sm"
                />
              </div>
              {selectedScopeTarget === GLOBAL_TENANT_ID && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    ایمیل رسمی دبیرخانه (اختیاری)
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="info@golestan-school.ir"
                    className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-sm text-left"
                  />
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="min-h-[44px] inline-flex items-center gap-2 rounded-xl brand-btn text-sm font-bold px-5 py-2.5 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{savingSettings ? 'در حال ذخیره...' : 'ذخیره تغییرات صفحه عمومی'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: News Management */}
      {activeTab === 'news' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-slate-600 dark:text-slate-400 tabular-nums">
              تعداد اخبار ثبت‌شده: <strong>{toPersianDigits(scopedNews.length)}</strong>
            </div>
            <button
              type="button"
              onClick={openNewNewsModal}
              className="min-h-[42px] inline-flex items-center gap-2 rounded-xl brand-btn text-xs sm:text-sm font-bold px-4 py-2"
            >
              <Plus className="w-4 h-4" />
              <span>انتشار خبر جدید</span>
            </button>
          </div>

          {scopedNews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-10 text-center text-sm text-slate-500">
              هنوز خبری ثبت نشده است.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scopedNews.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      <span>
                        {item.scope === 'complex'
                          ? OFFICIAL_COMPLEX_NAME_FA
                          : schoolNameById.get(item.schoolId) ?? 'مدرسه'}
                        {' · '}
                        {item.categoryLabel}
                      </span>
                      <span>
                        {toPersianDigits(item.publishedAtJalali)} ·{' '}
                        <strong
                          className={
                            item.published
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-amber-700 dark:text-amber-400'
                          }
                        >
                          {item.published ? 'منتشرشده' : 'پیش‌نویس مخفی'}
                        </strong>
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </h3>
                    <p className="text-xs leading-6 text-slate-600 dark:text-slate-300 line-clamp-3">
                      {item.summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEditNewsModal(item)}
                      className="min-h-[36px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>ویرایش</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteNews(item)}
                      className="min-h-[36px] inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف نرم</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Honors Management */}
      {activeTab === 'honors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-slate-600 dark:text-slate-400 tabular-nums">
              تعداد افتخارات ثبت‌شده: <strong>{toPersianDigits(scopedHonors.length)}</strong>
            </div>
            <button
              type="button"
              onClick={openNewHonorModal}
              className="min-h-[42px] inline-flex items-center gap-2 rounded-xl brand-btn text-xs sm:text-sm font-bold px-4 py-2"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت افتخار جدید</span>
            </button>
          </div>

          {scopedHonors.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-10 text-center text-sm text-slate-500">
              هنوز افتخاری ثبت نشده است.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scopedHonors.map((honor) => (
                <div
                  key={honor.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      <span>
                        {HONOR_CATEGORY_LABELS_FA[honor.category]} ·{' '}
                        {honor.scope === 'complex'
                          ? OFFICIAL_COMPLEX_NAME_FA
                          : schoolNameById.get(honor.schoolId) ?? 'مدرسه'}
                      </span>
                      <span>{toPersianDigits(honor.awardDateJalali)}</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
                      {honor.title}
                    </h3>
                    <p className="text-xs leading-6 text-slate-600 dark:text-slate-300">
                      {honor.description}
                    </p>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      برگزیده: <strong>{honor.recipientLabel}</strong>
                      {honor.rankLabel ? ` · ${honor.rankLabel}` : ''}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEditHonorModal(honor)}
                      className="min-h-[36px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>ویرایش</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteHonor(honor)}
                      className="min-h-[36px] inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف نرم</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Pre-Registration Requests Inbox */}
      {activeTab === 'prereg' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {(['all', 'new', 'contacted', 'archived'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setPreRegStatusFilter(st)}
                  className={`min-h-[36px] rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    preRegStatusFilter === st
                      ? 'bg-[#1e3a5f] text-white dark:bg-sky-600'
                      : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {st === 'all' ? 'همه وضعیت‌ها' : PREREG_STATUS_META[st].labelFa}
                </button>
              ))}
            </div>

            {isSuperAdmin && (
              <select
                value={preRegSchoolFilter}
                onChange={(e) => setPreRegSchoolFilter(e.target.value)}
                className="min-h-[38px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-semibold"
              >
                <option value="all">همه مدارس و مشاوره عمومی</option>
                {allSchools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
                <option value={COMPLEX_GENERAL_PREREG_ID}>مشاوره عمومی مجموعه</option>
              </select>
            )}
          </div>

          {scopedPreRegs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-10 text-center text-sm text-slate-500">
              درخواستی با این فیلتر یافت نشد.
            </div>
          ) : (
            <div className="space-y-3">
              {scopedPreRegs.map((req) => {
                const statusMeta = PREREG_STATUS_META[req.status];
                return (
                  <div
                    key={req.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                          ولی: {req.parentName}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                          دانش‌آموز: {req.studentName} ({req.gradeLabel})
                        </span>
                      </div>
                      <span
                        className={`self-start sm:self-auto rounded-lg border px-2.5 py-1 text-[11px] font-bold ${statusMeta.toneClass}`}
                      >
                        {statusMeta.labelFa}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                      <span>کد پیگیری: <strong>{req.trackingCode}</strong></span>
                      <span dir="ltr">موبایل: <strong>{toPersianDigits(req.mobile)}</strong></span>
                      <span>مدرسه مقصد: <strong>{req.targetSchoolName}</strong></span>
                      <span>
                        ثبت: {toPersianDigits(req.submittedAtJalali)} ساعت {toPersianDigits(req.submittedAtTimeHm)}
                      </span>
                    </div>

                    {req.message && (
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 leading-6">
                        پیام ولی: {req.message}
                      </p>
                    )}

                    {req.staffNote && (
                      <div className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl p-3 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          یادداشت پیگیری ({req.handledByName ?? 'مسئول پذیرش'}
                          {req.handledAtJalali ? ` · ${toPersianDigits(req.handledAtJalali)}` : ''}): {req.staffNote}
                        </span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPreReg(req);
                          setPreRegStatusEdit(req.status === 'new' ? 'contacted' : req.status);
                          setPreRegNoteEdit(req.staffNote ?? '');
                        }}
                        className="min-h-[36px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>ثبت نتیجه پیگیری / تغییر وضعیت</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePreReg(req)}
                        className="min-h-[36px] inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف نرم</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Add/Edit News */}
      {newsModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setNewsModalOpen(false)}
        >
          <form
            onSubmit={handleSaveNews}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                {editingNews ? 'ویرایش خبر عمومی' : 'انتشار خبر یا اطلاعیه جدید'}
              </h2>
              <button
                type="button"
                onClick={() => setNewsModalOpen(false)}
                className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isSuperAdmin && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold">حوزه انتشار خبر</label>
                <select
                  value={newsSchoolId}
                  onChange={(e) => setNewsSchoolId(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm"
                >
                  <option value={GLOBAL_TENANT_ID}>کل مجموعه ({OFFICIAL_COMPLEX_NAME_FA})</option>
                  {allSchools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold">تیتر خبر *</label>
                <input
                  type="text"
                  required
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold">دسته‌بندی</label>
                <input
                  type="text"
                  value={newsCategory}
                  onChange={(e) => setNewsCategory(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold">خلاصه خبر (نمایش در کارت) *</label>
              <textarea
                rows={2}
                required
                value={newsSummary}
                onChange={(e) => setNewsSummary(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold">متن کامل خبر *</label>
              <textarea
                rows={5}
                required
                value={newsBody}
                onChange={(e) => setNewsBody(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-5 text-xs font-semibold">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newsPublished}
                  onChange={(e) => setNewsPublished(e.target.checked)}
                />
                <span>نمایش در صفحه اصلی عمومی</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newsPinned}
                  onChange={(e) => setNewsPinned(e.target.checked)}
                />
                <span>سنجاق در بالای فهرست</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNewsModalOpen(false)}
                className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 px-4 text-xs font-semibold"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="min-h-[40px] rounded-xl brand-btn px-5 text-xs font-bold"
              >
                ذخیره و انتشار
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add/Edit Honor */}
      {honorModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setHonorModalOpen(false)}
        >
          <form
            onSubmit={handleSaveHonor}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                {editingHonor ? 'ویرایش افتخار' : 'ثبت افتخار و دستاورد جدید'}
              </h2>
              <button
                type="button"
                onClick={() => setHonorModalOpen(false)}
                className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isSuperAdmin && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold">حوزه افتخار</label>
                <select
                  value={honorSchoolId}
                  onChange={(e) => setHonorSchoolId(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm"
                >
                  <option value={GLOBAL_TENANT_ID}>کل مجموعه ({OFFICIAL_COMPLEX_NAME_FA})</option>
                  {allSchools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold">عنوان افتخار *</label>
                <input
                  type="text"
                  required
                  value={honorTitle}
                  onChange={(e) => setHonorTitle(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold">حوزه دستاورد</label>
                <select
                  value={honorCategory}
                  onChange={(e) => setHonorCategory(e.target.value as PublicHonorCategory)}
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm"
                >
                  {(Object.keys(HONOR_CATEGORY_LABELS_FA) as PublicHonorCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {HONOR_CATEGORY_LABELS_FA[cat]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold">نام دانش‌آموز یا تیم *</label>
                <input
                  type="text"
                  required
                  value={honorRecipient}
                  onChange={(e) => setHonorRecipient(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold">رتبه / مدال</label>
                <input
                  type="text"
                  value={honorRank}
                  onChange={(e) => setHonorRank(e.target.value)}
                  placeholder="مثلاً: رتبه اول استان"
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold">تاریخ شمسی</label>
                <input
                  type="text"
                  value={honorDate}
                  onChange={(e) => setHonorDate(e.target.value)}
                  placeholder="1404/08/15"
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm tabular-nums"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold">شرح کوتاه دستاورد *</label>
              <textarea
                rows={3}
                required
                value={honorDesc}
                onChange={(e) => setHonorDesc(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm"
              />
            </div>

            <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={honorPublished}
                onChange={(e) => setHonorPublished(e.target.checked)}
              />
              <span>انتشار در صفحه اصلی عمومی</span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setHonorModalOpen(false)}
                className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 px-4 text-xs font-semibold"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="min-h-[40px] rounded-xl brand-btn px-5 text-xs font-bold"
              >
                ذخیره افتخار
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Update Pre-Registration Status */}
      {editingPreReg && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setEditingPreReg(null)}
        >
          <form
            onSubmit={handleSavePreRegUpdate}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                پیگیری درخواست {editingPreReg.trackingCode}
              </h2>
              <button
                type="button"
                onClick={() => setEditingPreReg(null)}
                className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <div>ولی: <strong>{editingPreReg.parentName}</strong> — دانش‌آموز: <strong>{editingPreReg.studentName}</strong></div>
              <div dir="ltr" className="text-right tabular-nums">تلفن: {toPersianDigits(editingPreReg.mobile)}</div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold">وضعیت پیگیری</label>
              <select
                value={preRegStatusEdit}
                onChange={(e) => setPreRegStatusEdit(e.target.value as PreRegRequestStatus)}
                className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm"
              >
                <option value="new">جدید (در انتظار تماس)</option>
                <option value="contacted">تماس گرفته شد</option>
                <option value="archived">بایگانی‌شده</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold">یادداشت پیگیری کادر پذیرش</label>
              <textarea
                rows={3}
                value={preRegNoteEdit}
                onChange={(e) => setPreRegNoteEdit(e.target.value)}
                placeholder="نتیجه تماس، زمان مصاحبه حضوری یا توضیحات..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingPreReg(null)}
                className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 px-4 text-xs font-semibold"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="min-h-[40px] rounded-xl brand-btn px-5 text-xs font-bold"
              >
                ذخیره وضعیت
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PublicPortalCmsPage;
