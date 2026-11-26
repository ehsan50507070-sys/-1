// Pure Business Logic for Phase 9-D Internal Office Automation
// Handles indicator auto-numbering, RBAC recipient directory, 5 cartables, referrals, read receipts & formal Iranian A4/A5 letter print HTML
import { toAsciiDigits, toPersianDigits } from '../../lib/digits';
import { OFFICIAL_COMPLEX_NAME_FA } from '../../core/branding/BrandLogo';
import { ROLE_DEFINITIONS } from '../../core/auth/rbac';
import type {
  AuthSession,
  ManagedAdminAccount,
  OfficeLetter,
  OfficeLetterConfidentiality,
  OfficeLetterPriority,
  OfficeLetterRecipient,
  OfficeLetterType,
  RoleId,
  School,
  Teacher,
} from '../../types/domain';

export type OfficeCartableTab = 'inbox' | 'outbox' | 'directives' | 'drafts' | 'archive';

export interface OfficeRecipientOption {
  userId: string;
  fullName: string;
  role: RoleId;
  roleLabelFa: string;
  schoolId: string;
  schoolName: string;
  groupLabelFa: string;
}

export const LETTER_TYPE_LABELS_FA: Record<OfficeLetterType, string> = {
  internal_letter: 'نامه داخلی',
  directive: 'بخشنامه و دستورالعمل',
  admin_request: 'درخواست اداری',
};

export const LETTER_PRIORITY_META: Record<
  OfficeLetterPriority,
  { labelFa: string; textClass: string }
> = {
  normal: { labelFa: 'عادی', textClass: 'text-slate-600 dark:text-slate-400' },
  urgent: { labelFa: 'فوری', textClass: 'text-amber-700 dark:text-amber-400 font-bold' },
  immediate: { labelFa: 'آنی', textClass: 'text-rose-700 dark:text-rose-400 font-extrabold' },
};

export const LETTER_CONFIDENTIALITY_META: Record<
  OfficeLetterConfidentiality,
  { labelFa: string; textClass: string }
> = {
  normal: { labelFa: 'عادی', textClass: 'text-slate-600 dark:text-slate-400' },
  confidential: { labelFa: 'محرمانه', textClass: 'text-rose-700 dark:text-rose-400 font-bold' },
};

export function isStaffAutomationRole(role: RoleId): boolean {
  return role !== 'student' && role !== 'parent';
}

export function canUserIssueDirective(role: RoleId): boolean {
  return role === 'super_admin' || role === 'complex_admin' || role === 'principal';
}

/**
 * Resolves the concise Persian unit code for indicator numbering:
 * - Complex / Super Admin: 'مجموعه' -> e.g. '1404/مجموعه/001'
 * - Schools: 'م1', 'م2', 'م3', ... based on index in schools list -> e.g. '1404/م1/001'
 */
export function resolveIndicatorUnitCode(
  originScope: 'complex' | 'school',
  schoolId: string,
  schools: School[]
): string {
  if (originScope === 'complex') return 'مجموعه';
  const idx = schools.findIndex((s) => s.id === schoolId);
  if (idx >= 0) return `م${idx + 1}`;
  const numericMatch = schoolId.match(/(\d+)/);
  return `م${numericMatch ? numericMatch[1] : '1'}`;
}

/**
 * Generates next sequential indicator number scoped cleanly by (academicYear, originScope, schoolId).
 * Stored with normalized ASCII digits for deterministic sorting/lookup; render with toPersianDigits().
 */
export function generateIndicatorNumber(params: {
  originScope: 'complex' | 'school';
  schoolId: string;
  academicYearId: string;
  jalaliDate: string;
  schools: School[];
  existingLetters: OfficeLetter[];
}): { indicatorNumber: string; sequence: number } {
  const { originScope, schoolId, academicYearId, jalaliDate, schools, existingLetters } = params;
  const jalaliYear = toAsciiDigits(jalaliDate).split('/')[0] || toAsciiDigits(academicYearId).split('-')[0] || '1404';
  const unitCode = resolveIndicatorUnitCode(originScope, schoolId, schools);

  const sameScopeSent = existingLetters.filter(
    (l) =>
      l.status === 'sent' &&
      l.originScope === originScope &&
      l.academicYearId === academicYearId &&
      (originScope === 'complex' || l.senderSchoolId === schoolId)
  );

  const maxSeq = sameScopeSent.reduce(
    (max, item) => Math.max(max, Number.isFinite(item.indicatorSequence) ? item.indicatorSequence : 0),
    0
  );
  const nextSeq = maxSeq + 1;
  const padded = String(nextSeq).padStart(3, '0');
  return {
    indicatorNumber: `${jalaliYear}/${unitCode}/${padded}`,
    sequence: nextSeq,
  };
}

/**
 * Builds the exact allowed recipient directory for the active user respecting strict RBAC & multi-school isolation:
 * - super_admin: all principals, complex admins, deputies, counselors & active teachers across all schools.
 * - complex_admin: super_admin + all principals/deputies/counselors/teachers in visible complex schools.
 * - principal & deputy: super_admin, complex_admin + deputies, counselors & active teachers of OWN school.
 * - teacher & counselor: principal & deputy of OWN school (plus counselor/deputy peers in own school for referrals if needed).
 */
export function buildAllowedRecipientDirectory(params: {
  session: AuthSession;
  schools: School[];
  managedAdmins: ManagedAdminAccount[];
  teachers: Teacher[];
}): OfficeRecipientOption[] {
  const { session, schools, managedAdmins, teachers } = params;
  if (!isStaffAutomationRole(session.role)) return [];

  const schoolMap = new Map(schools.map((s) => [s.id, s]));
  const options: OfficeRecipientOption[] = [];
  const seen = new Set<string>();

  const pushOption = (opt: OfficeRecipientOption) => {
    if (opt.userId === session.userId) return;
    if (seen.has(opt.userId)) return;
    seen.add(opt.userId);
    options.push(opt);
  };

  const activeAdmins = managedAdmins.filter((a) => a.isActive);
  const activeTeachers = teachers.filter((t) => t.active);

  if (session.role === 'super_admin' || session.role === 'complex_admin') {
    for (const acc of activeAdmins) {
      if (acc.role === 'super_admin' && session.role === 'super_admin') continue;
      const schoolName =
        acc.role === 'super_admin' || acc.role === 'complex_admin'
          ? OFFICIAL_COMPLEX_NAME_FA
          : schoolMap.get(acc.schoolId)?.name ?? 'مدرسه مجموعه';
      pushOption({
        userId: acc.id,
        fullName: acc.fullName,
        role: acc.role,
        roleLabelFa: ROLE_DEFINITIONS[acc.role]?.labelFa ?? acc.role,
        schoolId: acc.schoolId,
        schoolName,
        groupLabelFa:
          acc.role === 'principal'
            ? 'مدیران مدارس مجموعه'
            : acc.role === 'super_admin' || acc.role === 'complex_admin'
              ? 'مدیریت کل مجموعه'
              : `کادر اجرایی — ${schoolName}`,
      });
    }
    for (const teacher of activeTeachers) {
      const schoolName = schoolMap.get(teacher.schoolId)?.name ?? 'مدرسه مجموعه';
      pushOption({
        userId: `user-teacher-${teacher.id}`,
        fullName: teacher.fullName,
        role: 'teacher',
        roleLabelFa: ROLE_DEFINITIONS.teacher.labelFa,
        schoolId: teacher.schoolId,
        schoolName,
        groupLabelFa: `معلمان — ${schoolName}`,
      });
    }
    return options;
  }

  // Principal & Deputy: Super Admin + Complex Admin + own school's admin staff & teachers
  if (session.role === 'principal' || session.role === 'deputy') {
    for (const acc of activeAdmins) {
      if (acc.role === 'super_admin' || acc.role === 'complex_admin') {
        pushOption({
          userId: acc.id,
          fullName: acc.fullName,
          role: acc.role,
          roleLabelFa: ROLE_DEFINITIONS[acc.role]?.labelFa ?? acc.role,
          schoolId: acc.schoolId,
          schoolName: OFFICIAL_COMPLEX_NAME_FA,
          groupLabelFa: 'مدیریت کل مجموعه و راهبر ارشد',
        });
      } else if (acc.schoolId === session.schoolId) {
        const schoolName = schoolMap.get(acc.schoolId)?.name ?? 'مدرسه';
        pushOption({
          userId: acc.id,
          fullName: acc.fullName,
          role: acc.role,
          roleLabelFa: ROLE_DEFINITIONS[acc.role]?.labelFa ?? acc.role,
          schoolId: acc.schoolId,
          schoolName,
          groupLabelFa: `کادر مدیریت و مشاوره ${schoolName}`,
        });
      }
    }
    for (const teacher of activeTeachers.filter((t) => t.schoolId === session.schoolId)) {
      const schoolName = schoolMap.get(teacher.schoolId)?.name ?? 'مدرسه';
      pushOption({
        userId: `user-teacher-${teacher.id}`,
        fullName: teacher.fullName,
        role: 'teacher',
        roleLabelFa: ROLE_DEFINITIONS.teacher.labelFa,
        schoolId: teacher.schoolId,
        schoolName,
        groupLabelFa: `معلمان ${schoolName}`,
      });
    }
    return options;
  }

  // Teacher & Counselor: own school's Principal & Deputy
  const ownSchoolName = schoolMap.get(session.schoolId)?.name ?? 'مدرسه';
  for (const acc of activeAdmins) {
    if (
      acc.schoolId === session.schoolId &&
      (acc.role === 'principal' || acc.role === 'deputy')
    ) {
      pushOption({
        userId: acc.id,
        fullName: acc.fullName,
        role: acc.role,
        roleLabelFa: ROLE_DEFINITIONS[acc.role]?.labelFa ?? acc.role,
        schoolId: acc.schoolId,
        schoolName: ownSchoolName,
        groupLabelFa: `مدیریت و معاونت ${ownSchoolName}`,
      });
    }
  }
  return options;
}

/**
 * Checks whether a user is a direct recipient, CC recipient, or referral target on a letter.
 */
export function isUserParticipantInLetter(letter: OfficeLetter, userId: string): boolean {
  if (letter.senderUserId === userId) return true;
  if (letter.recipients.some((r) => r.userId === userId)) return true;
  if (letter.referrals.some((ref) => ref.toUserId === userId || ref.fromUserId === userId)) return true;
  return false;
}

export function isUserInboundRecipient(letter: OfficeLetter, userId: string): boolean {
  if (letter.status !== 'sent') return false;
  if (letter.recipients.some((r) => r.userId === userId)) return true;
  if (letter.referrals.some((ref) => ref.toUserId === userId)) return true;
  return false;
}

export function canUserAccessLetter(letter: OfficeLetter, session: AuthSession): boolean {
  if (!isStaffAutomationRole(session.role)) return false;
  if (letter.status === 'draft') {
    return letter.senderUserId === session.userId;
  }
  if (session.role === 'super_admin') return true;
  if (isUserParticipantInLetter(letter, session.userId)) return true;
  // Non-confidential directives addressed to the user's school are also viewable by school staff
  if (
    letter.letterType === 'directive' &&
    letter.confidentiality === 'normal' &&
    letter.involvedSchoolIds.includes(session.schoolId) &&
    (session.role === 'principal' || session.role === 'deputy')
  ) {
    return true;
  }
  return false;
}

export function canUserReferLetter(letter: OfficeLetter, session: AuthSession): boolean {
  if (letter.status !== 'sent') return false;
  if (!isStaffAutomationRole(session.role)) return false;
  if (!canUserAccessLetter(letter, session)) return false;
  // Teachers cannot refer confidential letters further unless they are management/super_admin
  if (
    letter.confidentiality === 'confidential' &&
    session.role !== 'super_admin' &&
    session.role !== 'complex_admin' &&
    session.role !== 'principal' &&
    session.role !== 'deputy'
  ) {
    return false;
  }
  return true;
}

export function isLetterUnreadForUser(letter: OfficeLetter, userId: string): boolean {
  if (letter.status !== 'sent') return false;
  if (letter.senderUserId === userId) return false;
  if (!isUserInboundRecipient(letter, userId)) return false;
  if (letter.archivedByUserIds.includes(userId)) return false;
  return !letter.readReceipts.some((rr) => rr.userId === userId);
}

export function computeUnreadInboxLetters(
  letters: OfficeLetter[],
  session: AuthSession | null
): OfficeLetter[] {
  if (!session || !isStaffAutomationRole(session.role)) return [];
  return letters.filter((l) => isLetterUnreadForUser(l, session.userId));
}

export function filterLettersByCartable(params: {
  letters: OfficeLetter[];
  session: AuthSession;
  tab: OfficeCartableTab;
  searchQuery?: string;
  priorityFilter?: OfficeLetterPriority | 'all';
  onlyUnread?: boolean;
}): OfficeLetter[] {
  const { letters, session, tab, searchQuery = '', priorityFilter = 'all', onlyUnread = false } = params;
  const q = searchQuery.trim().toLowerCase();
  const qEn = toAsciiDigits(q);

  return letters
    .filter((letter) => {
      if (!canUserAccessLetter(letter, session)) return false;
      const isArchivedByMe = letter.archivedByUserIds.includes(session.userId);

      if (tab === 'drafts') {
        if (letter.status !== 'draft' || letter.senderUserId !== session.userId) return false;
      } else if (tab === 'archive') {
        if (letter.status !== 'sent' || !isArchivedByMe) return false;
      } else if (tab === 'outbox') {
        if (letter.status !== 'sent' || letter.senderUserId !== session.userId || isArchivedByMe) {
          return false;
        }
      } else if (tab === 'directives') {
        if (letter.status !== 'sent' || letter.letterType !== 'directive' || isArchivedByMe) {
          return false;
        }
      } else {
        // inbox
        if (letter.status !== 'sent' || isArchivedByMe) return false;
        if (!isUserInboundRecipient(letter, session.userId)) return false;
      }

      if (priorityFilter !== 'all' && letter.priority !== priorityFilter) return false;
      if (onlyUnread && !isLetterUnreadForUser(letter, session.userId)) return false;

      if (q) {
        const haystack = [
          letter.subject,
          letter.body,
          letter.indicatorNumber,
          toPersianDigits(letter.indicatorNumber),
          letter.senderName,
          letter.referenceIndicatorNumber ?? '',
          ...letter.recipients.map((r) => r.fullName),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q) && !toAsciiDigits(haystack).includes(qEn)) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => (b.sentAtIso || b.updatedAtIso).localeCompare(a.sentAtIso || a.updatedAtIso));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates an authentic, crisp Iranian Official Administrative Letter A4/A5 HTML document
 * rendered exclusively through PrintPreviewPortal (white background, school/complex letterhead,
 * top-left indicator box, Bismillah header, addressee, subject, body, sender signature, CC list).
 */
export function buildOfficialLetterPrintHtml(params: {
  letter: OfficeLetter;
  letterheadTitle: string;
  letterheadSubtitle: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  includeReferrals?: boolean;
}): string {
  const {
    letter,
    letterheadTitle,
    letterheadSubtitle,
    logoUrl,
    address,
    phone,
    includeReferrals = false,
  } = params;

  const toRecipients = letter.recipients.filter((r) => r.kind === 'to');
  const ccRecipients = letter.recipients.filter((r) => r.kind === 'cc');

  const indicatorDisplay = letter.indicatorNumber
    ? toPersianDigits(letter.indicatorNumber)
    : 'پیش‌نویس (بدون شماره)';
  const dateDisplay = toPersianDigits(letter.sentAtJalali);
  const attachmentDisplay =
    letter.attachments.length > 0
      ? `${toPersianDigits(letter.attachments.length)} مورد (${letter.attachments.map((a) => a.title).join('، ')})`
      : 'ندارد';

  const addresseeHtml =
    toRecipients.length > 0
      ? toRecipients
          .map(
            (r) =>
              `<div style="margin-bottom:2px;"><strong>${escapeHtml(r.fullName)}</strong> — ${escapeHtml(r.roleLabelFa)} (${escapeHtml(r.schoolName)})</div>`
          )
          .join('')
      : '<div>همکاران محترم</div>';

  const ccHtml =
    ccRecipients.length > 0
      ? `
        <div style="margin-top:24px;padding-top:10px;border-top:1px dashed #cbd5e1;font-size:11.5px;color:#334155;">
          <div style="font-weight:700;margin-bottom:4px;">رونوشت جهت اطلاع و اقدام مقتضی:</div>
          <ul style="margin:0;padding-right:18px;line-height:1.8;">
            ${ccRecipients
              .map(
                (r) =>
                  `<li>${escapeHtml(r.fullName)} — ${escapeHtml(r.roleLabelFa)} (${escapeHtml(r.schoolName)})</li>`
              )
              .join('')}
          </ul>
        </div>
      `
      : '';

  const referralsHtml =
    includeReferrals && letter.referrals.length > 0
      ? `
        <div style="margin-top:20px;padding-top:10px;border-top:1px solid #cbd5e1;font-size:11px;color:#334155;">
          <div style="font-weight:700;margin-bottom:6px;">سوابق ارجاعات و هامش‌ها:</div>
          ${letter.referrals
            .map(
              (ref, idx) => `
              <div style="margin-bottom:6px;padding:6px 8px;border:1px solid #e2e8f0;border-radius:6px;background:#f8fafc;">
                <div style="font-weight:700;">${toPersianDigits(idx + 1)}. از ${escapeHtml(ref.fromName)} (${escapeHtml(ref.fromRoleLabelFa)}) به ${escapeHtml(ref.toName)} (${escapeHtml(ref.toRoleLabelFa)}) — ${escapeHtml(toPersianDigits(ref.referredAtJalali))} ساعت ${escapeHtml(toPersianDigits(ref.referredTimeHm))}</div>
                <div style="margin-top:3px;">هامش: ${escapeHtml(ref.note)}</div>
              </div>
            `
            )
            .join('')}
        </div>
      `
      : '';

  const bodyParagraphs = letter.body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => `<p style="margin:0 0 10px 0;text-align:justify;line-height:2.05;">${escapeHtml(line)}</p>`)
    .join('');

  const logoMarkup = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(letterheadTitle)}" style="width:58px;height:58px;object-fit:contain;border-radius:10px;border:1px solid #e2e8f0;padding:3px;background:#ffffff;" />`
    : '';

  const footerContact = [
    address ? `نشانی: ${escapeHtml(address)}` : '',
    phone ? `تلفن: ${escapeHtml(toPersianDigits(phone))}` : '',
  ]
    .filter(Boolean)
    .join('  |  ');

  return `
    <div dir="rtl" data-print-embedded-header="true" data-print-embedded-footer="true" style="background:#ffffff;color:#0f172a;font-family:'Vazirmatn',Tahoma,sans-serif;padding:4mm 2mm;min-height:245mm;display:flex;flex-direction:column;justify-content:space-between;">
      <div>
        <!-- Formal Iranian Letterhead Row -->
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding-bottom:12px;border-bottom:2px solid #1e3a5f;">
          <div style="display:flex;align-items:center;gap:12px;flex:1;">
            ${logoMarkup}
            <div>
              <div style="font-size:15px;font-weight:800;color:#0f172a;line-height:1.5;">${escapeHtml(letterheadTitle)}</div>
              <div style="font-size:11.5px;color:#475569;margin-top:2px;">${escapeHtml(letterheadSubtitle)}</div>
              <div style="font-size:11px;font-weight:700;color:#1e3a5f;margin-top:4px;">${escapeHtml(LETTER_TYPE_LABELS_FA[letter.letterType])}</div>
            </div>
          </div>

          <!-- Top-Left Official Indicator Box -->
          <div style="min-width:195px;border:1px solid #94a3b8;border-radius:8px;padding:8px 10px;font-size:11.5px;line-height:1.85;background:#ffffff;">
            <div><span style="color:#475569;">شماره:</span> <strong style="font-variant-numeric:tabular-nums;">${escapeHtml(indicatorDisplay)}</strong></div>
            <div><span style="color:#475569;">تاریخ:</span> <strong style="font-variant-numeric:tabular-nums;">${escapeHtml(dateDisplay)}</strong></div>
            <div><span style="color:#475569;">پیوست:</span> <strong>${escapeHtml(attachmentDisplay)}</strong></div>
            <div><span style="color:#475569;">طبقه‌بندی / فوریت:</span> <strong>${escapeHtml(LETTER_CONFIDENTIALITY_META[letter.confidentiality].labelFa)} / ${escapeHtml(LETTER_PRIORITY_META[letter.priority].labelFa)}</strong></div>
            ${
              letter.referenceIndicatorNumber
                ? `<div><span style="color:#475569;">عطف به:</span> <strong style="font-variant-numeric:tabular-nums;">${escapeHtml(toPersianDigits(letter.referenceIndicatorNumber))}</strong></div>`
                : ''
            }
          </div>
        </div>

        <!-- Centered Bismillah -->
        <div style="text-align:center;font-size:15px;font-weight:800;color:#0f172a;margin:18px 0 16px 0;letter-spacing:0.2px;">
          بسمه تعالی
        </div>

        <!-- Addressee & Subject -->
        <div style="margin-bottom:14px;font-size:13px;line-height:1.9;">
          <div style="margin-bottom:6px;">
            <span style="color:#475569;font-weight:700;">از:</span>
            <span>${escapeHtml(letter.senderName)} (${escapeHtml(letter.senderRoleLabelFa)} — ${escapeHtml(letter.senderSchoolName)})</span>
          </div>
          <div style="margin-bottom:6px;">
            <span style="color:#475569;font-weight:700;">به:</span>
            <div style="margin-top:2px;padding-right:10px;">${addresseeHtml}</div>
          </div>
          <div style="padding:8px 12px;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;margin-top:10px;">
            <span style="color:#475569;font-weight:700;">موضوع:</span>
            <strong style="margin-right:6px;">${escapeHtml(letter.subject)}</strong>
          </div>
        </div>

        <!-- Formal Body -->
        <div style="font-size:13.5px;color:#0f172a;margin-top:16px;padding:0 4px;">
          <p style="margin:0 0 10px 0;font-weight:600;">با سلام و احترام؛</p>
          ${bodyParagraphs}
        </div>

        <!-- Signature Block -->
        <div style="display:flex;justify-content:flex-end;margin-top:34px;padding-left:20px;">
          <div style="text-align:center;min-width:210px;">
            <div style="font-size:13px;font-weight:700;color:#0f172a;">با تشکر و احترام</div>
            <div style="font-size:13px;font-weight:800;color:#0f172a;margin-top:6px;">${escapeHtml(letter.senderName)}</div>
            <div style="font-size:11.5px;color:#475569;margin-top:2px;">${escapeHtml(letter.senderRoleLabelFa)}</div>
            <div style="font-size:11px;color:#64748b;margin-top:2px;">${escapeHtml(letter.senderSchoolName)}</div>
            <div style="margin-top:28px;border-top:1px dotted #94a3b8;padding-top:4px;font-size:10.5px;color:#64748b;">محل مهر و امضا</div>
          </div>
        </div>

        ${ccHtml}
        ${referralsHtml}
      </div>

      <!-- Footer -->
      <div style="margin-top:24px;padding-top:8px;border-top:1px solid #cbd5e1;display:flex;justify-content:space-between;align-items:center;font-size:10.5px;color:#475569;">
        <div>${footerContact || escapeHtml(letterheadTitle)}</div>
        <div style="font-variant-numeric:tabular-nums;">شماره اندیکاتور: ${escapeHtml(indicatorDisplay)}</div>
      </div>
    </div>
  `;
}

export function buildBulkRecipientsForDirective(params: {
  audience: 'all_principals' | 'school_staff_all';
  directory: OfficeRecipientOption[];
  schoolId: string;
}): OfficeLetterRecipient[] {
  const { audience, directory, schoolId } = params;
  const filtered =
    audience === 'all_principals'
      ? directory.filter((opt) => opt.role === 'principal' || opt.role === 'complex_admin')
      : directory.filter(
          (opt) =>
            opt.schoolId === schoolId &&
            (opt.role === 'teacher' || opt.role === 'deputy' || opt.role === 'counselor')
        );

  return filtered.map((opt) => ({
    userId: opt.userId,
    fullName: opt.fullName,
    role: opt.role,
    roleLabelFa: opt.roleLabelFa,
    schoolId: opt.schoolId,
    schoolName: opt.schoolName,
    kind: 'to',
  }));
}
