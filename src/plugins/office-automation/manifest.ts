// Phase 9-D Plugin Manifest: Internal Office Automation & Formal Correspondence
import { lazy } from 'react';
import type { PluginManifest } from '../../core/plugins/types';

const OfficeAutomationPage = lazy(() =>
  import('./OfficeAutomationPage').then((m) => ({ default: m.OfficeAutomationPage }))
);

export const officeAutomationManifest: PluginManifest = {
  id: 'office-automation',
  nameFa: 'اتوماسیون اداری و مکاتبات داخلی',
  shortNameFa: 'اتوماسیون اداری',
  descriptionFa:
    'مکاتبات رسمی و بخشنامه‌های درون‌سازمانی با شماره‌گذاری خودکار اندیکاتور، کارتابل ۵بخشی، ارجاع (هامش‌نویسی)، رسید مشاهده و چاپ رسمی روی سربرگ مدرسه.',
  version: '9.4.0',
  phase: 9,
  category: 'operations',
  categoryLabelFa: 'امور اداری و اجرایی',
  iconName: 'Mail',
  isCore: false,
  defaultEnabled: true,
  route: '/office-automation',
  allowedRoles: ['super_admin', 'complex_admin', 'principal', 'deputy', 'counselor', 'teacher'],
  dataStores: ['office_letters'],
  implemented: true,
  component: OfficeAutomationPage,
};
