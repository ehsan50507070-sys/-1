// Automated Unit Tests for Phase 9-D: Native SEO, Public Portal Validation & Office Automation
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildEducationalOrganizationSchema } from './seoHelper';
import {
  COMPLEX_GENERAL_PREREG_ID,
  filterPublicHonors,
  filterPublicNews,
  validateIranianMobile,
  validatePreRegInput,
} from './publicPortalService';
import {
  buildAllowedRecipientDirectory,
  buildOfficialLetterPrintHtml,
  canUserReferLetter,
  computeUnreadInboxLetters,
  filterLettersByCartable,
  generateIndicatorNumber,
} from './officeAutomationService';
import { authorizeMutation, type AuthGuardContext } from '../../core/auth/policy';
import type {
  AuthSession,
  ManagedAdminAccount,
  OfficeLetter,
  PublicPortalHonor,
  PublicPortalNews,
  PublicPreRegRequest,
  School,
  Teacher,
} from '../../types/domain';

const MOCK_SCHOOLS: School[] = [
  {
    id: 'school-1',
    schoolId: 'school-1',
    complexId: 'complex-1',
    name: 'دبستان گلستان راه روشن',
    subtitle: 'دوره ابتدایی',
    accent: 'indigo',
    principalName: 'محمد حسینی',
    academicYear: '1404-1405',
    gradeLevel: 'elementary',
    phone: '02188001122',
    address: 'تهران، بلوار گلستان',
    activeWorkdays: [0, 1, 2, 3, 4],
    holidays: [],
    letterheadTitle: 'دبستان گلستان راه روشن',
    letterheadSubtitle: 'مجموعه مدارس گلستان راه روشن',
    signatureFooter: 'مدیریت دبستان',
    periodDurationMinutes: 45,
    createdAt: '2025-09-01',
    updatedAt: '2025-09-01',
  },
  {
    id: 'school-2',
    schoolId: 'school-2',
    complexId: 'complex-1',
    name: 'متوسطه اول گلستان راه روشن',
    subtitle: 'دوره اول متوسطه',
    accent: 'emerald',
    principalName: 'علی کریمی',
    academicYear: '1404-1405',
    gradeLevel: 'middle',
    phone: '02188003344',
    address: 'تهران، خیابان دانش',
    activeWorkdays: [0, 1, 2, 3, 4],
    holidays: [],
    letterheadTitle: 'متوسطه اول گلستان راه روشن',
    letterheadSubtitle: 'مجموعه مدارس گلستان راه روشن',
    signatureFooter: 'مدیریت متوسطه اول',
    periodDurationMinutes: 45,
    createdAt: '2025-09-01',
    updatedAt: '2025-09-01',
  },
];

test('seoHelper builds valid EducationalOrganization JSON-LD with dynamic schools', () => {
  const schema = buildEducationalOrganizationSchema({
    description: 'توضیح سئو مجموعه',
    url: 'https://golestan.example.ir/',
    schools: MOCK_SCHOOLS,
  }) as {
    '@type': string;
    inLanguage: string;
    subOrganization: Array<{ '@type': string; name: string }>;
  };

  assert.equal(schema['@type'], 'EducationalOrganization');
  assert.equal(schema.inLanguage, 'fa-IR');
  assert.equal(schema.subOrganization.length, 2);
  assert.equal(schema.subOrganization[0]['@type'], 'School');
  assert.equal(schema.subOrganization[0].name, 'دبستان گلستان راه روشن');
});

test('publicPortalService validates Iranian mobile with Persian digits & pre-reg inputs', () => {
  const okPersian = validateIranianMobile('۰۹۱۲-۳۴۵-۶۷۸۹');
  assert.equal(okPersian.valid, true);
  assert.equal(okPersian.normalized, '09123456789');

  const badMobile = validateIranianMobile('02188776655');
  assert.equal(badMobile.valid, false);

  const validForm = validatePreRegInput({
    parentName: 'سارا محمدی',
    studentName: 'کیان محمدی',
    mobile: '۰۹۱۳۱۱۱۲۲۳۳',
    targetSchoolId: COMPLEX_GENERAL_PREREG_ID,
    gradeLabel: 'پایه هفتم (متوسطه اول)',
    message: 'لطفاً عصر تماس بگیرید',
  });
  assert.equal(validForm.valid, true);
  assert.equal(validForm.sanitized?.mobile, '09131112233');
});

test('publicPortalService filters published news & honors by school while preserving complex items', () => {
  const news: PublicPortalNews[] = [
    {
      id: 'n1',
      complexId: 'complex-1',
      schoolId: '__global__',
      academicYearId: '1404-1405',
      createdAtIso: '2025-10-01T08:00:00Z',
      updatedAtIso: '2025-10-01T08:00:00Z',
      scope: 'complex',
      title: 'خبر مجموعه',
      summary: 'خلاصه',
      body: 'متن',
      categoryLabel: 'مجموعه',
      publishedAtJalali: '1404/07/10',
      authorName: 'روابط عمومی',
      published: true,
    },
    {
      id: 'n2',
      complexId: 'complex-1',
      schoolId: 'school-1',
      academicYearId: '1404-1405',
      createdAtIso: '2025-10-02T08:00:00Z',
      updatedAtIso: '2025-10-02T08:00:00Z',
      scope: 'school',
      title: 'خبر دبستان',
      summary: 'خلاصه',
      body: 'متن',
      categoryLabel: 'دبستان',
      publishedAtJalali: '1404/07/12',
      authorName: 'مدیر دبستان',
      published: true,
    },
    {
      id: 'n3',
      complexId: 'complex-1',
      schoolId: 'school-2',
      academicYearId: '1404-1405',
      createdAtIso: '2025-10-03T08:00:00Z',
      updatedAtIso: '2025-10-03T08:00:00Z',
      scope: 'school',
      title: 'خبر پیش‌نویس مخفی',
      summary: 'خلاصه',
      body: 'متن',
      categoryLabel: 'متوسطه',
      publishedAtJalali: '1404/07/15',
      authorName: 'مدیر',
      published: false,
    },
  ];
  const filteredS1 = filterPublicNews(news, 'school-1');
  assert.equal(filteredS1.length, 2);
  const filteredS2 = filterPublicNews(news, 'school-2');
  assert.equal(filteredS2.length, 1);

  const honors: PublicPortalHonor[] = [
    {
      id: 'h1',
      complexId: 'complex-1',
      schoolId: 'school-1',
      academicYearId: '1404-1405',
      createdAtIso: '2025-10-01T08:00:00Z',
      updatedAtIso: '2025-10-01T08:00:00Z',
      scope: 'school',
      title: 'رتبه ریاضی',
      category: 'academic',
      description: 'توضیح',
      awardDateJalali: '1404/08/01',
      recipientLabel: 'تیم ریاضی',
      published: true,
    },
  ];
  assert.equal(filterPublicHonors(honors, 'school-1').length, 1);
  assert.equal(filterPublicHonors(honors, 'school-2').length, 0);
});

test('officeAutomationService generates isolated sequential indicator numbers', () => {
  const existing: OfficeLetter[] = [
    {
      id: 'l-1',
      complexId: 'complex-1',
      schoolId: 'school-1',
      academicYearId: '1404-1405',
      createdAtIso: '2025-10-01T08:00:00Z',
      updatedAtIso: '2025-10-01T08:00:00Z',
      indicatorNumber: '1404/م1/001',
      indicatorSequence: 1,
      originScope: 'school',
      letterType: 'internal_letter',
      priority: 'normal',
      confidentiality: 'normal',
      status: 'sent',
      subject: 'نامه اول',
      body: 'متن',
      senderUserId: 'adm-p1',
      senderName: 'مدیر ۱',
      senderRole: 'principal',
      senderRoleLabelFa: 'مدیر مدرسه',
      senderSchoolId: 'school-1',
      senderSchoolName: 'دبستان گلستان راه روشن',
      recipients: [],
      attachments: [],
      sentAtJalali: '1404/07/10',
      sentTimeHm: '09:00',
      readReceipts: [],
      referrals: [],
      archivedByUserIds: [],
      involvedSchoolIds: ['school-1'],
    },
  ];

  const nextSchool1 = generateIndicatorNumber({
    originScope: 'school',
    schoolId: 'school-1',
    academicYearId: '1404-1405',
    jalaliDate: '1404/08/15',
    schools: MOCK_SCHOOLS,
    existingLetters: existing,
  });
  assert.equal(nextSchool1.indicatorNumber, '1404/م1/002');
  assert.equal(nextSchool1.sequence, 2);

  const firstComplex = generateIndicatorNumber({
    originScope: 'complex',
    schoolId: '__global__',
    academicYearId: '1404-1405',
    jalaliDate: '1404/08/15',
    schools: MOCK_SCHOOLS,
    existingLetters: existing,
  });
  assert.equal(firstComplex.indicatorNumber, '1404/مجموعه/001');
  assert.equal(firstComplex.sequence, 1);
});

test('officeAutomationService enforces RBAC recipient isolation, student/parent block & confidential referral guard', () => {
  const admins: ManagedAdminAccount[] = [
    {
      id: 'adm-super',
      complexId: 'complex-1',
      schoolId: '__global__',
      fullName: 'راهبر ارشد',
      username: 'superadmin',
      role: 'super_admin',
      isActive: true,
      createdAtJalali: '1404/06/01',
      updatedAt: '2025-09-01',
    },
    {
      id: 'adm-p1',
      complexId: 'complex-1',
      schoolId: 'school-1',
      fullName: 'مدیر دبستان',
      username: 'p1',
      role: 'principal',
      isActive: true,
      createdAtJalali: '1404/06/01',
      updatedAt: '2025-09-01',
    },
    {
      id: 'adm-p2',
      complexId: 'complex-1',
      schoolId: 'school-2',
      fullName: 'مدیر متوسطه',
      username: 'p2',
      role: 'principal',
      isActive: true,
      createdAtJalali: '1404/06/01',
      updatedAt: '2025-09-01',
    },
  ];

  const teachers: Teacher[] = [
    {
      id: 't-1',
      schoolId: 'school-1',
      fullName: 'معلم دبستان',
      nationalId: '0011223344',
      personnelCode: '1001',
      mobile: '09120001111',
      specialty: 'ریاضی',
      assignedClassIds: ['class-1'],
      weeklyQuotaPeriods: 16,
      active: true,
    },
    {
      id: 't-2',
      schoolId: 'school-2',
      fullName: 'معلم متوسطه',
      nationalId: '0011223355',
      personnelCode: '1002',
      mobile: '09120002222',
      specialty: 'علوم',
      assignedClassIds: ['class-2'],
      weeklyQuotaPeriods: 16,
      active: true,
    },
  ];

  const studentSession: AuthSession = {
    userId: 'stu-1',
    username: 'student1',
    displayName: 'دانش‌آموز',
    role: 'student',
    schoolId: 'school-1',
    isComplexWide: false,
    loggedInAt: '2025-10-01',
  };
  assert.equal(
    buildAllowedRecipientDirectory({
      session: studentSession,
      schools: MOCK_SCHOOLS,
      managedAdmins: admins,
      teachers,
    }).length,
    0
  );

  const teacher1Session: AuthSession = {
    userId: 'user-teacher-t-1',
    username: 'teacher1',
    displayName: 'معلم دبستان',
    role: 'teacher',
    schoolId: 'school-1',
    isComplexWide: false,
    loggedInAt: '2025-10-01',
  };
  const teacherDir = buildAllowedRecipientDirectory({
    session: teacher1Session,
    schools: MOCK_SCHOOLS,
    managedAdmins: admins,
    teachers,
  });
  assert.deepEqual(
    teacherDir.map((d) => d.userId),
    ['adm-p1']
  );

  const confidentialLetter: OfficeLetter = {
    id: 'l-conf',
    complexId: 'complex-1',
    schoolId: 'school-1',
    academicYearId: '1404-1405',
    createdAtIso: '2025-10-01T08:00:00Z',
    updatedAtIso: '2025-10-01T08:00:00Z',
    indicatorNumber: '1404/م1/005',
    indicatorSequence: 5,
    originScope: 'school',
    letterType: 'internal_letter',
    priority: 'urgent',
    confidentiality: 'confidential',
    status: 'sent',
    subject: 'نامه محرمانه',
    body: 'متن محرمانه',
    senderUserId: 'adm-p1',
    senderName: 'مدیر دبستان',
    senderRole: 'principal',
    senderRoleLabelFa: 'مدیر مدرسه',
    senderSchoolId: 'school-1',
    senderSchoolName: 'دبستان گلستان راه روشن',
    recipients: [
      {
        userId: 'user-teacher-t-1',
        fullName: 'معلم دبستان',
        role: 'teacher',
        roleLabelFa: 'معلم',
        schoolId: 'school-1',
        schoolName: 'دبستان گلستان راه روشن',
        kind: 'to',
      },
    ],
    attachments: [],
    sentAtJalali: '1404/08/10',
    sentTimeHm: '10:30',
    readReceipts: [],
    referrals: [],
    archivedByUserIds: [],
    involvedSchoolIds: ['school-1'],
  };

  assert.equal(canUserReferLetter(confidentialLetter, teacher1Session), false);
  assert.equal(computeUnreadInboxLetters([confidentialLetter], teacher1Session).length, 1);
  assert.equal(
    filterLettersByCartable({
      letters: [confidentialLetter],
      session: teacher1Session,
      tab: 'inbox',
    }).length,
    1
  );

  const html = buildOfficialLetterPrintHtml({
    letter: confidentialLetter,
    letterheadTitle: 'دبستان گلستان راه روشن',
    letterheadSubtitle: 'مجموعه مدارس گلستان راه روشن',
  });
  assert.ok(html.includes('بسمه تعالی'));
  assert.ok(html.includes('۱۴۰۴/م۱/۰۰۵'));
  assert.ok(html.includes('محل مهر و امضا'));
});

test('RBAC policy allows public pre-registration lead without login while blocking public CMS/office mutations', () => {
  const anonGuard: AuthGuardContext = {
    session: null,
    teacherAssignedClassIds: [],
  };

  const validLead: PublicPreRegRequest = {
    id: 'prereg-test-1',
    complexId: 'complex-1',
    schoolId: 'school-1',
    academicYearId: '1404-1405',
    createdAtIso: '2025-10-01T10:00:00Z',
    updatedAtIso: '2025-10-01T10:00:00Z',
    trackingCode: 'پ‌ث-۱۴۰۴-۱۰۲۴',
    parentName: 'حسین رضایی',
    studentName: 'ماهان رضایی',
    mobile: '09121234567',
    targetSchoolId: 'school-1',
    targetSchoolName: 'دبستان گلستان راه روشن',
    gradeLabel: 'پایه سوم',
    status: 'new',
    submittedAtJalali: '1404/08/10',
    submittedAtTimeHm: '10:00',
  };

  const anonLeadDecision = authorizeMutation(
    anonGuard,
    'public_prereg_requests',
    'write',
    { schoolId: 'school-1', record: validLead }
  );
  assert.equal(anonLeadDecision.allowed, true);

  const anonNewsDecision = authorizeMutation(
    anonGuard,
    'public_portal_news',
    'write',
    { schoolId: 'school-1', record: { id: 'n-anon', schoolId: 'school-1' } }
  );
  assert.equal(anonNewsDecision.allowed, false);

  const parentGuard: AuthGuardContext = {
    session: {
      userId: 'parent-1',
      username: 'parent1',
      displayName: 'ولی',
      role: 'parent',
      schoolId: 'school-1',
      isComplexWide: false,
      loggedInAt: '2025-10-01',
    },
    teacherAssignedClassIds: [],
  };
  const parentOfficeDecision = authorizeMutation(
    parentGuard,
    'office_letters',
    'write',
    { schoolId: 'school-1', record: { id: 'l-parent', schoolId: 'school-1' } }
  );
  assert.equal(parentOfficeDecision.allowed, false);
});

