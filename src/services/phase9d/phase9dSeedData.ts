// Deterministic Realistic Persian Seed Data for Phase 9-D (Public SEO Portal + Internal Office Automation)
import { addDaysToJalali } from '../../lib/jalali';
import {
  OFFICIAL_COMPLEX_NAME_FA,
  OFFICIAL_SYSTEM_NAME_FA,
} from '../../core/branding/BrandLogo';
import { DEFAULT_COMPLEX_ID, GLOBAL_TENANT_ID } from '../../core/super-admin/superAdminHelpers';
import type {
  ManagedAdminAccount,
  OfficeLetter,
  PublicPortalConfig,
  PublicPortalHonor,
  PublicPortalNews,
  PublicPreRegRequest,
  School,
  Teacher,
} from '../../types/domain';

export const PHASE9D_PLUGIN_IDS = ['public-portal-cms', 'office-automation'] as const;

export interface Phase9DSeedBundle {
  public_portal_configs: PublicPortalConfig[];
  public_portal_news: PublicPortalNews[];
  public_portal_honors: PublicPortalHonor[];
  public_prereg_requests: PublicPreRegRequest[];
  office_letters: OfficeLetter[];
}

export function generatePhase9DSeedData(params: {
  schools: School[];
  managedAdmins: ManagedAdminAccount[];
  teachers: Teacher[];
  todayJalali: string;
}): Phase9DSeedBundle {
  const { schools, managedAdmins, teachers, todayJalali } = params;
  const nowIso = new Date().toISOString();
  const academicYearId = schools[0]?.academicYear || '1404-1405';

  const complexConfig: PublicPortalConfig = {
    id: 'portal-cfg-complex',
    complexId: DEFAULT_COMPLEX_ID,
    schoolId: GLOBAL_TENANT_ID,
    academicYearId,
    scope: 'complex',
    heroTitle: 'مجموعه مدارس هوشمند گلستان راه روشن',
    heroSubtitle:
      'پیوند آموزش عمیق، تربیت متوازن و فناوری بومی مدرسه؛ از پایه اول ابتدایی تا آمادگی المپیاد و کنکور در یک سامانه یکپارچه و شفاف برای خانواده‌ها.',
    seoDescription:
      'وب‌سایت رسمی مجموعه مدارس هوشمند گلستان راه روشن — معرفی مدارس دبستان، متوسطه اول و متوسطه دوم، اخبار، افتخارات علمی و ثبت درخواست مشاوره و پیش‌ثبت‌نام.',
    introText:
      'مجموعه مدارس گلستان راه روشن با تکیه بر کادر آموزشی مجرب، ارزیابی مستمر فردمحور و ارتباط شفاف میان خانه و مدرسه، محیطی آرام، علمی و پویا را برای رشد همه‌جانبه دانش‌آموزان فراهم کرده است.',
    gradesSummary: 'دوره ابتدایی، متوسطه اول و متوسطه دوم',
    address: 'تهران، خیابان شریعتی، بلوار دانش، مجموعه آموزشی گلستان راه روشن',
    phone: '02188451200',
    workingHours: 'شنبه تا چهارشنبه · ۷:۳۰ تا ۱۵:۰۰',
    contactEmail: 'info@golestan-rahroshan.ir',
    foundedYearJalali: '1392',
    highlights: [
      'ارزیابی مستمر و کارنامه تحلیلی ماهانه با پیگیری فردی',
      'پورتال اختصاصی اولیا، معلمان و دانش‌آموزان با امنیت لایه ۱',
      'آزمایشگاه علوم، کارگاه پژوهش و کلاس‌های معکوس و آنلاین یکپارچه',
    ],
    createdByUserId: 'user-super-admin',
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
    recordVersion: 1,
    deletedAtIso: null,
    deletedByUserId: null,
    deletedByName: null,
  };

  const schoolIntroByLevel: Record<string, { intro: string; grades: string; hours: string }> = {
    elementary: {
      intro:
        'محیطی صمیمی و مهارت‌محور برای پرورش کنجکاوی علمی، خواندن و نوشتن خلاق، ریاضی مفهومی و مهارت‌های زندگی در دوره اول و دوم ابتدایی.',
      grades: 'دوره ابتدایی (پایه‌های اول تا ششم)',
      hours: 'شنبه تا چهارشنبه · ۷:۴۵ تا ۱۳:۴۵',
    },
    middle: {
      intro:
        'تقویت بنیان‌های علمی ریاضی، علوم و ادبیات همراه با کشف استعدادهای پژوهشی، کارگاه‌های آزمایشگاهی و مشاوره تحصیلی مستمر.',
      grades: 'متوسطه دوره اول (پایه‌های هفتم، هشتم و نهم)',
      hours: 'شنبه تا چهارشنبه · ۷:۳۰ تا ۱۴:۱۵',
    },
    high: {
      intro:
        'برنامه‌ریزی دقیق کنکور و امتحانات نهایی، آزمون‌های آزمایشی استاندارد با تحلیل تراز، کارگاه‌های المپیاد و مشاوره انتخاب رشته تخصصی.',
      grades: 'متوسطه دوره دوم (رشته‌های ریاضی، تجربی و انسانی)',
      hours: 'شنبه تا چهارشنبه · ۷:۳۰ تا ۱۴:۴۵',
    },
  };

  const schoolConfigs: PublicPortalConfig[] = schools.map((school) => {
    const levelKey = school.gradeLevel ?? 'elementary';
    const preset = schoolIntroByLevel[levelKey] ?? schoolIntroByLevel.elementary;
    return {
      id: `portal-cfg-${school.id}`,
      complexId: school.complexId ?? DEFAULT_COMPLEX_ID,
      schoolId: school.id,
      academicYearId: school.academicYear || academicYearId,
      scope: 'school',
      introText: preset.intro,
      gradesSummary: preset.grades,
      address: school.address || complexConfig.address,
      phone: school.phone || complexConfig.phone,
      workingHours: preset.hours,
      createdByUserId: 'user-super-admin',
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
      recordVersion: 1,
      deletedAtIso: null,
      deletedByUserId: null,
      deletedByName: null,
    };
  });

  const s1 = schools[0];
  const s2 = schools[1];
  const s3 = schools[2];

  const public_portal_news: PublicPortalNews[] = [
    {
      id: 'pnews-complex-1',
      complexId: DEFAULT_COMPLEX_ID,
      schoolId: GLOBAL_TENANT_ID,
      academicYearId,
      scope: 'complex',
      title: 'آغاز زمان‌بندی جلسات مشاوره و پیش‌ثبت‌نام سال تحصیلی آینده در سه واحد مجموعه',
      summary:
        'خانواده‌های گرامی می‌توانند از طریق فرم درخواست مشاوره در همین صفحه، نوبت بازدید حضوری و ارزیابی آموزشی را برای هر سه مقطع رزرو نمایند.',
      body:
        'به اطلاع خانواده‌های ارجمند می‌رساند فرآیند ثبت درخواست مشاوره و پیش‌ثبت‌نام سال تحصیلی جدید در هر سه واحد دبستان، متوسطه اول و متوسطه دوم گلستان راه روشن آغاز شده است.\nپس از ثبت درخواست در بخش «درخواست مشاوره و پیش‌ثبت‌نام»، همکاران دفتر پذیرش مدرسه منتخب ظرف ۴۸ ساعت کاری جهت هماهنگی جلسه آشنایی با فضای آموزشی و برنامه درسی با شما تماس خواهند گرفت.',
      categoryLabel: 'اطلاعیه پذیرش',
      publishedAtJalali: addDaysToJalali(todayJalali, -1),
      authorName: 'روابط عمومی مجموعه مدارس گلستان راه روشن',
      published: true,
      pinned: true,
      createdByUserId: 'user-super-admin',
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
      recordVersion: 1,
      deletedAtIso: null,
      deletedByUserId: null,
      deletedByName: null,
    },
    ...(s1
      ? [
          {
            id: 'pnews-school-1',
            complexId: s1.complexId ?? DEFAULT_COMPLEX_ID,
            schoolId: s1.id,
            academicYearId: s1.academicYear || academicYearId,
            scope: 'school' as const,
            title: 'برگزاری جشنواره «دست‌ورزی علوم و کتاب‌خوانی خلاق» در دبستان',
            summary:
              'دانش‌آموزان پایه‌های دوم تا ششم آزمایش‌های ساده علمی و نمایشگاه کتابچه‌های دست‌ساز خود را با حضور اولیا ارائه کردند.',
            body:
              'جشنواره فصلی دست‌ورزی علوم و کتاب‌خوانی خلاق با مشارکت بیش از ۹۰ درصد دانش‌آموزان دبستان گلستان راه روشن برگزار شد.\nدر این برنامه هر کلاس یک ایستگاه آزمایش عملی بر پایه مفاهیم کتاب علوم تجربی آماده کرده بود و دانش‌آموزان به‌صورت گروهی یافته‌های خود را برای والدین و داوران توضیح دادند.',
            categoryLabel: 'رویداد آموزشی',
            publishedAtJalali: addDaysToJalali(todayJalali, -3),
            authorName: `مدیریت ${s1.name}`,
            published: true,
            pinned: false,
            createdByUserId: `user-principal-${s1.id}`,
            createdAtIso: nowIso,
            updatedAtIso: nowIso,
            recordVersion: 1,
            deletedAtIso: null,
            deletedByUserId: null,
            deletedByName: null,
          },
        ]
      : []),
    ...(s2
      ? [
          {
            id: 'pnews-school-2',
            complexId: s2.complexId ?? DEFAULT_COMPLEX_ID,
            schoolId: s2.id,
            academicYearId: s2.academicYear || academicYearId,
            scope: 'school' as const,
            title: 'راه‌اندازی کارگاه‌های حل مسئله و رباتیک دانش‌آموزی متوسطه اول',
            summary:
              'دوره‌های مهارتی تفکر الگوریتمی و آزمایشگاه رباتیک ویژه پایه‌های هفتم تا نهم در نوبت بعدازظهر آغاز به کار کرد.',
            body:
              'با هدف تقویت مهارت تحلیل و کار تیمی، کارگاه‌های تفکر الگوریتمی و رباتیک آموزشی در متوسطه اول گلستان راه روشن راه‌اندازی شد.\nگزارش پیشرفت هر پروژه به‌صورت مستمر در پرونده الکترونیک دانش‌آموزان ثبت می‌شود و در نمایشگاه پایان ترم به داوری گذاشته خواهد شد.',
            categoryLabel: 'پژوهش و فناوری',
            publishedAtJalali: addDaysToJalali(todayJalali, -5),
            authorName: `مدیریت ${s2.name}`,
            published: true,
            pinned: false,
            createdByUserId: `user-principal-${s2.id}`,
            createdAtIso: nowIso,
            updatedAtIso: nowIso,
            recordVersion: 1,
            deletedAtIso: null,
            deletedByUserId: null,
            deletedByName: null,
          },
        ]
      : []),
    ...(s3
      ? [
          {
            id: 'pnews-school-3',
            complexId: s3.complexId ?? DEFAULT_COMPLEX_ID,
            schoolId: s3.id,
            academicYearId: s3.academicYear || academicYearId,
            scope: 'school' as const,
            title: 'برگزاری کارگاه تخصصی تحلیل کارنامه آزمون‌های آزمایشی و برنامه‌ریزی امتحانات نهایی',
            summary:
              'مشاوران تحصیلی متوسطه دوم راهکارهای ارتقای تراز و مدیریت زمان آزمون را با دانش‌آموزان و اولیا مرور کردند.',
            body:
              'در نشست تخصصی تحلیل عملکرد نیم‌سال، داده‌های تحلیلی آزمون‌های آزمایشی و نمرات مستمر دانش‌آموزان متوسطه دوم بررسی شد و الگوی برنامه‌ریزی هفتگی منطبق بر بودجه‌بندی امتحانات نهایی و کنکور در اختیار دانش‌آموزان قرار گرفت.',
            categoryLabel: 'مشاوره و کنکور',
            publishedAtJalali: addDaysToJalali(todayJalali, -2),
            authorName: `مدیریت ${s3.name}`,
            published: true,
            pinned: false,
            createdByUserId: `user-principal-${s3.id}`,
            createdAtIso: nowIso,
            updatedAtIso: nowIso,
            recordVersion: 1,
            deletedAtIso: null,
            deletedByUserId: null,
            deletedByName: null,
          },
        ]
      : []),
  ];

  const public_portal_honors: PublicPortalHonor[] = [
    {
      id: 'phonor-complex-1',
      complexId: DEFAULT_COMPLEX_ID,
      schoolId: GLOBAL_TENANT_ID,
      academicYearId,
      scope: 'complex',
      title: 'انتخاب مجموعه مدارس گلستان راه روشن به‌عنوان واحد برتر هوشمندسازی و ارتباط اولیا',
      category: 'educational',
      description:
        'کسب رتبه ممتاز منطقه‌ای در پیاده‌سازی ارزیابی مستمر شفاف، پرونده الکترونیک یکپارچه و تعامل منظم اولیا و مربیان.',
      awardDateJalali: addDaysToJalali(todayJalali, -14),
      recipientLabel: OFFICIAL_COMPLEX_NAME_FA,
      rankLabel: 'رتبه ممتاز منطقه‌ای',
      published: true,
      createdByUserId: 'user-super-admin',
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
      recordVersion: 1,
      deletedAtIso: null,
      deletedByUserId: null,
      deletedByName: null,
    },
    ...(s1
      ? [
          {
            id: 'phonor-school-1',
            complexId: s1.complexId ?? DEFAULT_COMPLEX_ID,
            schoolId: s1.id,
            academicYearId: s1.academicYear || academicYearId,
            scope: 'school' as const,
            title: 'کسب ۳ مدال طلا و نقره در جشنواره جابربن‌حیان دوره ابتدایی',
            category: 'research' as const,
            description:
              'پروژه‌های آزمایشگاهی انرژی خورشیدی و تصفیه آب دانش‌آموزان پایه پنجم و ششم موفق به راه‌یابی به مرحله استانی شدند.',
            awardDateJalali: addDaysToJalali(todayJalali, -9),
            recipientLabel: `تیم پژوهشی ${s1.name}`,
            rankLabel: 'برگزیده استانی',
            published: true,
            createdByUserId: `user-principal-${s1.id}`,
            createdAtIso: nowIso,
            updatedAtIso: nowIso,
            recordVersion: 1,
            deletedAtIso: null,
            deletedByUserId: null,
            deletedByName: null,
          },
        ]
      : []),
    ...(s2
      ? [
          {
            id: 'phonor-school-2',
            complexId: s2.complexId ?? DEFAULT_COMPLEX_ID,
            schoolId: s2.id,
            academicYearId: s2.academicYear || academicYearId,
            scope: 'school' as const,
            title: 'راه‌یابی ۶ دانش‌آموز پایه هشتم و نهم به مرحله دوم مسابقه ریاضی کانگورو و خوارزمی',
            category: 'academic' as const,
            description:
              'درخشش دانش‌آموزان دوره اول متوسطه در محورهای حل مسئله، آزمایشگاه علوم و ادبیات نوجوان.',
            awardDateJalali: addDaysToJalali(todayJalali, -7),
            recipientLabel: `دانش‌آموزان برتر ${s2.name}`,
            rankLabel: 'رتبه اول منطقه',
            published: true,
            createdByUserId: `user-principal-${s2.id}`,
            createdAtIso: nowIso,
            updatedAtIso: nowIso,
            recordVersion: 1,
            deletedAtIso: null,
            deletedByUserId: null,
            deletedByName: null,
          },
        ]
      : []),
    ...(s3
      ? [
          {
            id: 'phonor-school-3',
            complexId: s3.complexId ?? DEFAULT_COMPLEX_ID,
            schoolId: s3.id,
            academicYearId: s3.academicYear || academicYearId,
            scope: 'school' as const,
            title: 'کسب ۲ مدال نقره المپیاد ریاضی و فیزیک و میانگین معدل بالای ۱۸/۷ در امتحانات نهایی',
            category: 'academic' as const,
            description:
              'ثمره برنامه‌ریزی منظم آزمون‌های آزمایشی تحلیلی، کلاس‌های تقویتی هدفمند و همراهی مستمر مشاوران پایه.',
            awardDateJalali: addDaysToJalali(todayJalali, -4),
            recipientLabel: `تیم المپیاد و فارغ‌التحصیلان ${s3.name}`,
            rankLabel: 'مدال نقره کشوری',
            published: true,
            createdByUserId: `user-principal-${s3.id}`,
            createdAtIso: nowIso,
            updatedAtIso: nowIso,
            recordVersion: 1,
            deletedAtIso: null,
            deletedByUserId: null,
            deletedByName: null,
          },
        ]
      : []),
  ];

  const public_prereg_requests: PublicPreRegRequest[] = [
    ...(s1
      ? [
          {
            id: 'prereg-seed-1',
            complexId: s1.complexId ?? DEFAULT_COMPLEX_ID,
            schoolId: s1.id,
            academicYearId: s1.academicYear || academicYearId,
            trackingCode: 'پ‌ث-۱۴۰۴-۱۰۲۴',
            parentName: 'مهندس سعید محمودی',
            studentName: 'رادمهر محمودی',
            mobile: '09124457812',
            targetSchoolId: s1.id,
            targetSchoolName: s1.name,
            gradeLabel: 'پایه سوم',
            message: 'متقاضی بازدید حضوری و دریافت اطلاعات سرویس مدرسه و برنامه فوق‌برنامه هستم.',
            status: 'new' as const,
            submittedAtJalali: addDaysToJalali(todayJalali, -1),
            submittedAtTimeHm: '10:25',
            createdByUserId: 'public_visitor',
            createdAtIso: nowIso,
            updatedAtIso: nowIso,
            recordVersion: 1,
            deletedAtIso: null,
            deletedByUserId: null,
            deletedByName: null,
          },
        ]
      : []),
    ...(s2
      ? [
          {
            id: 'prereg-seed-2',
            complexId: s2.complexId ?? DEFAULT_COMPLEX_ID,
            schoolId: s2.id,
            academicYearId: s2.academicYear || academicYearId,
            trackingCode: 'پ‌ث-۱۴۰۴-۱۰۱۹',
            parentName: 'دکتر مریم حسینی',
            studentName: 'کیان حسینی',
            mobile: '09127789034',
            targetSchoolId: s2.id,
            targetSchoolName: s2.name,
            gradeLabel: 'پایه هفتم',
            message: 'درخواست وقت مشاوره جهت آشنایی با کلاس‌های پژوهش و المپیاد ریاضی.',
            status: 'contacted' as const,
            submittedAtJalali: addDaysToJalali(todayJalali, -4),
            submittedAtTimeHm: '14:10',
            staffNote: 'تماس گرفته شد؛ جلسه بازدید روز دوشنبه ساعت ۱۰ هماهنگ گردید.',
            handledByName: s2.principalName,
            handledAtJalali: addDaysToJalali(todayJalali, -3),
            createdByUserId: 'public_visitor',
            createdAtIso: nowIso,
            updatedAtIso: nowIso,
            recordVersion: 1,
            deletedAtIso: null,
            deletedByUserId: null,
            deletedByName: null,
          },
        ]
      : []),
  ];

  // Build realistic Persian Office Automation Letters & Directives using actual seeded accounts
  const superAdminAcc = managedAdmins.find((a) => a.role === 'super_admin');
  const principal1Acc = s1
    ? managedAdmins.find((a) => a.role === 'principal' && a.schoolId === s1.id)
    : undefined;
  const principal2Acc = s2
    ? managedAdmins.find((a) => a.role === 'principal' && a.schoolId === s2.id)
    : undefined;
  const principal3Acc = s3
    ? managedAdmins.find((a) => a.role === 'principal' && a.schoolId === s3.id)
    : undefined;
  const deputy1Acc = s1
    ? managedAdmins.find((a) => a.role === 'deputy' && a.schoolId === s1.id)
    : undefined;
  const teacher1 = s1 ? teachers.find((t) => t.schoolId === s1.id && t.active) : undefined;

  const office_letters: OfficeLetter[] = [];

  // 1. Complex-wide Directive from Super Admin to all 3 Principals (partial read receipts!)
  if (superAdminAcc && s1) {
    const principalRecipients = [
      principal1Acc && s1
        ? {
            userId: principal1Acc.id,
            fullName: principal1Acc.fullName,
            role: 'principal' as const,
            roleLabelFa: 'مدیر مدرسه',
            schoolId: s1.id,
            schoolName: s1.name,
            kind: 'to' as const,
          }
        : null,
      principal2Acc && s2
        ? {
            userId: principal2Acc.id,
            fullName: principal2Acc.fullName,
            role: 'principal' as const,
            roleLabelFa: 'مدیر مدرسه',
            schoolId: s2.id,
            schoolName: s2.name,
            kind: 'to' as const,
          }
        : null,
      principal3Acc && s3
        ? {
            userId: principal3Acc.id,
            fullName: principal3Acc.fullName,
            role: 'principal' as const,
            roleLabelFa: 'مدیر مدرسه',
            schoolId: s3.id,
            schoolName: s3.name,
            kind: 'to' as const,
          }
        : null,
    ].filter((x): x is NonNullable<typeof x> => x !== null);

    const sentDate1 = addDaysToJalali(todayJalali, -2);
    office_letters.push({
      id: 'olet-directive-complex-1',
      complexId: DEFAULT_COMPLEX_ID,
      schoolId: GLOBAL_TENANT_ID,
      academicYearId,
      indicatorNumber: '1404/مجموعه/001',
      indicatorSequence: 1,
      originScope: 'complex',
      letterType: 'directive',
      priority: 'urgent',
      confidentiality: 'normal',
      status: 'sent',
      subject: 'شیوه‌نامه هماهنگی ارزشیابی مستمر، کارنامه ماهانه و تکمیل پرونده الکترونیک نیم‌سال',
      body:
        'مدیران محترم مدارس مجموعه گلستان راه روشن؛\nبا توجه به نزدیک شدن به پایان ماه جاری و ضرورت ارائه گزارش تحلیلی شفاف به خانواده‌ها، خواهشمند است دستور فرمایید حداکثر تا پایان هفته آینده موارد زیر در تمامی پایه‌ها نهایی شود:\n۱. ثبت کامل نمرات ارزشیابی مستمر در دفتر نمره هوشمند و تطبیق آن با بودجه‌بندی دروس.\n۲. بررسی و پاسخ‌گویی به کلیه پیام‌های دریافتی اولیا و درخواست‌های مشاوره پیش‌ثبت‌نام.\n۳. ارسال گزارش خلاصه فعالیت‌های پرورشی و افتخارات واحد جهت درج در پورتال عمومی مجموعه.',
      senderUserId: superAdminAcc.id,
      senderName: superAdminAcc.fullName,
      senderRole: 'super_admin',
      senderRoleLabelFa: 'راهبر ارشد سامانه',
      senderSchoolId: GLOBAL_TENANT_ID,
      senderSchoolName: OFFICIAL_SYSTEM_NAME_FA,
      recipients: principalRecipients,
      attachments: [
        {
          id: 'att-dir-1',
          title: 'چک‌لیست کنترل کیفیت آموزشی نیم‌سال (نسخه ۲)',
          description: 'فهرست ۱۲ شاخص کلیدی ارزیابی کلاس‌ها',
        },
      ],
      sentAtIso: nowIso,
      sentAtJalali: sentDate1,
      sentTimeHm: '09:15',
      // Principal 2 has already read & acknowledged; Principal 1 & 3 remain unread so badge shows live!
      readReceipts: principal2Acc
        ? [
            {
              userId: principal2Acc.id,
              fullName: principal2Acc.fullName,
              roleLabelFa: 'مدیر مدرسه',
              firstReadAtIso: nowIso,
              firstReadAtJalali: sentDate1,
              firstReadTimeHm: '10:42',
              acknowledgedAtIso: nowIso,
              acknowledgedAtJalali: sentDate1,
              acknowledgedTimeHm: '10:45',
            },
          ]
        : [],
      referrals: [],
      archivedByUserIds: [],
      involvedSchoolIds: schools.map((s) => s.id),
      createdByUserId: superAdminAcc.id,
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
      recordVersion: 1,
      deletedAtIso: null,
      deletedByUserId: null,
      deletedByName: null,
    });
  }

  // 2. Internal School Letter from Principal 1 to Deputy 1 with active Referral (هامش‌نویسی) to Teacher 1
  if (s1 && principal1Acc && deputy1Acc) {
    const sentDate2 = addDaysToJalali(todayJalali, -1);
    office_letters.push({
      id: 'olet-school1-internal-1',
      complexId: s1.complexId ?? DEFAULT_COMPLEX_ID,
      schoolId: s1.id,
      academicYearId: s1.academicYear || academicYearId,
      indicatorNumber: '1404/م1/001',
      indicatorSequence: 1,
      originScope: 'school',
      letterType: 'internal_letter',
      priority: 'normal',
      confidentiality: 'normal',
      status: 'sent',
      subject: 'هماهنگی برگزاری جلسه شورای معلمان و بررسی پیشرفت کلاس‌های پایه پنجم و ششم',
      body:
        'همکار گرامی؛\nلطفاً دستور جلسه شورای آموزشی هفته آینده را با محوریت بررسی نتایج آزمون‌های مستمر ریاضی و علوم، وضعیت حضور و غیاب دانش‌آموزان و برنامه‌ریزی اردوهای علمی آماده فرمایید.\nنتیجه جمع‌بندی پیش از روز سه‌شنبه جهت اطلاع و تصویب به دفتر مدیریت ارسال گردد.',
      senderUserId: principal1Acc.id,
      senderName: principal1Acc.fullName,
      senderRole: 'principal',
      senderRoleLabelFa: 'مدیر مدرسه',
      senderSchoolId: s1.id,
      senderSchoolName: s1.name,
      recipients: [
        {
          userId: deputy1Acc.id,
          fullName: deputy1Acc.fullName,
          role: 'deputy',
          roleLabelFa: 'معاون مدرسه',
          schoolId: s1.id,
          schoolName: s1.name,
          kind: 'to',
        },
        ...(superAdminAcc
          ? [
              {
                userId: superAdminAcc.id,
                fullName: superAdminAcc.fullName,
                role: 'super_admin' as const,
                roleLabelFa: 'راهبر ارشد سامانه',
                schoolId: GLOBAL_TENANT_ID,
                schoolName: OFFICIAL_COMPLEX_NAME_FA,
                kind: 'cc' as const,
              },
            ]
          : []),
      ],
      attachments: [
        {
          id: 'att-s1-1',
          title: 'فرم گزارش وضعیت درسی کلاس‌ها',
          description: 'جدول شاخص‌های کیفی نیم‌سال',
        },
      ],
      sentAtIso: nowIso,
      sentAtJalali: sentDate2,
      sentTimeHm: '11:20',
      readReceipts: [
        {
          userId: deputy1Acc.id,
          fullName: deputy1Acc.fullName,
          roleLabelFa: 'معاون مدرسه',
          firstReadAtIso: nowIso,
          firstReadAtJalali: sentDate2,
          firstReadTimeHm: '11:50',
        },
      ],
      referrals: teacher1
        ? [
            {
              id: 'ref-s1-1',
              fromUserId: deputy1Acc.id,
              fromName: deputy1Acc.fullName,
              fromRoleLabelFa: 'معاون مدرسه',
              toUserId: `user-teacher-${teacher1.id}`,
              toName: teacher1.fullName,
              toRoleLabelFa: 'معلم',
              toSchoolId: s1.id,
              note: 'استاد گرامی، لطفاً لیست دانش‌آموزان نیازمند کلاس تقویتی ریاضی را تا فردا ظهر جهت طرح در شورا ارسال بفرمایید.',
              referredAtIso: nowIso,
              referredAtJalali: sentDate2,
              referredTimeHm: '12:05',
            },
          ]
        : [],
      archivedByUserIds: [],
      involvedSchoolIds: [s1.id],
      createdByUserId: principal1Acc.id,
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
      recordVersion: 1,
      deletedAtIso: null,
      deletedByUserId: null,
      deletedByName: null,
    });
  }

  // 3. Administrative Request from Teacher 1 to Principal 1 (cites reference / عطف به)
  if (s1 && principal1Acc && teacher1) {
    office_letters.push({
      id: 'olet-school1-request-1',
      complexId: s1.complexId ?? DEFAULT_COMPLEX_ID,
      schoolId: s1.id,
      academicYearId: s1.academicYear || academicYearId,
      indicatorNumber: '1404/م1/002',
      indicatorSequence: 2,
      originScope: 'school',
      letterType: 'admin_request',
      priority: 'urgent',
      confidentiality: 'normal',
      status: 'sent',
      subject: 'درخواست تأمین تجهیزات آزمایشگاهی علوم و رزرو سالن همایش برای ارائه پروژه‌ها',
      body:
        'مدیریت محترم دبستان گلستان راه روشن؛\nعطف به برنامه‌ریزی جشنواره دست‌ورزی علوم، جهت اجرای ایمن آزمایش‌های دانش‌آموزان پایه‌های پنجم و ششم، تقاضای تأمین اقلام مصرفی آزمایشگاه و رزرو سالن همایش مدرسه برای روز چهارشنبه ساعت ۱۰ الی ۱۲ را دارم.\nپیشاپیش از همکاری و مساعدت جنابعالی سپاسگزارم.',
      senderUserId: `user-teacher-${teacher1.id}`,
      senderName: teacher1.fullName,
      senderRole: 'teacher',
      senderRoleLabelFa: 'معلم',
      senderSchoolId: s1.id,
      senderSchoolName: s1.name,
      recipients: [
        {
          userId: principal1Acc.id,
          fullName: principal1Acc.fullName,
          role: 'principal',
          roleLabelFa: 'مدیر مدرسه',
          schoolId: s1.id,
          schoolName: s1.name,
          kind: 'to',
        },
        ...(deputy1Acc
          ? [
              {
                userId: deputy1Acc.id,
                fullName: deputy1Acc.fullName,
                role: 'deputy' as const,
                roleLabelFa: 'معاون مدرسه',
                schoolId: s1.id,
                schoolName: s1.name,
                kind: 'cc' as const,
              },
            ]
          : []),
      ],
      attachments: [
        {
          id: 'att-req-1',
          title: 'فهرست اقلام آزمایشگاهی مورد نیاز',
          description: 'شامل ۶ قلم کیت آموزشی ایمن',
        },
      ],
      referenceLetterId: 'olet-school1-internal-1',
      referenceIndicatorNumber: '1404/م1/001',
      referenceSubject: 'هماهنگی برگزاری جلسه شورای معلمان و بررسی پیشرفت کلاس‌های پایه پنجم و ششم',
      sentAtIso: nowIso,
      sentAtJalali: todayJalali,
      sentTimeHm: '08:40',
      readReceipts: [],
      referrals: [],
      archivedByUserIds: [],
      involvedSchoolIds: [s1.id],
      createdByUserId: `user-teacher-${teacher1.id}`,
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
      recordVersion: 1,
      deletedAtIso: null,
      deletedByUserId: null,
      deletedByName: null,
    });
  }

  return {
    public_portal_configs: [complexConfig, ...schoolConfigs],
    public_portal_news,
    public_portal_honors,
    public_prereg_requests,
    office_letters,
  };
}
