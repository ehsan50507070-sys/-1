// Phase 9-D: Compose / Edit / Reply Office Letter & Directive Modal
import React, { useMemo, useState } from 'react';
import {
  FileText,
  Paperclip,
  Plus,
  Save,
  Search,
  Send,
  ShieldAlert,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { generateUUID } from '../../core/security/sanitize';
import { toPersianDigits } from '../../lib/digits';
import {
  buildBulkRecipientsForDirective,
  canUserIssueDirective,
  LETTER_CONFIDENTIALITY_META,
  LETTER_PRIORITY_META,
  LETTER_TYPE_LABELS_FA,
  type OfficeRecipientOption,
} from '../../services/phase9d/officeAutomationService';
import type {
  AuthSession,
  OfficeLetter,
  OfficeLetterAttachment,
  OfficeLetterConfidentiality,
  OfficeLetterPriority,
  OfficeLetterRecipient,
  OfficeLetterType,
} from '../../types/domain';

export interface ComposeLetterInitialState {
  existingDraft?: OfficeLetter;
  replyToLetter?: OfficeLetter;
}

interface ComposeLetterModalProps {
  session: AuthSession;
  activeSchoolId: string;
  directory: OfficeRecipientOption[];
  initialState?: ComposeLetterInitialState;
  onClose: () => void;
  onSubmit: (payload: {
    existingId?: string;
    mode: 'draft' | 'sent';
    letterType: OfficeLetterType;
    priority: OfficeLetterPriority;
    confidentiality: OfficeLetterConfidentiality;
    subject: string;
    body: string;
    recipients: OfficeLetterRecipient[];
    attachments: OfficeLetterAttachment[];
    referenceLetterId?: string;
    referenceIndicatorNumber?: string;
    referenceSubject?: string;
  }) => Promise<boolean>;
}

export const ComposeLetterModal: React.FC<ComposeLetterModalProps> = ({
  session,
  activeSchoolId,
  directory,
  initialState,
  onClose,
  onSubmit,
}) => {
  const draft = initialState?.existingDraft;
  const replyTo = initialState?.replyToLetter;

  const allowDirective = canUserIssueDirective(session.role);

  const [letterType, setLetterType] = useState<OfficeLetterType>(
    () => draft?.letterType ?? 'internal_letter'
  );
  const [priority, setPriority] = useState<OfficeLetterPriority>(
    () => draft?.priority ?? replyTo?.priority ?? 'normal'
  );
  const [confidentiality, setConfidentiality] = useState<OfficeLetterConfidentiality>(
    () => draft?.confidentiality ?? replyTo?.confidentiality ?? 'normal'
  );
  const [subject, setSubject] = useState<string>(() => {
    if (draft) return draft.subject;
    if (replyTo) {
      return replyTo.subject.startsWith('پاسخ:') ? replyTo.subject : `پاسخ: ${replyTo.subject}`;
    }
    return '';
  });
  const [body, setBody] = useState<string>(() => draft?.body ?? '');

  const [recipients, setRecipients] = useState<OfficeLetterRecipient[]>(() => {
    if (draft) return draft.recipients;
    if (replyTo && replyTo.senderUserId !== session.userId) {
      return [
        {
          userId: replyTo.senderUserId,
          fullName: replyTo.senderName,
          role: replyTo.senderRole,
          roleLabelFa: replyTo.senderRoleLabelFa,
          schoolId: replyTo.senderSchoolId,
          schoolName: replyTo.senderSchoolName,
          kind: 'to',
        },
      ];
    }
    return [];
  });

  const [attachments, setAttachments] = useState<OfficeLetterAttachment[]>(
    () => draft?.attachments ?? []
  );
  const [newAttTitle, setNewAttTitle] = useState('');
  const [newAttDesc, setNewAttDesc] = useState('');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [recipientPickKind, setRecipientPickKind] = useState<'to' | 'cc'>('to');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const groupedDirectory = useMemo(() => {
    const q = recipientSearch.trim().toLowerCase();
    const filtered = directory.filter((opt) => {
      if (!q) return true;
      return `${opt.fullName} ${opt.roleLabelFa} ${opt.schoolName} ${opt.groupLabelFa}`
        .toLowerCase()
        .includes(q);
    });
    const groups = new Map<string, OfficeRecipientOption[]>();
    for (const opt of filtered) {
      const list = groups.get(opt.groupLabelFa) ?? [];
      list.push(opt);
      groups.set(opt.groupLabelFa, list);
    }
    return Array.from(groups.entries());
  }, [directory, recipientSearch]);

  const toggleRecipient = (opt: OfficeRecipientOption, kind: 'to' | 'cc') => {
    setRecipients((prev) => {
      const existing = prev.find((r) => r.userId === opt.userId);
      if (existing) {
        if (existing.kind === kind) {
          return prev.filter((r) => r.userId !== opt.userId);
        }
        return prev.map((r) => (r.userId === opt.userId ? { ...r, kind } : r));
      }
      return [
        ...prev,
        {
          userId: opt.userId,
          fullName: opt.fullName,
          role: opt.role,
          roleLabelFa: opt.roleLabelFa,
          schoolId: opt.schoolId,
          schoolName: opt.schoolName,
          kind,
        },
      ];
    });
  };

  const applyBulkDirectiveAudience = (audience: 'all_principals' | 'school_staff_all') => {
    const bulk = buildBulkRecipientsForDirective({
      audience,
      directory,
      schoolId: activeSchoolId,
    });
    if (bulk.length === 0) {
      setErrorMsg('گیرنده‌ای در این گروه یافت نشد.');
      return;
    }
    setLetterType('directive');
    setRecipients((prev) => {
      const ccOnly = prev.filter((r) => r.kind === 'cc' && !bulk.some((b) => b.userId === r.userId));
      return [...bulk, ...ccOnly];
    });
    setErrorMsg(null);
  };

  const handleAddAttachment = () => {
    const cleanTitle = newAttTitle.trim();
    if (!cleanTitle) return;
    setAttachments((prev) => [
      ...prev,
      {
        id: generateUUID(),
        title: cleanTitle,
        description: newAttDesc.trim() || undefined,
      },
    ]);
    setNewAttTitle('');
    setNewAttDesc('');
  };

  const handleAction = async (mode: 'draft' | 'sent') => {
    setErrorMsg(null);
    if (!subject.trim()) {
      setErrorMsg('موضوع نامه نمی‌تواند خالی باشد.');
      return;
    }
    if (mode === 'sent') {
      if (!body.trim()) {
        setErrorMsg('متن نامه برای ارسال رسمی الزامی است.');
        return;
      }
      if (!recipients.some((r) => r.kind === 'to')) {
        setErrorMsg('حداقل یک گیرنده اصلی (به) انتخاب کنید.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const ok = await onSubmit({
        existingId: draft?.id,
        mode,
        letterType,
        priority,
        confidentiality,
        subject: subject.trim(),
        body: body.trim(),
        recipients,
        attachments,
        referenceLetterId: replyTo?.id ?? draft?.referenceLetterId,
        referenceIndicatorNumber: replyTo?.indicatorNumber ?? draft?.referenceIndicatorNumber,
        referenceSubject: replyTo?.subject ?? draft?.referenceSubject,
      });
      if (ok) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toList = recipients.filter((r) => r.kind === 'to');
  const ccList = recipients.filter((r) => r.kind === 'cc');

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compose-letter-title"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col"
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#1e3a5f] dark:text-sky-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="compose-letter-title"
                className="text-base font-extrabold text-slate-900 dark:text-slate-100"
              >
                {draft
                  ? 'ویرایش پیش‌نویس نامه اداری'
                  : replyTo
                    ? 'پاسخ رسمی (عطف به نامه)'
                    : 'نگارش نامه اداری یا بخشنامه جدید'}
              </h2>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                شماره اندیکاتور رسمی هنگام «ارسال و ثبت اندیکاتور» به‌صورت خودکار تخصیص می‌یابد.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Reference Banner if Reply */}
          {(replyTo?.indicatorNumber || draft?.referenceIndicatorNumber) && (
            <div className="rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/70 dark:bg-sky-950/30 px-4 py-2.5 text-xs text-sky-900 dark:text-sky-200 flex flex-wrap items-center gap-2">
              <span className="font-bold">عطف به نامه شماره:</span>
              <span className="font-extrabold tabular-nums">
                {toPersianDigits(replyTo?.indicatorNumber ?? draft?.referenceIndicatorNumber ?? '')}
              </span>
              {(replyTo?.subject || draft?.referenceSubject) && (
                <span>— {replyTo?.subject ?? draft?.referenceSubject}</span>
              )}
            </div>
          )}

          {/* Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                نوع مکاتبه
              </label>
              <select
                value={letterType}
                onChange={(e) => setLetterType(e.target.value as OfficeLetterType)}
                className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm"
              >
                <option value="internal_letter">{LETTER_TYPE_LABELS_FA.internal_letter}</option>
                <option value="admin_request">{LETTER_TYPE_LABELS_FA.admin_request}</option>
                {allowDirective && (
                  <option value="directive">{LETTER_TYPE_LABELS_FA.directive}</option>
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                اولویت / فوریت
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as OfficeLetterPriority)}
                className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm"
              >
                {(Object.keys(LETTER_PRIORITY_META) as OfficeLetterPriority[]).map((p) => (
                  <option key={p} value={p}>
                    {LETTER_PRIORITY_META[p].labelFa}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                طبقه‌بندی محرمانگی
              </label>
              <select
                value={confidentiality}
                onChange={(e) => setConfidentiality(e.target.value as OfficeLetterConfidentiality)}
                className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm"
              >
                {(Object.keys(LETTER_CONFIDENTIALITY_META) as OfficeLetterConfidentiality[]).map(
                  (c) => (
                    <option key={c} value={c}>
                      {LETTER_CONFIDENTIALITY_META[c].labelFa}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {confidentiality === 'confidential' && (
            <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 px-3.5 py-2 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                نامه‌های محرمانه صرفاً برای گیرندگان مشخص‌شده قابل مشاهده هستند و توسط معلمان قابل ارجاع مجدد نخواهند بود.
              </span>
            </div>
          )}

          {/* Recipients Picker + Bulk Directive Shortcuts */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-slate-50/60 dark:bg-slate-950/40">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#2b5b84] dark:text-sky-400" />
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  گیرندگان مجاز ({toPersianDigits(toList.length)} اصلی · {toPersianDigits(ccList.length)} رونوشت)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(session.role === 'super_admin' || session.role === 'complex_admin') && (
                  <button
                    type="button"
                    onClick={() => applyBulkDirectiveAudience('all_principals')}
                    className="min-h-[34px] rounded-xl border border-[#1e3a5f]/30 dark:border-sky-500/40 bg-white dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-sky-950/40 px-3 py-1 text-xs font-bold text-[#1e3a5f] dark:text-sky-300 transition-colors"
                  >
                    ابلاغ بخشنامه به تمام مدیران مجموعه
                  </button>
                )}
                {session.role === 'principal' && (
                  <button
                    type="button"
                    onClick={() => applyBulkDirectiveAudience('school_staff_all')}
                    className="min-h-[34px] rounded-xl border border-[#1e3a5f]/30 dark:border-sky-500/40 bg-white dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-sky-950/40 px-3 py-1 text-xs font-bold text-[#1e3a5f] dark:text-sky-300 transition-colors"
                  >
                    ابلاغ بخشنامه به کل کادر و معلمان مدرسه
                  </button>
                )}
              </div>
            </div>

            {/* Selected Recipients Preview */}
            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {recipients.map((r) => (
                  <span
                    key={r.userId}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs ${
                      r.kind === 'to'
                        ? 'bg-white dark:bg-slate-900 border-[#2b5b84]/40 text-slate-800 dark:text-slate-100'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <strong className="text-[10px] text-[#2b5b84] dark:text-sky-400">
                      {r.kind === 'to' ? 'به:' : 'رونوشت:'}
                    </strong>
                    <span>{r.fullName}</span>
                    <span className="text-[11px] text-slate-400">({r.roleLabelFa})</span>
                    <button
                      type="button"
                      onClick={() =>
                        setRecipients((prev) => prev.filter((item) => item.userId !== r.userId))
                      }
                      aria-label={`حذف ${r.fullName}`}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search & Add Mode */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  placeholder="جستجوی نام، سمت یا مدرسه گیرنده..."
                  className="w-full min-h-[38px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pr-9 pl-3 text-xs sm:text-sm"
                />
              </div>
              <div className="inline-flex rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setRecipientPickKind('to')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    recipientPickKind === 'to'
                      ? 'bg-[#1e3a5f] text-white dark:bg-sky-600'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  گیرنده اصلی (به)
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientPickKind('cc')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    recipientPickKind === 'cc'
                      ? 'bg-[#1e3a5f] text-white dark:bg-sky-600'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  رونوشت (CC)
                </button>
              </div>
            </div>

            {/* Grouped Recipient Options */}
            <div className="max-h-44 overflow-y-auto space-y-3 pl-1">
              {groupedDirectory.length === 0 ? (
                <div className="text-xs text-slate-500 py-3 text-center">
                  گیرنده مجازی مطابق جستجو یافت نشد.
                </div>
              ) : (
                groupedDirectory.map(([groupName, items]) => (
                  <div key={groupName} className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {groupName}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                      {items.map((opt) => {
                        const existing = recipients.find((r) => r.userId === opt.userId);
                        return (
                          <button
                            key={opt.userId}
                            type="button"
                            onClick={() => toggleRecipient(opt, recipientPickKind)}
                            className={`text-right rounded-xl border px-3 py-2 text-xs transition-colors flex items-center justify-between gap-2 ${
                              existing
                                ? existing.kind === 'to'
                                  ? 'border-[#1e3a5f] dark:border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 text-slate-900 dark:text-slate-100'
                                  : 'border-amber-400 dark:border-amber-600 bg-amber-50/60 dark:bg-amber-950/30 text-slate-900 dark:text-slate-100'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-bold truncate">{opt.fullName}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {opt.roleLabelFa}
                              </div>
                            </div>
                            {existing && (
                              <span className="text-[10px] font-extrabold shrink-0 text-[#1e3a5f] dark:text-sky-400">
                                {existing.kind === 'to' ? 'اصلی' : 'رونوشت'}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Subject & Body */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                موضوع نامه / بخشنامه *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="موضوع روشن و رسمی مکاتبه را وارد کنید..."
                className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                متن رسمی مکاتبه *
              </label>
              <textarea
                rows={7}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="متن نامه را بنویسید (تیتر «بسمه تعالی» و «با سلام و احترام» در خروجی چاپی رسمی به‌صورت خودکار درج می‌شود)..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 text-sm leading-7"
              />
            </div>
          </div>

          {/* Attachments Reference */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
              <Paperclip className="w-4 h-4 text-[#2b5b84] dark:text-sky-400" />
              <span>پیوست‌های ارجاعی (اختیاری — عنوان و توضیح فایل یا مدرک پیوست)</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newAttTitle}
                onChange={(e) => setNewAttTitle(e.target.value)}
                placeholder="عنوان پیوست (مثلاً: جدول برنامه امتحانات نوبت اول)"
                className="flex-1 min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs sm:text-sm"
              />
              <input
                type="text"
                value={newAttDesc}
                onChange={(e) => setNewAttDesc(e.target.value)}
                placeholder="توضیح کوتاه (اختیاری)"
                className="flex-1 min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs sm:text-sm"
              />
              <button
                type="button"
                onClick={handleAddAttachment}
                className="min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-3.5 text-xs font-bold shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن پیوست</span>
              </button>
            </div>

            {attachments.length > 0 && (
              <ul className="space-y-1.5">
                {attachments.map((att) => (
                  <li
                    key={att.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 px-3 py-2 text-xs"
                  >
                    <div>
                      <strong className="text-slate-800 dark:text-slate-100">{att.title}</strong>
                      {att.description && (
                        <span className="text-slate-500 dark:text-slate-400"> — {att.description}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setAttachments((prev) => prev.filter((item) => item.id !== att.id))
                      }
                      className="text-rose-600 hover:text-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 px-4 py-2.5 text-xs text-rose-700 dark:text-rose-300"
            >
              {errorMsg}
            </div>
          )}
        </div>

        {/* Sticky Footer Actions */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 px-4 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            انصراف
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleAction('draft')}
              className="min-h-[42px] inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-bold px-4 py-2 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره پیش‌نویس</span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleAction('sent')}
              className="min-h-[42px] inline-flex items-center gap-2 rounded-xl brand-btn text-xs sm:text-sm font-bold px-5 py-2 disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'در حال ثبت...' : 'ارسال و ثبت شماره اندیکاتور'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
