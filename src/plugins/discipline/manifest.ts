// Plugin Manifest: Discipline, Rewards & Formal Pledges (Phase 9-C)
import { lazy } from 'react';
import type { PluginManifest } from '../../core/plugins/types';

const DisciplinePage = lazy(() =>
  import('./DisciplinePage').then((m) => ({ default: m.DisciplinePage }))
);

export const disciplineManifest: PluginManifest = {
  id: 'discipline',
  nameFa: 'پرونده انضباطی، تشویق و تعهدنامه',
  shortNameFa: 'انضباط و تعهدنامه',
  descriptionFa:
    'ثبت تشویق‌ها و موارد انضباطی، محاسبه زنده نمره انضباط (از ۲۰) با نمودار روند سالانه، صدور تعهدنامه رسمی قابل چاپ و تایید دیجیتال ولی.',
  version: '9.3.0',
  phase: 9,
  category: 'operations',
  categoryLabelFa: 'امور اجرایی و تربیتی',
  iconName: 'Scale',
  isCore: false,
  defaultEnabled: true,
  route: '/discipline',
  allowedRoles: [
    'super_admin',
    'complex_admin',
    'principal',
    'deputy',
    'teacher',
    'parent',
    'student',
  ],
  dataStores: ['discipline_records', 'discipline_pledges'],
  implemented: true,
  component: DisciplinePage,
};
