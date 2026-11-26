// Phase 9-D: Internal Office Automation Plugin (/office-automation)
// 5 Cartables (Inbox, Outbox, Directives, Drafts, Archive), Auto Indicator Numbering,
// Referral/Hamesh Timeline, Read Receipts, Acknowledgment Stamp & Formal Iranian A4/A5 Print via PrintIconButton.
import React, { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  CheckCheck,
  CheckCircle2,
  Eye,
  FileEdit,
  FileText,
  Forward,
  Inbox,
  Lock,
  Mail,
  Megaphone,
  Paperclip,
  PenSquare,
  Reply,
  Search,
  Send,
  Trash2,
} from 'lucide-react';
import {
  DEFAULT_BRAND_LOGO_DATA_URL,
  OFFICIAL_COMPLEX_NAME_FA,
  OFFICIAL_SYSTEM_NAME_FA,
} from '../../core/branding/BrandLogo';
import { useSchoolData } from '../../core/data/DataContext';
import { PrintIconButton } from '../../core/print/PrintIconButton';
import { useRouter } from '../../core/router/RouterContext';
import { PaginationBar, usePagination } from '../../core/ui/PaginationBar';
import { useToast } from '../../core/ui/ToastContext';
import { toPersianDigits } from '../../lib/digits';
import {
  buildOfficialLetterPrintHtml,
  canUserReferLetter,
  computeUnreadInboxLetters,
  filterLettersByCartable,
  isLetterUnreadForUser,
  LETTER_CONFIDENTIALITY_META,
  LETTER_PRIORITY_META,
  LETTER_TYPE_LABELS_FA,
  type OfficeCartableTab,
} from '../../services/phase9d/officeAutomationService';
import type { OfficeLetter, OfficeLetterPriority } from '../../types/domain';
import { ComposeLetterModal, type ComposeLetterInitialState } from './ComposeLetterModal';

export const OfficeAutomationPage: React.FC = () => {
  const {
    session,
    activeSchool,
    allSchools,
    schoolBrandingConfigs,
    globalSystemConfig,
    publicPortalConfigs,
    officeLetters,
    officeRecipientDirectory,
    saveOrSendOfficeLetter,
    recordOfficeLetterReadReceipt,
    acknowledgeOfficeLetter,
    referOfficeLetter,
    toggleOfficeLetterArchive,
    softDeleteOfficeLetter,
  } = useSchoolData();
  const { searchParams } = useRouter();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<OfficeCartableTab>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<OfficeLetterPriority | 'all'>('all');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [selectedLetterId, setSelectedLetterId] = useState<string | null>(null);
  const [composeState, setComposeState] = useState<ComposeLetterInitialState | null>(null);
  const [showReceiptsList, setShowReceiptsList] = useState(false);
  const [includeReferralsInPrint, setIncludeReferralsInPrint] = useState(true);

  // Referral (هامش‌نویسی) inline panel state
  const [referralOpen, setReferralOpen] = useState(false);
  const [referralTargetUserId, setReferralTargetUserId] = useState('');
  const [referralNote, setReferralNote] = useState('');
  const [referring, setReferring] = useState(false);

  const deepLinkLetterId = searchParams.get('letterId');

  // Open deep-linked letter from NotificationCenter immediately
  useEffect(() => {
    if (!deepLinkLetterId || !session) return;
    const found = officeLetters.find((l) => l.id === deepLinkLetterId);
    if (!found) return;
    if (found.archivedByUserIds.includes(session.userId)) {
      setActiveTab('archive');
    } else if (found.status === 'draft' && found.senderUserId === session.userId) {
      setActiveTab('drafts');
    } else if (found.letterType === 'directive' && found.senderUserId !== session.userId) {
      setActiveTab('inbox');
    } else if (found.senderUserId === session.userId) {
      setActiveTab('outbox');
    } else {
      setActiveTab('inbox');
    }
    setSelectedLetterId(found.id);
  }, [deepLinkLetterId, officeLetters, session]);

  const tabCounts = useMemo(() => {
    if (!session) {
      return { inbox: 0, inboxUnread: 0, outbox: 0, directives: 0, drafts: 0, archive: 0 };
    }
    const inboxAll = filterLettersByCartable({ letters: officeLetters, session, tab: 'inbox' });
    const unread = computeUnreadInboxLetters(officeLetters, session).length;
    return {
      inbox: inboxAll.length,
      inboxUnread: unread,
      outbox: filterLettersByCartable({ letters: officeLetters, session, tab: 'outbox' }).length,
      directives: filterLettersByCartable({ letters: officeLetters, session, tab: 'directives' }).length,
      drafts: filterLettersByCartable({ letters: officeLetters, session, tab: 'drafts' }).length,
      archive: filterLettersByCartable({ letters: officeLetters, session, tab: 'archive' }).length,
    };
  }, [officeLetters, session]);

  const visibleLetters = useMemo(() => {
    if (!session) return [];
    return filterLettersByCartable({
      letters: officeLetters,
      session,
      tab: activeTab,
      searchQuery,
      priorityFilter,
      onlyUnread: activeTab === 'inbox' ? onlyUnread : false,
    });
  }, [officeLetters, session, activeTab, searchQuery, priorityFilter, onlyUnread]);

  const lettersPagination = usePagination(visibleLetters, 25);
  const { setCurrentPage: setLettersPage } = lettersPagination;

  useEffect(() => {
    setLettersPage(1);
  }, [activeTab, searchQuery, priorityFilter, onlyUnread, setLettersPage]);

  const selectedLetter = useMemo<OfficeLetter | null>(() => {
    if (!selectedLetterId) return visibleLetters[0] ?? null;
    return (
      visibleLetters.find((l) => l.id === selectedLetterId) ??
      officeLetters.find((l) => l.id === selectedLetterId) ??
      visibleLetters[0] ??
      null
    );
  }, [selectedLetterId, visibleLetters, officeLetters]);

  // Automatic First-View Read Receipt on opening an unread incoming letter
  useEffect(() => {
    if (!selectedLetter || !session) return;
    if (isLetterUnreadForUser(selectedLetter, session.userId)) {
      void recordOfficeLetterReadReceipt(selectedLetter.id);
    }
  }, [selectedLetter, session, recordOfficeLetterReadReceipt]);

  // Reset inline referral panel when switching letters
  useEffect(() => {
    setReferralOpen(false);
    setReferralNote('');
    setShowReceiptsList(false);
  }, [selectedLetter?.id]);

  // Build formal Iranian A4/A5 print HTML for the selected letter
  const printHtml = useMemo(() => {
    if (!selectedLetter) return '';
    const isComplex = selectedLetter.originScope === 'complex';
    const originSchool = isComplex
      ? null
      : allSchools.find((s) => s.id === selectedLetter.senderSchoolId) ?? activeSchool;
    const originBranding = originSchool
      ? schoolBrandingConfigs.find((b) => b.schoolId === originSchool.id)
      : null;
    const originPortalCfg = isComplex
      ? publicPortalConfigs.find((c) => c.scope === 'complex')
      : publicPortalConfigs.find(
          (c) => c.scope === 'school' && c.schoolId === originSchool?.id
        );

    return buildOfficialLetterPrintHtml({
      letter: selectedLetter,
      letterheadTitle: isComplex
        ? OFFICIAL_COMPLEX_NAME_FA
        : originSchool?.name ?? OFFICIAL_COMPLEX_NAME_FA,
      letterheadSubtitle: isComplex
        ? OFFICIAL_SYSTEM_NAME_FA
        : `${OFFICIAL_COMPLEX_NAME_FA} — ${originSchool?.subtitle ?? ''}`,
      logoUrl:
        originBranding?.logoDataUrl ||
        globalSystemConfig.systemLogoDataUrl ||
        DEFAULT_BRAND_LOGO_DATA_URL,
      address: originPortalCfg?.address || originSchool?.address || '',
      phone: originPortalCfg?.phone || originSchool?.phone || '',
      includeReferrals: includeReferralsInPrint,
    });
  }, [
    selectedLetter,
    allSchools,
    activeSchool,
    schoolBrandingConfigs,
    globalSystemConfig.systemLogoDataUrl,
    publicPortalConfigs,
    includeReferralsInPrint,
  ]);

  if (!session) return null;

  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLetter) return;
    const target = officeRecipientDirectory.find((opt) => opt.userId === referralTargetUserId);
    if (!target) {
      showToast('لطفاً همکار مقصد ارجاع را انتخاب کنید.', 'warning');
      return;
    }
    if (!referralNote.trim()) {
      showToast('نوشتن متن هامش یا دستور کار الزامی است.', 'warning');
      return;
    }
    setReferring(true);
    try {
      const res = await referOfficeLetter(selectedLetter.id, target, referralNote.trim());
      if (res.ok) {
        showToast(`نامه با موفقیت به ${target.fullName} ارجاع داده شد.`, 'success');
        setReferralOpen(false);
        setReferralNote('');
        setReferralTargetUserId('');
      } else {
        showToast(res.errorFa ?? 'ارجاع نامه با خطا مواجه شد.', 'error');
      }
    } finally {
      setReferring(false);
    }
  };

  const handleAcknowledgeDirective = async (letter: OfficeLetter) => {
    const res = await acknowledgeOfficeLetter(letter.id);
    if (res.ok) {
      showToast('تأیید مطالعه و ابلاغ با مهر زمان شمسی ثبت شد.', 'success');
    } else {
      showToast(res.errorFa ?? 'خطا در ثبت تأیید ابلاغ.', 'error');
    }
  };

  const handleToggleArchive = async (letter: OfficeLetter) => {
    const isCurrentlyArchived = letter.archivedByUserIds.includes(session.userId);
    const res = await toggleOfficeLetterArchive(letter.id);
    if (res.ok) {
      showToast(
        isCurrentlyArchived ? 'نامه از بایگانی خارج شد.' : 'نامه به بایگانی کارتابل شما منتقل شد.',
        'info'
      );
    } else {
      showToast(res.errorFa ?? 'عملیات بایگانی انجام نشد.', 'error');
    }
  };

  const handleSoftDelete = async (letter: OfficeLetter) => {
    const res = await softDeleteOfficeLetter(letter.id);
    if (res.ok) {
      showToast('نامه با حذف نرم به سطل بازیابی امن منتقل شد.', 'info');
      setSelectedLetterId(null);
    } else {
      showToast(res.errorFa ?? 'مجوز حذف این نامه را ندارید.', 'error');
    }
  };

  const cartables: Array<{
    id: OfficeCartableTab;
    label: string;
    icon: React.ReactNode;
    count: number;
    highlightCount?: number;
  }> = [
    {
      id: 'inbox',
      label: 'کارتابل وارده',
      icon: <Inbox className="w-4 h-4" />,
      count: tabCounts.inbox,
      highlightCount: tabCounts.inboxUnread,
    },
    {
      id: 'outbox',
      label: 'کارتابل صادره',
      icon: <Send className="w-4 h-4" />,
      count: tabCounts.outbox,
    },
    {
      id: 'directives',
      label: 'بخشنامه‌ها',
      icon: <Megaphone className="w-4 h-4" />,
      count: tabCounts.directives,
    },
    {
      id: 'drafts',
      label: 'پیش‌نویس‌ها',
      icon: <FileEdit className="w-4 h-4" />,
      count: tabCounts.drafts,
    },
    {
      id: 'archive',
      label: 'بایگانی',
      icon: <Archive className="w-4 h-4" />,
      count: tabCounts.archive,
    },
  ];

  const myReceipt = selectedLetter?.readReceipts.find((r) => r.userId === session.userId);
  const canDeleteSelected =
    selectedLetter &&
    ((selectedLetter.status === 'draft' && selectedLetter.senderUserId === session.userId) ||
      session.role === 'super_admin' ||
      session.role === 'principal');
  const isSelectedArchived =
    selectedLetter ? selectedLetter.archivedByUserIds.includes(session.userId) : false;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#2b5b84] dark:text-sky-400">
            <Mail className="w-4 h-4" />
            <span>
              دبیرخانه هوشمند داخلی · {session.role === 'super_admin' ? OFFICIAL_COMPLEX_NAME_FA : activeSchool.name}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            اتوماسیون اداری و مکاتبات رسمی
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            ثبت و ارجاع مکاتبات با شماره اندیکاتور خودکار، رسید مشاهده و چاپ رسمی روی سربرگ مدرسه.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setComposeState({})}
          className="self-start sm:self-auto min-h-[44px] inline-flex items-center gap-2 rounded-xl brand-btn text-xs sm:text-sm font-bold px-4 py-2.5 shadow-xs whitespace-nowrap"
        >
          <PenSquare className="w-4 h-4" />
          <span>نگارش نامه / بخشنامه جدید</span>
        </button>
      </div>

      {/* 5 Cartable Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {cartables.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedLetterId(null);
              }}
              className={`min-h-[42px] inline-flex items-center gap-2 rounded-t-xl px-3.5 py-2 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-[#1e3a5f] dark:border-sky-400 text-[#1e3a5f] dark:text-sky-400 bg-slate-50/70 dark:bg-slate-900'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className="tabular-nums text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                ({toPersianDigits(tab.count)})
              </span>
              {typeof tab.highlightCount === 'number' && tab.highlightCount > 0 && (
                <span className="tabular-nums rounded-md bg-rose-600 text-white text-[10px] font-extrabold px-1.5 py-0.5">
                  {toPersianDigits(tab.highlightCount)} جدید
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در موضوع، شماره اندیکاتور، متن یا فرستنده..."
            className="w-full min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pr-9 pl-3 text-xs sm:text-sm"
          />
        </div>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as OfficeLetterPriority | 'all')}
          className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm font-semibold"
        >
          <option value="all">همه اولویت‌ها</option>
          <option value="normal">عادی</option>
          <option value="urgent">فوری</option>
          <option value="immediate">آنی</option>
        </select>

        {activeTab === 'inbox' && (
          <label className="min-h-[40px] inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-semibold cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={onlyUnread}
              onChange={(e) => setOnlyUnread(e.target.checked)}
            />
            <span>فقط خوانده‌نشده‌ها</span>
          </label>
        )}
      </div>

      {/* Master-Detail Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Letter List (Master) */}
        <div className="lg:col-span-5 space-y-2.5">
          {visibleLetters.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              نامه‌ای در این کارتابل یافت نشد.
            </div>
          ) : (
            lettersPagination.pageItems.map((letter) => {
              const unread = isLetterUnreadForUser(letter, session.userId);
              const isSelected = selectedLetter?.id === letter.id;
              const prioMeta = LETTER_PRIORITY_META[letter.priority];

              return (
                <button
                  key={letter.id}
                  type="button"
                  onClick={() => setSelectedLetterId(letter.id)}
                  className={`w-full text-right rounded-2xl border p-4 transition-all space-y-2 ${
                    isSelected
                      ? 'border-[#1e3a5f] dark:border-sky-500 bg-white dark:bg-slate-900 ring-2 ring-[#1e3a5f]/15 dark:ring-sky-500/20'
                      : unread
                        ? 'border-sky-200 dark:border-sky-900/70 bg-sky-50/40 dark:bg-sky-950/20 hover:bg-white dark:hover:bg-slate-900'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {unread && (
                        <span
                          className="w-2 h-2 rounded-full bg-rose-600 shrink-0"
                          aria-label="خوانده‌نشده"
                        />
                      )}
                      <span className="font-bold text-[#2b5b84] dark:text-sky-400 truncate">
                        {letter.indicatorNumber
                          ? toPersianDigits(letter.indicatorNumber)
                          : 'پیش‌نویس'}
                      </span>
                      <span>·</span>
                      <span className="truncate">{LETTER_TYPE_LABELS_FA[letter.letterType]}</span>
                    </div>
                    <span className="shrink-0">{toPersianDigits(letter.sentAtJalali)}</span>
                  </div>

                  <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-6 line-clamp-2">
                    {letter.subject}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="truncate">
                      {activeTab === 'outbox' || activeTab === 'drafts'
                        ? `گیرندگان: ${toPersianDigits(letter.recipients.length)} نفر`
                        : `از: ${letter.senderName} (${letter.senderRoleLabelFa})`}
                    </span>

                    <div className="flex items-center gap-2 shrink-0 text-[11px]">
                      {letter.confidentiality === 'confidential' && (
                        <span className="inline-flex items-center gap-0.5 text-rose-700 dark:text-rose-400 font-bold">
                          <Lock className="w-3 h-3" />
                          محرمانه
                        </span>
                      )}
                      {letter.priority !== 'normal' && (
                        <span className={prioMeta.textClass}>{prioMeta.labelFa}</span>
                      )}
                      {letter.referrals.length > 0 && (
                        <span className="tabular-nums text-slate-500">
                          {toPersianDigits(letter.referrals.length)} ارجاع
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
          {visibleLetters.length > 0 && (
            <PaginationBar
              totalItems={lettersPagination.totalItems}
              currentPage={lettersPagination.currentPage}
              pageSize={lettersPagination.pageSize}
              onPageChange={lettersPagination.setCurrentPage}
              onPageSizeChange={lettersPagination.setPageSize}
              itemLabelFa="نامه"
              className="rounded-2xl border border-slate-200 dark:border-slate-800"
            />
          )}
        </div>

        {/* Letter Detail & Workflow Pane */}
        <div className="lg:col-span-7">
          {!selectedLetter ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-2 text-slate-500 dark:text-slate-400">
              <FileText className="w-8 h-8 mx-auto opacity-50" />
              <div className="text-sm font-semibold">یک نامه را از فهرست سمت راست انتخاب کنید</div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-5">
              {/* Top Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  {selectedLetter.status === 'draft' ? (
                    <button
                      type="button"
                      onClick={() => setComposeState({ existingDraft: selectedLetter })}
                      className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl brand-btn px-3.5 py-1.5 text-xs font-bold"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>ادامه ویرایش و ارسال</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setComposeState({ replyToLetter: selectedLetter })}
                        className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                      >
                        <Reply className="w-3.5 h-3.5" />
                        <span>پاسخ (عطف به نامه)</span>
                      </button>

                      {canUserReferLetter(selectedLetter, session) &&
                        officeRecipientDirectory.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setReferralOpen((prev) => !prev)}
                            className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                          >
                            <Forward className="w-3.5 h-3.5" />
                            <span>ارجاع (هامش‌نویسی)</span>
                          </button>
                        )}

                      <button
                        type="button"
                        onClick={() => handleToggleArchive(selectedLetter)}
                        className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
                      >
                        {isSelectedArchived ? (
                          <>
                            <ArchiveRestore className="w-3.5 h-3.5" />
                            <span>خروج از بایگانی</span>
                          </>
                        ) : (
                          <>
                            <Archive className="w-3.5 h-3.5" />
                            <span>بایگانی</span>
                          </>
                        )}
                      </button>
                    </>
                  )}

                  {canDeleteSelected && (
                    <button
                      type="button"
                      onClick={() => handleSoftDelete(selectedLetter)}
                      className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف نرم</span>
                    </button>
                  )}
                </div>

                {/* Official A4/A5 Print via PrintIconButton */}
                <div className="flex items-center gap-2">
                  {selectedLetter.referrals.length > 0 && (
                    <label className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeReferralsInPrint}
                        onChange={(e) => setIncludeReferralsInPrint(e.target.checked)}
                      />
                      <span>چاپ با هامش‌ها</span>
                    </label>
                  )}
                  <PrintIconButton
                    html={printHtml}
                    documentLabel={`نامه رسمی ${
                      selectedLetter.indicatorNumber
                        ? toPersianDigits(selectedLetter.indicatorNumber)
                        : 'پیش‌نویس'
                    }`}
                    includeHeader={false}
                    includeFooter={false}
                  />
                </div>
              </div>

              {/* Letter Metadata Header */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-[#1e3a5f] dark:text-sky-400">
                      شماره اندیکاتور:{' '}
                      {selectedLetter.indicatorNumber
                        ? toPersianDigits(selectedLetter.indicatorNumber)
                        : 'پیش‌نویس (تخصیص پس از ارسال)'}
                    </span>
                    <span>·</span>
                    <span>{LETTER_TYPE_LABELS_FA[selectedLetter.letterType]}</span>
                    <span>·</span>
                    <span className={LETTER_PRIORITY_META[selectedLetter.priority].textClass}>
                      فوریت: {LETTER_PRIORITY_META[selectedLetter.priority].labelFa}
                    </span>
                    <span>·</span>
                    <span
                      className={
                        LETTER_CONFIDENTIALITY_META[selectedLetter.confidentiality].textClass
                      }
                    >
                      {LETTER_CONFIDENTIALITY_META[selectedLetter.confidentiality].labelFa}
                    </span>
                  </div>
                  <div>
                    تاریخ: {toPersianDigits(selectedLetter.sentAtJalali)} · ساعت{' '}
                    {toPersianDigits(selectedLetter.sentTimeHm)}
                  </div>
                </div>

                {selectedLetter.referenceIndicatorNumber && (
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300">
                    عطف به نامه شماره{' '}
                    <strong className="tabular-nums">
                      {toPersianDigits(selectedLetter.referenceIndicatorNumber)}
                    </strong>
                    {selectedLetter.referenceSubject ? ` (${selectedLetter.referenceSubject})` : ''}
                  </div>
                )}

                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 leading-7">
                  موضوع: {selectedLetter.subject}
                </h2>

                {/* Sender & Recipients */}
                <div className="rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800 p-3.5 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">از: </span>
                    <strong>{selectedLetter.senderName}</strong> ({selectedLetter.senderRoleLabelFa} —{' '}
                    {selectedLetter.senderSchoolName})
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">به: </span>
                    {selectedLetter.recipients
                      .filter((r) => r.kind === 'to')
                      .map((r) => `${r.fullName} (${r.roleLabelFa})`)
                      .join('، ') || '—'}
                  </div>
                  {selectedLetter.recipients.some((r) => r.kind === 'cc') && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">
                        رونوشت:{' '}
                      </span>
                      {selectedLetter.recipients
                        .filter((r) => r.kind === 'cc')
                        .map((r) => `${r.fullName} (${r.roleLabelFa})`)
                        .join('، ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Letter Body */}
              <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-4 sm:p-5 bg-white dark:bg-slate-900/60 space-y-3 text-sm leading-8 text-slate-800 dark:text-slate-200">
                <p className="font-semibold text-slate-700 dark:text-slate-300">با سلام و احترام؛</p>
                {selectedLetter.body
                  .split('\n')
                  .filter((p) => p.trim().length > 0)
                  .map((para, idx) => (
                    <p key={idx} className="text-justify">
                      {para}
                    </p>
                  ))}
              </div>

              {/* Attachments */}
              {selectedLetter.attachments.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>پیوست‌های ارجاعی ({toPersianDigits(selectedLetter.attachments.length)})</span>
                  </div>
                  <ul className="space-y-1.5">
                    {selectedLetter.attachments.map((att) => (
                      <li
                        key={att.id}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-3.5 py-2 text-xs"
                      >
                        <strong className="text-slate-900 dark:text-slate-100">{att.title}</strong>
                        {att.description && (
                          <span className="text-slate-500 dark:text-slate-400">
                            {' '}
                            — {att.description}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Directive Explicit Acknowledgment Bar (for recipients) */}
              {selectedLetter.status === 'sent' &&
                selectedLetter.letterType === 'directive' &&
                selectedLetter.senderUserId !== session.userId && (
                  <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {myReceipt?.acknowledgedAtJalali ? (
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 tabular-nums">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>
                          مطالعه و ابلاغ این بخشنامه در تاریخ{' '}
                          {toPersianDigits(myReceipt.acknowledgedAtJalali)} ساعت{' '}
                          {toPersianDigits(myReceipt.acknowledgedTimeHm ?? '')} توسط شما تأیید شد.
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="text-xs text-emerald-900 dark:text-emerald-200">
                          این نامه از نوع <strong>بخشنامه و دستورالعمل</strong> است؛ لطفاً پس از مطالعه، تأیید ابلاغ را ثبت کنید.
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAcknowledgeDirective(selectedLetter)}
                          className="min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-1.5 shrink-0"
                        >
                          <CheckCheck className="w-4 h-4" />
                          <span>تأیید مطالعه و ابلاغ</span>
                        </button>
                      </>
                    )}
                  </div>
                )}

              {/* Read Receipts Audit Summary */}
              {selectedLetter.status === 'sent' && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                      <Eye className="w-4 h-4 text-[#2b5b84] dark:text-sky-400" />
                      <span>
                        رسید مشاهده: {toPersianDigits(selectedLetter.readReceipts.length)} از{' '}
                        {toPersianDigits(selectedLetter.recipients.length)} گیرنده
                      </span>
                    </div>
                    {selectedLetter.readReceipts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowReceiptsList((prev) => !prev)}
                        className="text-xs font-bold text-[#1e3a5f] dark:text-sky-400 hover:underline"
                      >
                        {showReceiptsList ? 'بستن جزئیات' : 'مشاهده جزئیات رسیدها'}
                      </button>
                    )}
                  </div>

                  {showReceiptsList && selectedLetter.readReceipts.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                      {selectedLetter.readReceipts.map((rr) => (
                        <div
                          key={rr.userId}
                          className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300 tabular-nums"
                        >
                          <span>
                            <strong>{rr.fullName}</strong> ({rr.roleLabelFa})
                          </span>
                          <div className="flex items-center gap-2">
                            <span>
                              مشاهده: {toPersianDigits(rr.firstReadAtJalali)} ·{' '}
                              {toPersianDigits(rr.firstReadTimeHm)}
                            </span>
                            {rr.acknowledgedAtJalali && (
                              <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                                · تأیید ابلاغ شد
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Inline Referral (هامش‌نویسی) Composer */}
              {referralOpen && canUserReferLetter(selectedLetter, session) && (
                <form
                  onSubmit={handleReferralSubmit}
                  className="rounded-2xl border border-[#2b5b84]/30 dark:border-sky-800 bg-sky-50/40 dark:bg-sky-950/20 p-4 space-y-3"
                >
                  <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    ارجاع نامه و ثبت هامش (دستور کار)
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold">ارجاع به همکار *</label>
                    <select
                      required
                      value={referralTargetUserId}
                      onChange={(e) => setReferralTargetUserId(e.target.value)}
                      className="w-full min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm"
                    >
                      <option value="">— انتخاب گیرنده ارجاع —</option>
                      {officeRecipientDirectory.map((opt) => (
                        <option key={opt.userId} value={opt.userId}>
                          {opt.fullName} — {opt.roleLabelFa} ({opt.schoolName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold">متن هامش / دستور اقدام *</label>
                    <textarea
                      rows={2}
                      required
                      value={referralNote}
                      onChange={(e) => setReferralNote(e.target.value)}
                      placeholder="مثلاً: جهت بررسی، اقدام مقتضی و گزارش نتیجه تا پایان هفته..."
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs sm:text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setReferralOpen(false)}
                      className="min-h-[36px] rounded-xl border border-slate-200 dark:border-slate-700 px-3 text-xs font-semibold"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      disabled={referring}
                      className="min-h-[36px] inline-flex items-center gap-1.5 rounded-xl brand-btn px-4 text-xs font-bold disabled:opacity-60"
                    >
                      <Forward className="w-3.5 h-3.5" />
                      <span>{referring ? 'در حال ارجاع...' : 'ثبت ارجاع و ارسال'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Chronological Referral Timeline */}
              {selectedLetter.referrals.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                    تاریخچه ارجاعات و هامش‌ها ({toPersianDigits(selectedLetter.referrals.length)})
                  </div>
                  <ol className="space-y-2">
                    {selectedLetter.referrals.map((ref, idx) => (
                      <li
                        key={ref.id}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-3.5 space-y-1.5 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-slate-600 dark:text-slate-400 tabular-nums">
                          <span>
                            <strong className="text-slate-900 dark:text-slate-100">
                              {toPersianDigits(idx + 1)}. {ref.fromName}
                            </strong>{' '}
                            ({ref.fromRoleLabelFa}) ←{' '}
                            <strong className="text-[#1e3a5f] dark:text-sky-400">
                              {ref.toName}
                            </strong>{' '}
                            ({ref.toRoleLabelFa})
                          </span>
                          <span>
                            {toPersianDigits(ref.referredAtJalali)} · ساعت{' '}
                            {toPersianDigits(ref.referredTimeHm)}
                          </span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 leading-6">
                          هامش: {ref.note}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Compose / Edit / Reply Modal */}
      {composeState && (
        <ComposeLetterModal
          session={session}
          activeSchoolId={activeSchool.id}
          directory={officeRecipientDirectory}
          initialState={composeState}
          onClose={() => setComposeState(null)}
          onSubmit={async (payload) => {
            const res = await saveOrSendOfficeLetter(payload);
            if (!res.ok) {
              showToast(res.errorFa ?? 'خطا در ثبت مکاتبه.', 'error');
              return false;
            }
            if (payload.mode === 'draft') {
              showToast('پیش‌نویس نامه ذخیره شد.', 'info');
              setActiveTab('drafts');
            } else {
              const indicator = res.letter?.indicatorNumber
                ? ` (شماره اندیکاتور: ${toPersianDigits(res.letter.indicatorNumber)})`
                : '';
              showToast(`نامه رسمی با موفقیت ارسال شد${indicator}.`, 'success');
              setActiveTab(payload.letterType === 'directive' ? 'directives' : 'outbox');
            }
            if (res.letter) {
              setSelectedLetterId(res.letter.id);
            }
            return true;
          }}
        />
      )}
    </div>
  );
};

export default OfficeAutomationPage;
