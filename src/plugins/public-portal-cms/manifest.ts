// Phase 9-D Plugin Manifest: Public Portal CMS & Pre-Registration Management
import { lazy } from 'react';
import type { PluginManifest } from '../../core/plugins/types';

const PublicPortalCmsPage = lazy(() =>
  import('./PublicPortalCmsPage').then((m) => ({ default: m.PublicPortalCmsPage }))
);

export const publicPortalCmsManifest: PluginManifest = {
  id: 'public-portal-cms',
  nameFa: 'مدیریت پورتال عمومی و پیش‌ثبت‌نام',
  shortNameFa: 'پورتال عمومی و سئو',
  descriptionFa:
    'مدیریت محتوای صفحه اصلی عمومی، تنظیمات سئو، معرفی مدارس مجموعه، انتشار اخبار و افتخارات و پیگیری درخواست‌های پیش‌ثبت‌نام اولیا.',
  version: '9.4.0',
  phase: 9,
  category: 'communication',
  categoryLabelFa: 'اطلاع‌رسانی و ارتباطات',
  iconName: 'Globe',
  isCore: false,
  defaultEnabled: true,
  route: '/public-portal-cms',
  allowedRoles: ['super_admin', 'principal'],
  dataStores: [
    'public_portal_configs',
    'public_portal_news',
    'public_portal_honors',
    'public_prereg_requests',
  ],
  implemented: true,
  component: PublicPortalCmsPage,
};
