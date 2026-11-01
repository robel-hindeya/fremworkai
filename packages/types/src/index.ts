/**
 * @fremwork/types
 * Shared domain models, contracts, and DTOs for Fremwork
 */

// ==========================================
// 1. Roles & Multi-Tenancy
// ==========================================

export type UserRole = 'owner' | 'admin' | 'member' | 'accountant' | 'viewer';

export interface Profile {
  id: string; // uuid references auth.users(id)
  fullName: string;
  roleTitle?: string;
  timezone: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string; // uuid
  legalName: string;
  industry?: string;
  country: string;
  currency: string; // e.g. 'USD', 'ETB', 'KES'
  fiscalYearStart: number; // 1-12
  accountingBasis: 'accrual' | 'cash';
  reserveMonths: number; // e.g. 3.0
  tin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  id: string;
  workspaceId: string;
  userId: string;
  role: UserRole;
  createdAt: string;
  user?: Partial<Profile>;
}

// ==========================================
// 2. Standardized Error Contracts
// ==========================================

export type ErrorCode =
  | 'validation_failed'
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'budget_exists'
  | 'project_exists'
  | 'rate_limited'
  | 'usage_limit'
  | 'plan_limit'
  | 'file_unsupported'
  | 'file_too_large'
  | 'file_empty'
  | 'file_protected'
  | 'no_data_for_period'
  | 'source_auth_expired'
  | 'source_unreachable'
  | 'model_unavailable'
  | 'stream_interrupted'
  | 'export_failed'
  | 'internal';

export interface FremworkErrorDetails {
  code: ErrorCode;
  message: string;
  field?: string;
  request_id: string;
}

export interface ErrorEnvelope {
  error: FremworkErrorDetails;
}

// ==========================================
// 3. Ledger & Financial Models (Minor Units)
// ==========================================

export type MinorUnit = number; // Integer cents (e.g., $100.50 -> 10050)

export type TransactionStatus = 'cleared' | 'pending' | 'flagged' | 'failed' | 'reviewed';

export interface Transaction {
  id: string; // uuid or TX-code
  workspaceId: string;
  date: string; // YYYY-MM-DD
  amountMinor: MinorUnit; // Positive for income, negative for expense
  currency: string;
  payee: string;
  memo: string;
  categoryId?: string;
  categoryName?: string;
  accountId?: string;
  accountName?: string;
  method: string;
  status: TransactionStatus;
  sourceId?: string;
  uploadId?: string;
  externalId?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  workspaceId: string;
  name: string;
  kind: 'income' | 'expense';
  createdAt: string;
}

export interface Account {
  id: string;
  workspaceId: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  sourceId?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  workspaceId: string;
  categoryId: string;
  categoryName: string;
  amountMinor: MinorUnit;
  period: string; // e.g. '2026-10'
  alertAtPct: number; // e.g. 90
  ownerLabel?: string;
  spentMinor?: MinorUnit;
  createdAt: string;
}

export type GoalType = 'Savings target' | 'Revenue target' | 'Expense reduction';
export type GoalStatus = 'On track' | 'Behind pace' | 'Not started';

export interface Goal {
  id: string;
  workspaceId: string;
  type: GoalType;
  name: string;
  startMinor: MinorUnit;
  currentMinor: MinorUnit;
  targetMinor: MinorUnit;
  targetDate: string; // YYYY-MM-DD
  status: GoalStatus;
  aiGuidance?: string;
  createdAt: string;
}

// ==========================================
// 4. AI Assistant & Streaming Blocks
// ==========================================

export type ReasoningMode = 'Fast' | 'Balanced' | 'Deep Analysis';

export type AnswerBlock =
  | { type: 'text'; text: string }
  | { type: 'table'; head: string[]; rows: (string | number)[][]; foot?: (string | number)[] }
  | { type: 'chart'; title: string; kind: 'line' | 'bar'; labels: string[]; series: { name: string; values: number[]; color: string }[] }
  | { type: 'calc'; working: string; result: string }
  | { type: 'recommendation'; items: string[] };

export type MessageRole = 'user' | 'assistant';
export type MessageStatus = 'streaming' | 'done' | 'error' | 'stopped';

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  blocks: AnswerBlock[];
  mode: ReasoningMode;
  status: MessageStatus;
  tokensIn?: number;
  tokensOut?: number;
  attachedUploadIds?: string[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  workspaceId: string;
  title: string;
  projectId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

// ==========================================
// 5. Data Sources, Uploads, Tasks, Projects
// ==========================================

export type DataSourceProvider = 'quickbooks' | 'xero' | 'bank' | 'stripe' | 'gusto' | 'upload';
export type DataSourceStatus = 'connected' | 'syncing' | 'error' | 'disconnected';

export interface DataSource {
  id: string;
  workspaceId: string;
  provider: DataSourceProvider;
  name: string;
  status: DataSourceStatus;
  detail?: string;
  lastSyncedAt?: string;
  errorCode?: string;
  progress?: number;
  createdAt: string;
}

export interface UploadRecord {
  id: string;
  workspaceId: string;
  storagePath: string;
  fileName: string;
  mime: string;
  sizeBytes: number;
  status: 'reading' | 'read' | 'failed';
  errorCode?: string;
  rowsFound: number;
  createdAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  instructions?: string;
  chatsCount?: number;
  filesCount?: number;
  reportsCount?: number;
  updatedAt: string;
  createdAt: string;
}

export interface ScheduledTask {
  id: string;
  workspaceId: string;
  name: string;
  prompt: string;
  cron: string;
  timezone: string;
  deliverTo: string;
  enabled: boolean;
  nextRunAt?: string;
  lastRunStatus?: 'running' | 'completed' | 'failed';
  lastRunError?: string;
  createdAt: string;
}

export interface Insight {
  id: string;
  workspaceId: string;
  kind: 'unusual expense' | 'revenue change' | 'cash risk' | 'saving';
  title: string;
  body: string;
  severity: 'ok' | 'warn' | 'err' | 'info';
  period: string;
  queryPrompt?: string;
}
