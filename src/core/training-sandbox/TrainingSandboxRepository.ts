// Completely Isolated Training Sandbox Repository (sessionStorage-backed)
// Implements IDataRepository with ZERO access to production IndexedDB or localStorage.
import { getTodayJalali } from '../../lib/jalali';
import type {
  BackupPayload,
  CollectionName,
  CollectionTypeMap,
  DailyRollingSnapshot,
  MigrationVaultMeta,
  PanicModeState,
  School,
  SecurityAuditLogEntry,
  SoftDeletedRecordEntry,
} from '../../types/domain';
import type { AuthGuardContext } from '../auth/policy';
import type {
  IDataRepository,
  RepositoryChangeEvent,
  RepositoryChangeListener,
  StorageBackendMode,
} from '../data/repository';
import type { SeedDataset } from '../data/seedData';
import {
  DEFAULT_PANIC_MODE_STATE,
  extractRecordDisplayTitle,
  getCollectionLabelFa,
  isRecordSoftDeleted,
  sealAuditEntrySync,
} from '../security/DataIntegrityGuard';
import { CURRENT_SCHEMA_VERSION } from '../storage/MigrationEngine';
import {
  generateTrainingSandboxDataset,
  TRAINING_SANDBOX_SCHOOL_ID,
  TRAINING_SANDBOX_STORAGE_KEY,
} from './trainingSandboxSeed';

const SANDBOX_COLLECTIONS: readonly CollectionName[] = [
  'schools',
  'classes',
  'students',
  'teachers',
  'schedules',
  'student_attendance',
  'staff_attendance',
  'substitutions',
  'daily_logs',
  'school_plugin_states',
  'curriculum_topics',
  'media_resources',
  'chat_outbox',
  'gradebook_entries',
  'lesson_plans',
  'gradebook_weights',
  'grade_appeals',
  'homework_assignments',
  'homework_submissions',
  'student_rewards',
  'question_bank',
  'class_chat_draft_queue',
  'exam_question_basket',
  'flipped_lessons',
  'flipped_telemetry',
  'flipped_questions',
  'online_class_sessions',
  'online_class_attendance',
  'online_exams',
  'online_exam_submissions',
  'student_360_signals',
  'parent_staff_messages',
  'class_chat_rooms',
  'class_chat_messages',
  'appointment_slots',
  'electronic_forms',
  'electronic_form_responses',
  'notification_templates',
  'sida_grade_audit_logs',
  'in_person_exam_halls',
  'in_person_exam_sessions',
  'exam_seating_charts',
  'student_profiles',
  'staff_profiles',
  'sida_speed_entry_ticks',
  'user_appearance_prefs',
  'school_branding_configs',
  'finance_fee_plans',
  'finance_student_ledgers',
  'finance_payments',
  'finance_expenses',
  'remedial_plans',
  'anonymous_surveys',
  'survey_participation_receipts',
  'survey_anonymous_responses',
  'td_courses',
  'td_progress',
  'td_certificates',
  'td_school_settings',
  'educational_complexes',
  'managed_admin_accounts',
  'role_governance_configs',
  'global_system_configs',
  'super_admin_audit_logs',
  'academic_years',
  'mock_exams',
  'mock_exam_attempts',
  'sida_appeal_windows',
  'sida_remedial_groups',
  'sida_class_balancing_drafts',
  'sida_analytics_grades',
  'security_audit_logs',
  'smart_content_archive',
  'school_announcements',
  'student_transfer_logs',
  'notification_read_receipts',
  'recovery_snapshots',
  'import_mapping_templates',
  'discipline_records',
  'discipline_pledges',
  'student_exit_passes',
  'staff_leave_requests',
  'counseling_sessions',
  'counseling_clinical_notes',
  'virtual_class_sessions',
  'virtual_class_attendance',
  'public_portal_configs',
  'public_portal_news',
  'public_portal_honors',
  'public_prereg_requests',
  'office_letters',
] as const;

export class TrainingSandboxRepository implements IDataRepository {
  public readonly backendMode: StorageBackendMode = 'memory';
  public readonly schemaVersion: number = CURRENT_SCHEMA_VERSION;

  private cache: SeedDataset | null = null;
  private authContext: AuthGuardContext | null = null;
  private listeners = new Set<RepositoryChangeListener>();
  private readonly tabId = `sandbox_${Math.random().toString(36).slice(2, 9)}`;
  private panicState: PanicModeState = { ...DEFAULT_PANIC_MODE_STATE };
  private vaultMeta: MigrationVaultMeta = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    history: [],
  };
  private rollingSnapshots: DailyRollingSnapshot[] = [];
  private preMigrationSnap: string | null = null;

  private ensureCache(): SeedDataset {
    if (this.cache) return this.cache;
    // Try hydrating from isolated sessionStorage (auto-clears on browser tab close)
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const raw = window.sessionStorage.getItem(TRAINING_SANDBOX_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as SeedDataset;
          if (
            parsed &&
            Array.isArray(parsed.schools) &&
            parsed.schools.length === 1 &&
            parsed.schools[0]?.id === TRAINING_SANDBOX_SCHOOL_ID
          ) {
            this.cache = parsed;
            return this.cache;
          }
        }
      }
    } catch {
      // Fall through to fresh fictional seed
    }
    this.cache = generateTrainingSandboxDataset();
    this.persistToSessionStorage();
    return this.cache;
  }

  private persistToSessionStorage(): void {
    if (!this.cache) return;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(TRAINING_SANDBOX_STORAGE_KEY, JSON.stringify(this.cache));
      }
    } catch {
      // Keep working purely in memory if sessionStorage quota is exceeded
    }
  }

  private emitChange(partial: Omit<RepositoryChangeEvent, 'timestamp' | 'sourceTabId'>): void {
    const event: RepositoryChangeEvent = {
      ...partial,
      timestamp: Date.now(),
      sourceTabId: this.tabId,
    };
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch {
        // isolate listener errors
      }
    });
  }

  public async init(): Promise<StorageBackendMode> {
    this.ensureCache();
    return this.backendMode;
  }

  public setAuthContext(auth: AuthGuardContext | null): void {
    this.authContext = auth;
  }

  public subscribe(listener: RepositoryChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getSyncSnapshot(): SeedDataset {
    return this.ensureCache();
  }

  public async getAllSchools(): Promise<School[]> {
    return [...this.ensureCache().schools];
  }

  public async saveSchool(school: School): Promise<void> {
    if (school.id !== TRAINING_SANDBOX_SCHOOL_ID) return;
    const ds = this.ensureCache();
    ds.schools = [school];
    this.persistToSessionStorage();
    this.emitChange({ type: 'school_saved', schoolId: school.id });
  }

  public async getBySchool<K extends CollectionName>(
    collection: K,
    schoolId: string
  ): Promise<CollectionTypeMap[K][]> {
    const ds = this.ensureCache();
    const list = ds[collection] as CollectionTypeMap[K][];
    if (collection === 'schools') {
      return list.filter((item) => item.id === TRAINING_SANDBOX_SCHOOL_ID && !isRecordSoftDeleted(item));
    }
    return list.filter((item) => item.schoolId === schoolId && !isRecordSoftDeleted(item));
  }

  public async appendSecurityAuditLog(entry: SecurityAuditLogEntry): Promise<void> {
    const ds = this.ensureCache();
    const sealed = sealAuditEntrySync(entry, ds.security_audit_logs);
    ds.security_audit_logs = [sealed, ...ds.security_audit_logs].slice(0, 200);
    this.persistToSessionStorage();
    this.emitChange({ type: 'put', collection: 'security_audit_logs', schoolId: sealed.schoolId });
  }

  public async putItem<K extends CollectionName>(
    collection: K,
    item: CollectionTypeMap[K]
  ): Promise<void> {
    const ds = this.ensureCache();
    const list = ds[collection] as CollectionTypeMap[K][];
    const idx = list.findIndex((existing) => existing.id === item.id);
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    this.persistToSessionStorage();
    this.emitChange({ type: 'put', collection, schoolId: item.schoolId });
  }

  public async putMany<K extends CollectionName>(
    collection: K,
    items: CollectionTypeMap[K][]
  ): Promise<void> {
    if (items.length === 0) return;
    const ds = this.ensureCache();
    const list = ds[collection] as CollectionTypeMap[K][];
    const indexById = new Map<string, number>();
    list.forEach((existing, i) => indexById.set(existing.id, i));
    for (const item of items) {
      const idx = indexById.get(item.id);
      if (idx !== undefined) {
        list[idx] = item;
      } else {
        indexById.set(item.id, list.length);
        list.push(item);
      }
    }
    this.persistToSessionStorage();
    this.emitChange({ type: 'putMany', collection, schoolId: items[0]?.schoolId });
  }

  public async deleteItem<K extends CollectionName>(
    collection: K,
    schoolId: string,
    id: string
  ): Promise<void> {
    const ds = this.ensureCache();
    const list = ds[collection] as unknown as Array<
      CollectionTypeMap[K] & { deletedAtIso?: string; deletedByUserId?: string; deletedByName?: string }
    >;
    const idx = list.findIndex((item) => item.id === id && item.schoolId === schoolId);
    if (idx < 0) return;
    list[idx] = {
      ...list[idx],
      deletedAtIso: new Date().toISOString(),
      deletedByUserId: this.authContext?.session?.userId ?? 'train-user',
      deletedByName: this.authContext?.session?.displayName ?? 'کاربر محیط آموزشی',
    };
    this.persistToSessionStorage();
    this.emitChange({ type: 'delete', collection, schoolId });
  }

  public async getSoftDeletedItems(schoolId?: string): Promise<SoftDeletedRecordEntry[]> {
    const ds = this.ensureCache();
    const entries: SoftDeletedRecordEntry[] = [];
    for (const col of SANDBOX_COLLECTIONS) {
      const list = ds[col] as unknown as Array<
        Record<string, unknown> & {
          id: string;
          schoolId: string;
          recordVersion?: number;
          deletedAtIso?: string;
          deletedByUserId?: string;
          deletedByName?: string;
        }
      >;
      for (const item of list) {
        if (!item.deletedAtIso) continue;
        if (schoolId && item.schoolId !== schoolId) continue;
        const display = extractRecordDisplayTitle(col, item);
        entries.push({
          collection: col,
          collectionLabelFa: getCollectionLabelFa(col),
          id: item.id,
          schoolId: item.schoolId,
          titleFa: display.titleFa,
          subtitleFa: display.subtitleFa,
          recordVersion: typeof item.recordVersion === 'number' ? item.recordVersion : 1,
          deletedAtIso: item.deletedAtIso,
          deletedAtJalali: getTodayJalali(),
          deletedAtTimeHm: new Date(item.deletedAtIso).toTimeString().slice(0, 5),
          deletedByUserId: item.deletedByUserId ?? 'train-user',
          deletedByName: item.deletedByName ?? 'کاربر محیط آموزشی',
        });
      }
    }
    return entries.sort((a, b) => b.deletedAtIso.localeCompare(a.deletedAtIso));
  }

  public async restoreSoftDeletedItem<K extends CollectionName>(
    collection: K,
    schoolId: string,
    id: string
  ): Promise<boolean> {
    const ds = this.ensureCache();
    const list = ds[collection] as unknown as Array<
      CollectionTypeMap[K] & { deletedAtIso?: string; deletedByUserId?: string; deletedByName?: string }
    >;
    const idx = list.findIndex((item) => item.id === id && item.schoolId === schoolId);
    if (idx < 0) return false;
    const restored = { ...list[idx] };
    delete restored.deletedAtIso;
    delete restored.deletedByUserId;
    delete restored.deletedByName;
    list[idx] = restored;
    this.persistToSessionStorage();
    this.emitChange({ type: 'restore_soft_delete', collection, schoolId });
    return true;
  }

  public getVaultMeta(): MigrationVaultMeta {
    return this.vaultMeta;
  }

  public async saveVaultMeta(meta: MigrationVaultMeta): Promise<void> {
    this.vaultMeta = meta;
    this.emitChange({ type: 'vault_updated' });
  }

  public getPanicModeState(): PanicModeState {
    return this.panicState;
  }

  public async savePanicModeState(state: PanicModeState): Promise<void> {
    this.panicState = state;
    this.emitChange({ type: 'panic_mode_changed' });
  }

  public getDailyRollingSnapshots(): DailyRollingSnapshot[] {
    return this.rollingSnapshots;
  }

  public async saveDailyRollingSnapshot(snapshot: DailyRollingSnapshot): Promise<void> {
    this.rollingSnapshots = [
      snapshot,
      ...this.rollingSnapshots.filter((s) => s.id !== snapshot.id),
    ].slice(0, 5);
    this.emitChange({ type: 'vault_updated' });
  }

  public async savePreMigrationSnapshot(snapshotJson: string): Promise<void> {
    this.preMigrationSnap = snapshotJson;
  }

  public getPreMigrationSnapshot(): string | null {
    return this.preMigrationSnap;
  }

  public async replaceEntireDataset(newDataset: SeedDataset): Promise<void> {
    this.cache = newDataset;
    this.persistToSessionStorage();
    this.emitChange({ type: 'restore' });
  }

  public async getCollectionCountsBySchool(
    schoolId: string
  ): Promise<Record<CollectionName, number>> {
    const ds = this.ensureCache();
    const counts = {} as Record<CollectionName, number>;
    for (const col of SANDBOX_COLLECTIONS) {
      counts[col] = ds[col].filter(
        (item) => (col === 'schools' ? item.id === schoolId : item.schoolId === schoolId) && !isRecordSoftDeleted(item)
      ).length;
    }
    return counts;
  }

  public async exportSchoolBackup(schoolId: string): Promise<BackupPayload> {
    const ds = this.ensureCache();
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      scope: 'single_school',
      schoolId,
      data: ds,
    };
  }

  public async exportComplexBackup(): Promise<BackupPayload> {
    const ds = this.ensureCache();
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      scope: 'complex_wide',
      data: ds,
    };
  }

  public async restoreBackup(_payload: BackupPayload): Promise<void> {
    // No-op against production; sandbox only resets to fictional seed
    await this.resetToSeed();
  }

  public async resetToSeed(): Promise<void> {
    this.cache = generateTrainingSandboxDataset();
    this.panicState = { ...DEFAULT_PANIC_MODE_STATE };
    this.persistToSessionStorage();
    this.emitChange({ type: 'reset' });
  }

  public clearSessionStorage(): void {
    this.cache = null;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(TRAINING_SANDBOX_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }
}

export const trainingSandboxRepository = new TrainingSandboxRepository();
