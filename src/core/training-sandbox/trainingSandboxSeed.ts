// Isolated Training Sandbox Constants, Role Profiles, Session Helpers & 100% Fictional Seed Generator
// Strict Isolation Rule: Uses ONLY fixed training-sandbox-school & training-sandbox-complex IDs.
// NEVER reads, references, or mutates any real school or complex records.
import {
  addDaysToJalali,
  getNearestActiveWorkday,
  getPersianWeekdayFromJalali,
  getTodayJalali,
} from '../../lib/jalali';
import {
  generatePhase9ASeedData,
  PHASE9A_PLUGIN_IDS,
} from '../../plugins/mock-exams/phase9ASeedData';
import {
  generatePhase9BSeedData,
  PHASE9B_PLUGIN_IDS,
} from '../../plugins/sida-analytics/phase9BSeedData';
import {
  generatePhase9CSeedData,
  PHASE9C_PLUGIN_IDS,
} from '../../services/phase9c/phase9cSeedData';
import {
  generatePhase9DSeedData,
  PHASE9D_PLUGIN_IDS,
} from '../../services/phase9d/phase9dSeedData';
import type {
  AcademicYear,
  AuthSession,
  ClassRoom,
  DailyLogEntry,
  EducationalComplex,
  GlobalSystemConfig,
  ManagedAdminAccount,
  PeriodNumber,
  PersianWeekdayIndex,
  RoleId,
  ScheduleSlot,
  School,
  SchoolPluginState,
  StaffAttendanceRecord,
  Student,
  StudentAttendanceRecord,
  SubstitutionRecord,
  Teacher,
} from '../../types/domain';
import { ensureStudentDualCredentials } from '../auth/authService';
import { generatePhase2SeedData, PHASE2_PLUGIN_IDS } from '../data/phase2SeedData';
import { generatePhase25SeedData, PHASE25_PLUGIN_IDS } from '../data/phase25SeedData';
import { generatePhase3SeedData, PHASE3_PLUGIN_IDS } from '../data/phase3SeedData';
import { generatePhase35SeedData, PHASE35_PLUGIN_IDS } from '../data/phase35SeedData';
import { generatePhase4SeedData, PHASE4_PLUGIN_IDS } from '../data/phase4SeedData';
import { generatePhase5SeedData, PHASE5_PLUGIN_IDS } from '../data/phase5SeedData';
import { generatePhase6SeedData, PHASE6_PLUGIN_IDS } from '../data/phase6SeedData';
import { generatePhase7SeedData, PHASE7_PLUGIN_IDS } from '../data/phase7SeedData';
import {
  generateStep3InitialAnnouncements,
  generateStep3InitialArchive,
  PHASE55_PLUGIN_IDS,
  type SeedDataset,
} from '../data/seedData';
import { hashPasswordSync } from '../security/cryptoService';
import { createDefaultLoginBackgroundConfig } from '../super-admin/superAdminHelpers';
import { buildValidIranianNationalId } from '../validation/validators';

export const TRAINING_SANDBOX_COMPLEX_ID = 'training-sandbox-complex';
export const TRAINING_SANDBOX_SCHOOL_ID = 'training-sandbox-school';
export const TRAINING_SANDBOX_ACADEMIC_YEAR = '1404-1405';
export const TRAINING_SANDBOX_SCHOOL_NAME = 'دبیرستان نمونه آموزشی (محیط تمرین)';
export const TRAINING_SANDBOX_COMPLEX_NAME = 'مجموعه آموزشی تمرینی (ایزوله)';

export const TRAINING_SANDBOX_STORAGE_KEY = 'golestan_training_sandbox_v1_dataset';
export const TRAINING_SANDBOX_SESSION_KEY = 'golestan_training_sandbox_v1_session';

export interface TrainingSandboxRoleOption {
  role: RoleId;
  labelFa: string;
  shortDescFa: string;
  userId: string;
  username: string;
  displayName: string;
  linkedTeacherId?: string;
  linkedStudentId?: string;
}

export const TRAINING_SANDBOX_ROLE_OPTIONS: readonly TrainingSandboxRoleOption[] = [
  {
    role: 'principal',
    labelFa: 'مدیر مدرسه',
    shortDescFa: 'مدیریت کامل مدرسه نمونه',
    userId: 'train-user-principal',
    username: 'train-principal',
    displayName: 'دکتر فرهاد آموزگار (مدیر نمونه)',
  },
  {
    role: 'deputy',
    labelFa: 'معاون',
    shortDescFa: 'انضباطی، حضور و برنامه',
    userId: 'train-user-deputy',
    username: 'train-deputy',
    displayName: 'خانم نرگس رادمنش (معاون نمونه)',
  },
  {
    role: 'teacher',
    labelFa: 'معلم',
    shortDescFa: 'کلاس، نمره، تکلیف و آزمون',
    userId: 'train-user-teacher',
    username: 'train-teacher',
    displayName: 'استاد کیانوش بهاروند (معلم نمونه)',
    linkedTeacherId: 'train-t-1',
  },
  {
    role: 'counselor',
    labelFa: 'مشاور',
    shortDescFa: 'دفتر مشاوره محرمانه',
    userId: 'train-user-counselor',
    username: 'train-counselor',
    displayName: 'دکتر مژگان صمیمی (مشاور نمونه)',
  },
  {
    role: 'parent',
    labelFa: 'ولی',
    shortDescFa: 'پرتال اولیا، کارنامه و گفتگو',
    userId: 'train-user-parent',
    username: 'train-parent',
    displayName: 'آقای حمیدرضا کاظمی (ولی آریا کاظمی)',
    linkedStudentId: 'train-st-1',
  },
  {
    role: 'student',
    labelFa: 'دانش‌آموز',
    shortDescFa: 'دروس من، آزمون و تکالیف',
    userId: 'train-user-student',
    username: 'train-student',
    displayName: 'آریا کاظمی (دانش‌آموز نمونه)',
    linkedStudentId: 'train-st-1',
  },
  {
    role: 'super_admin',
    labelFa: 'راهبر آموزشی',
    shortDescFa: 'تنظیمات کلان در محیط تمرین',
    userId: 'train-user-super-admin',
    username: 'train-admin',
    displayName: 'راهبر آموزشی (محیط تمرین)',
  },
] as const;

export function buildTrainingSandboxSession(role: RoleId): AuthSession {
  const opt =
    TRAINING_SANDBOX_ROLE_OPTIONS.find((r) => r.role === role) ??
    TRAINING_SANDBOX_ROLE_OPTIONS[0];
  return {
    userId: opt.userId,
    username: opt.username,
    displayName: opt.displayName,
    role: opt.role,
    schoolId: TRAINING_SANDBOX_SCHOOL_ID,
    complexId: TRAINING_SANDBOX_COMPLEX_ID,
    isComplexWide: opt.role === 'super_admin' || opt.role === 'complex_admin',
    isSuperAdmin: opt.role === 'super_admin',
    mustChangePassword: false,
    linkedTeacherId: opt.linkedTeacherId,
    linkedStudentId: opt.linkedStudentId,
    loggedInAt: new Date().toISOString(),
    isTrainingSandbox: true,
  };
}

export function loadTrainingSandboxSession(): AuthSession | null {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;
    const raw = window.sessionStorage.getItem(TRAINING_SANDBOX_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (
      !parsed ||
      parsed.isTrainingSandbox !== true ||
      parsed.schoolId !== TRAINING_SANDBOX_SCHOOL_ID ||
      typeof parsed.role !== 'string'
    ) {
      return null;
    }
    return buildTrainingSandboxSession(parsed.role as RoleId);
  } catch {
    return null;
  }
}

export function saveTrainingSandboxSession(session: AuthSession | null): void {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    if (!session || !session.isTrainingSandbox) {
      window.sessionStorage.removeItem(TRAINING_SANDBOX_SESSION_KEY);
      return;
    }
    window.sessionStorage.setItem(TRAINING_SANDBOX_SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore storage quota errors
  }
}

const FICTIONAL_STUDENTS: Array<{
  firstName: string;
  lastName: string;
  parentName: string;
  classIdx: number;
}> = [
  { firstName: 'آریا', lastName: 'کاظمی', parentName: 'حمیدرضا کاظمی', classIdx: 0 },
  { firstName: 'سارا', lastName: 'مهدوی', parentName: 'مهدی مهدوی', classIdx: 0 },
  { firstName: 'پارسا', lastName: 'نعمتی', parentName: 'سعید نعمتی', classIdx: 0 },
  { firstName: 'نگار', lastName: 'تهرانی', parentName: 'فریدون تهرانی', classIdx: 0 },
  { firstName: 'مانی', lastName: 'شفیعی', parentName: 'علیرضا شفیعی', classIdx: 1 },
  { firstName: 'هستی', lastName: 'کریمی', parentName: 'رضا کریمی', classIdx: 1 },
  { firstName: 'رادین', lastName: 'زارعی', parentName: 'بهرام زارعی', classIdx: 1 },
  { firstName: 'تارا', lastName: 'اکبری', parentName: 'مسعود اکبری', classIdx: 1 },
  { firstName: 'کیان', lastName: 'صفری', parentName: 'محمد صفری', classIdx: 2 },
  { firstName: 'ملیکا', lastName: 'احمدی', parentName: 'حسین احمدی', classIdx: 2 },
  { firstName: 'امیرعلی', lastName: 'یزدانی', parentName: 'جواد یزدانی', classIdx: 2 },
  { firstName: 'نیایش', lastName: 'فرهادی', parentName: 'کریم فرهادی', classIdx: 2 },
];

const ALL_TRAINING_PLUGIN_IDS = [
  'student-attendance',
  'staff-attendance',
  'substitution',
  'daily-log',
  ...PHASE2_PLUGIN_IDS,
  ...PHASE25_PLUGIN_IDS,
  ...PHASE3_PLUGIN_IDS,
  ...PHASE35_PLUGIN_IDS,
  ...PHASE4_PLUGIN_IDS,
  ...PHASE5_PLUGIN_IDS,
  ...PHASE55_PLUGIN_IDS,
  ...PHASE6_PLUGIN_IDS,
  ...PHASE7_PLUGIN_IDS,
  ...PHASE9A_PLUGIN_IDS,
  ...PHASE9B_PLUGIN_IDS,
  ...PHASE9C_PLUGIN_IDS,
  ...PHASE9D_PLUGIN_IDS,
];

/**
 * Generates a 100% isolated, purely fictional dataset for the Training Sandbox.
 * Contains ONLY 'training-sandbox-school' inside 'training-sandbox-complex'.
 */
export function generateTrainingSandboxDataset(): SeedDataset {
  const today = getTodayJalali();
  const activeDay = getNearestActiveWorkday(today, [0, 1, 2, 3, 4]);
  const prevDay = getNearestActiveWorkday(addDaysToJalali(activeDay, -1), [0, 1, 2, 3, 4]);
  const nowIso = new Date().toISOString();

  const school: School = {
    id: TRAINING_SANDBOX_SCHOOL_ID,
    schoolId: TRAINING_SANDBOX_SCHOOL_ID,
    complexId: TRAINING_SANDBOX_COMPLEX_ID,
    name: TRAINING_SANDBOX_SCHOOL_NAME,
    subtitle: 'محیط آموزشی و تمرینی ایزوله — داده‌های صرفاً مثالی',
    gradeLevel: 'elementary',
    accent: 'indigo',
    principalName: 'دکتر فرهاد آموزگار',
    principalUserId: 'train-user-principal',
    academicYear: TRAINING_SANDBOX_ACADEMIC_YEAR,
    activeWorkdays: [0, 1, 2, 3, 4],
    holidays: [],
    periodDurationMinutes: 45,
    address: 'نشانی فرضی محیط تمرین — خیابان آموزش، پلاک ۱',
    phone: '02100001000',
    letterheadTitle: TRAINING_SANDBOX_SCHOOL_NAME,
    letterheadSubtitle: 'محیط تمرینی ایزوله — داده‌های صرفاً مثالی',
    signatureFooter: 'مدیریت مدرسه نمونه آموزشی (محیط تمرین)',
    isActive: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const schools: School[] = [school];

  const classes: ClassRoom[] = [
    {
      id: 'train-cls-401',
      schoolId: TRAINING_SANDBOX_SCHOOL_ID,
      name: 'پایه چهارم - کلاس الف (نمونه)',
      gradeLevel: 4,
      section: 'الف',
      homeroomTeacherId: 'train-t-1',
      capacity: 24,
      roomCode: '101',
    },
    {
      id: 'train-cls-501',
      schoolId: TRAINING_SANDBOX_SCHOOL_ID,
      name: 'پایه پنجم - کلاس الف (نمونه)',
      gradeLevel: 5,
      section: 'الف',
      homeroomTeacherId: 'train-t-2',
      capacity: 24,
      roomCode: '102',
    },
    {
      id: 'train-cls-601',
      schoolId: TRAINING_SANDBOX_SCHOOL_ID,
      name: 'پایه ششم - کلاس الف (نمونه)',
      gradeLevel: 6,
      section: 'الف',
      homeroomTeacherId: 'train-t-3',
      capacity: 24,
      roomCode: '103',
    },
  ];

  const teacherPw = hashPasswordSync('Train@1404');
  const teachers: Teacher[] = [
    {
      id: 'train-t-1',
      schoolId: TRAINING_SANDBOX_SCHOOL_ID,
      fullName: 'استاد کیانوش بهاروند',
      nationalId: buildValidIranianNationalId('901000001'),
      personnelCode: 'TRN-201',
      mobile: '09900000101',
      specialty: 'ریاضی و هندسه',
      assignedClassIds: ['train-cls-401', 'train-cls-501'],
      weeklyQuotaPeriods: 20,
      passwordHash: teacherPw.passwordHash,
      passwordSalt: teacherPw.passwordSalt,
      mustChangePassword: false,
      active: true,
    },
    {
      id: 'train-t-2',
      schoolId: TRAINING_SANDBOX_SCHOOL_ID,
      fullName: 'خانم شبنم پرتوی',
      nationalId: buildValidIranianNationalId('901000002'),
      personnelCode: 'TRN-202',
      mobile: '09900000102',
      specialty: 'علوم تجربی',
      assignedClassIds: ['train-cls-401', 'train-cls-501', 'train-cls-601'],
      weeklyQuotaPeriods: 20,
      passwordHash: teacherPw.passwordHash,
      passwordSalt: teacherPw.passwordSalt,
      mustChangePassword: false,
      active: true,
    },
    {
      id: 'train-t-3',
      schoolId: TRAINING_SANDBOX_SCHOOL_ID,
      fullName: 'استاد بهزاد سهرابی',
      nationalId: buildValidIranianNationalId('901000003'),
      personnelCode: 'TRN-203',
      mobile: '09900000103',
      specialty: 'ادبیات فارسی',
      assignedClassIds: ['train-cls-501', 'train-cls-601'],
      weeklyQuotaPeriods: 18,
      passwordHash: teacherPw.passwordHash,
      passwordSalt: teacherPw.passwordSalt,
      mustChangePassword: false,
      active: true,
    },
    {
      id: 'train-t-4',
      schoolId: TRAINING_SANDBOX_SCHOOL_ID,
      fullName: 'خانم لیلا فرخزاد',
      nationalId: buildValidIranianNationalId('901000004'),
      personnelCode: 'TRN-204',
      mobile: '09900000104',
      specialty: 'زبان و مهارت‌های پایه',
      assignedClassIds: ['train-cls-401', 'train-cls-601'],
      weeklyQuotaPeriods: 16,
      passwordHash: teacherPw.passwordHash,
      passwordSalt: teacherPw.passwordSalt,
      mustChangePassword: false,
      active: true,
    },
  ];

  const students: Student[] = FICTIONAL_STUDENTS.map((item, idx) => {
    const cls = classes[item.classIdx];
    const natId = buildValidIranianNationalId(String(950000000 + idx));
    const parentNatId = buildValidIranianNationalId(String(960000000 + idx));
    const base: Student = {
      id: `train-st-${idx + 1}`,
      schoolId: TRAINING_SANDBOX_SCHOOL_ID,
      classId: cls.id,
      firstName: item.firstName,
      lastName: item.lastName,
      fullName: `${item.firstName} ${item.lastName}`,
      nationalId: natId,
      parentNationalId: parentNatId,
      studentCode: `TRN-${1001 + idx}`,
      parentName: item.parentName,
      parentMobile: `099011100${String(idx + 10).padStart(2, '0')}`,
      studentUsername: `st-trn-${idx + 1}`,
      parentUsername: `pr-trn-${idx + 1}`,
      studentMustChangePassword: false,
      parentMustChangePassword: false,
      active: true,
    };
    return ensureStudentDualCredentials(base);
  });

  // Schedules (Sat-Wed, 4 periods)
  const subjectsByTeacher: Record<string, string> = {
    'train-t-1': 'ریاضی',
    'train-t-2': 'علوم تجربی',
    'train-t-3': 'فارسی',
    'train-t-4': 'مطالعات و مهارت',
  };
  const schedules: ScheduleSlot[] = [];
  ([0, 1, 2, 3, 4] as PersianWeekdayIndex[]).forEach((weekday) => {
    ([1, 2, 3, 4] as PeriodNumber[]).forEach((period) => {
      classes.forEach((cls, cIdx) => {
        const teacher = teachers[(weekday + period + cIdx) % teachers.length];
        schedules.push({
          id: `train-sch-${cls.id}-${weekday}-${period}`,
          schoolId: TRAINING_SANDBOX_SCHOOL_ID,
          weekday,
          period,
          classId: cls.id,
          teacherId: teacher.id,
          subjectName: subjectsByTeacher[teacher.id] ?? 'ریاضی',
        });
      });
    });
  });

  const activeWeekday = getPersianWeekdayFromJalali(activeDay);

  // Sample Student Attendance
  const student_attendance: StudentAttendanceRecord[] = [];
  [prevDay, activeDay].forEach((day, dIdx) => {
    students.forEach((st, sIdx) => {
      const status =
        dIdx === 1 && sIdx === 2
          ? 'absent'
          : dIdx === 1 && sIdx === 5
            ? 'late'
            : dIdx === 0 && sIdx === 8
              ? 'excused'
              : 'present';
      student_attendance.push({
        id: `${TRAINING_SANDBOX_SCHOOL_ID}:${day}:${st.classId}:1:${st.id}`,
        schoolId: TRAINING_SANDBOX_SCHOOL_ID,
        jalaliDate: day,
        classId: st.classId,
        period: 1,
        studentId: st.id,
        status,
        note:
          status === 'excused'
            ? 'اطلاع ولی (مورد مثالی)'
            : status === 'late'
              ? '۱۲ دقیقه تأخیر مثالی'
              : undefined,
        recordedBy: 'deputy',
        updatedAt: nowIso,
      });
    });
  });

  // Sample Staff Attendance
  const staff_attendance: StaffAttendanceRecord[] = teachers.map((t, idx) => ({
    id: `${TRAINING_SANDBOX_SCHOOL_ID}:${activeDay}:1:${t.id}`,
    schoolId: TRAINING_SANDBOX_SCHOOL_ID,
    jalaliDate: activeDay,
    weekday: activeWeekday,
    period: 1,
    teacherId: t.id,
    status: idx === 3 ? 'excused' : 'present',
    note: idx === 3 ? 'مرخصی استعلاجی نمونه برای تمرین جایگزینی' : undefined,
    recordedBy: 'principal',
    updatedAt: nowIso,
  }));

  // Sample Substitution
  const substitutions: SubstitutionRecord[] = [
    {
      id: `${TRAINING_SANDBOX_SCHOOL_ID}:${activeDay}:2:${teachers[3].id}`,
      schoolId: TRAINING_SANDBOX_SCHOOL_ID,
      jalaliDate: activeDay,
      weekday: activeWeekday,
      period: 2,
      classId: classes[0].id,
      subjectName: 'مطالعات و مهارت',
      absentTeacherId: teachers[3].id,
      substituteTeacherId: teachers[0].id,
      reason: 'absent',
      note: 'جایگزینی نمونه محیط آموزشی',
      assignedBy: 'deputy',
      assignedAt: nowIso,
    },
  ];

  // Sample Daily Logs
  const daily_logs: DailyLogEntry[] = [
    {
      id: 'train-log-1',
      schoolId: TRAINING_SANDBOX_SCHOOL_ID,
      jalaliDate: activeDay,
      category: 'administrative',
      title: 'برگزاری کارگاه حل تمرین ریاضی (نمونه)',
      description: 'کلاس پایه چهارم نمونه تمرین فصل دوم را با مشارکت گروهی انجام داد.',
      classId: classes[0].id,
      severity: 'normal',
      recordedBy: 'deputy',
      createdAt: nowIso,
    },
    {
      id: 'train-log-2',
      schoolId: TRAINING_SANDBOX_SCHOOL_ID,
      jalaliDate: prevDay,
      category: 'administrative',
      title: 'جلسه شورای آموزشی نمونه',
      description: 'بررسی پیشرفت تحصیلی نیمسال اول در محیط تمرینی سامانه.',
      severity: 'normal',
      recordedBy: 'principal',
      createdAt: nowIso,
    },
  ];

  // Enable all add-ons inside Training Sandbox so trainees can practice every module
  const school_plugin_states: SchoolPluginState[] = Array.from(
    new Set(ALL_TRAINING_PLUGIN_IDS)
  ).map((pluginId) => ({
    id: `${TRAINING_SANDBOX_SCHOOL_ID}:${pluginId}`,
    schoolId: TRAINING_SANDBOX_SCHOOL_ID,
    pluginId,
    installed: true,
    enabled: true,
    updatedAt: nowIso,
    updatedBy: 'train-user-super-admin',
  }));

  // Fictional Educational Complex & Admin Accounts (ZERO overlap with real data)
  const educational_complexes: EducationalComplex[] = [
    {
      id: TRAINING_SANDBOX_COMPLEX_ID,
      schoolId: '__global__',
      name: TRAINING_SANDBOX_COMPLEX_NAME,
      description: 'محیط تمرینی ایزوله — بدون دسترسی به مجموعه واقعی',
      adminUserId: 'train-user-super-admin',
      createdAtJalali: today,
      isActive: true,
      updatedAt: nowIso,
    },
  ];

  const adminPw = hashPasswordSync('TrainAdmin@1404');
  const managed_admin_accounts: ManagedAdminAccount[] = [
    {
      id: 'train-user-super-admin',
      schoolId: '__global__',
      complexId: TRAINING_SANDBOX_COMPLEX_ID,
      fullName: 'راهبر آموزشی (محیط تمرین)',
      username: 'train-admin',
      passwordHash: adminPw.passwordHash,
      passwordSalt: adminPw.passwordSalt,
      mustChangePassword: false,
      role: 'super_admin',
      isActive: true,
      createdAtJalali: today,
      updatedAt: nowIso,
    },
    {
      id: 'train-user-principal',
      schoolId: TRAINING_SANDBOX_SCHOOL_ID,
      complexId: TRAINING_SANDBOX_COMPLEX_ID,
      fullName: 'دکتر فرهاد آموزگار (مدیر نمونه)',
      username: 'train-principal',
      passwordHash: adminPw.passwordHash,
      passwordSalt: adminPw.passwordSalt,
      mustChangePassword: false,
      role: 'principal',
      isActive: true,
      createdAtJalali: today,
      updatedAt: nowIso,
    },
    {
      id: 'train-user-deputy',
      schoolId: TRAINING_SANDBOX_SCHOOL_ID,
      complexId: TRAINING_SANDBOX_COMPLEX_ID,
      fullName: 'خانم نرگس رادمنش (معاون نمونه)',
      username: 'train-deputy',
      passwordHash: adminPw.passwordHash,
      passwordSalt: adminPw.passwordSalt,
      mustChangePassword: false,
      role: 'deputy',
      isActive: true,
      createdAtJalali: today,
      updatedAt: nowIso,
    },
    {
      id: 'train-user-counselor',
      schoolId: TRAINING_SANDBOX_SCHOOL_ID,
      complexId: TRAINING_SANDBOX_COMPLEX_ID,
      fullName: 'دکتر مژگان صمیمی (مشاور نمونه)',
      username: 'train-counselor',
      passwordHash: adminPw.passwordHash,
      passwordSalt: adminPw.passwordSalt,
      mustChangePassword: false,
      role: 'counselor',
      isActive: true,
      createdAtJalali: today,
      updatedAt: nowIso,
    },
  ];

  const global_system_configs: GlobalSystemConfig[] = [
    {
      id: 'global-system-config',
      schoolId: '__global__',
      labels: {},
      loginBackground: createDefaultLoginBackgroundConfig(),
      trainingSandboxEnabled: false,
      updatedAt: nowIso,
    },
  ];

  // Reuse phase seed generators strictly on the single fictional school
  const phase2 = generatePhase2SeedData({
    schools,
    classes,
    students,
    teachers,
    activeDayJalali: activeDay,
  });
  const phase25 = generatePhase25SeedData({
    schools,
    classes,
    teachers,
    activeDayJalali: activeDay,
  });
  const phase3 = generatePhase3SeedData({
    schools,
    classes,
    students,
    teachers,
    activeDayJalali: activeDay,
  });
  const phase35 = generatePhase35SeedData({ schools, classes, students, teachers });
  const phase4 = generatePhase4SeedData({ schools, classes, students, teachers });
  const phase5 = generatePhase5SeedData({
    schools,
    classes,
    students,
    teachers,
    gradebookEntries: phase2.gradebook_entries,
    existingGradeAppeals: phase2.grade_appeals,
  });
  const phase6 = generatePhase6SeedData({ schools, classes, students, teachers });
  const phase7 = generatePhase7SeedData({ schools, teachers, anchorTodayJalali: today });
  const phase9A = generatePhase9ASeedData({ schools, classes, students });
  const phase9B = generatePhase9BSeedData({ schools, classes, students });
  const phase9C = generatePhase9CSeedData({
    schools,
    classes,
    students,
    teachers,
    todayJalali: today,
  });
  const phase9D = generatePhase9DSeedData({
    schools,
    managedAdmins: managed_admin_accounts,
    teachers,
    todayJalali: today,
  });

  const trainingAcademicYears: AcademicYear[] = [
    {
      id: 'training-year-1404-1405',
      complexId: TRAINING_SANDBOX_COMPLEX_ID,
      schoolId: '__global__',
      academicYearId: TRAINING_SANDBOX_ACADEMIC_YEAR,
      code: TRAINING_SANDBOX_ACADEMIC_YEAR,
      title: 'سال تحصیلی ۱۴۰۴-۱۴۰۵ (نمونه آموزشی)',
      label: TRAINING_SANDBOX_ACADEMIC_YEAR,
      startDateJalali: '1404/07/01',
      endDateJalali: '1405/06/31',
      startJalali: '1404/07/01',
      endJalali: '1405/06/31',
      status: 'active',
      isDefault: true,
      isActive: true,
      isArchived: false,
      createdByUserId: 'train-user-super-admin',
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
    },
  ];

  const rawDataset: SeedDataset = {
    schools,
    classes,
    students,
    teachers,
    schedules,
    student_attendance,
    staff_attendance,
    substitutions,
    daily_logs,
    school_plugin_states,
    ...phase2,
    grade_appeals: [...phase5.extra_grade_appeals, ...phase2.grade_appeals],
    homework_assignments: [
      ...phase25.extra_homework_assignments,
      ...phase2.homework_assignments,
    ],
    question_bank: phase25.question_bank,
    class_chat_draft_queue: phase25.class_chat_draft_queue,
    exam_question_basket: phase25.exam_question_basket,
    ...phase3,
    ...phase35,
    ...phase4,
    sida_grade_audit_logs: phase5.sida_grade_audit_logs,
    in_person_exam_halls: phase5.in_person_exam_halls,
    in_person_exam_sessions: phase5.in_person_exam_sessions,
    exam_seating_charts: phase5.exam_seating_charts,
    student_profiles: phase5.student_profiles,
    staff_profiles: phase5.staff_profiles,
    sida_speed_entry_ticks: [],
    user_appearance_prefs: [],
    school_branding_configs: [],
    ...phase6,
    ...phase7,
    educational_complexes,
    managed_admin_accounts,
    role_governance_configs: [],
    global_system_configs,
    super_admin_audit_logs: [],
    ...phase9A,
    academic_years: trainingAcademicYears,
    ...phase9B,
    ...phase9C,
    ...phase9D,
    security_audit_logs: [],
    smart_content_archive: generateStep3InitialArchive({
      schools,
      classes,
      teachers,
      flippedLessons: phase3.flipped_lessons,
      mediaResources: phase2.media_resources,
      questionBank: phase25.question_bank,
      todayJalali: today,
    }),
    school_announcements: generateStep3InitialAnnouncements({
      schools,
      classes,
      todayJalali: today,
    }),
    student_transfer_logs: [],
    notification_read_receipts: [],
    recovery_snapshots: [],
    import_mapping_templates: [],
  };

  // Enforce strict complexId isolation on every generated item
  const normalized = {} as Record<string, unknown[]>;
  for (const [col, list] of Object.entries(rawDataset)) {
    normalized[col] = (list as Array<Record<string, unknown>>).map((item) => {
      if ('complexId' in item && item.complexId && item.complexId !== TRAINING_SANDBOX_COMPLEX_ID) {
        return { ...item, complexId: TRAINING_SANDBOX_COMPLEX_ID };
      }
      return item;
    });
  }

  return normalized as unknown as SeedDataset;
}
