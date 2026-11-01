-- Fremwork Backend Initial Schema
-- Designed for Supabase Postgres with Row Level Security (RLS)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role_title TEXT,
  timezone TEXT DEFAULT 'Africa/Addis_Ababa',
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Workspaces
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legal_name TEXT NOT NULL,
  industry TEXT,
  country TEXT DEFAULT 'ET',
  currency TEXT NOT NULL DEFAULT 'USD',
  fiscal_year_start INTEGER NOT NULL DEFAULT 1,
  accounting_basis TEXT NOT NULL DEFAULT 'accrual',
  reserve_months NUMERIC(3, 1) NOT NULL DEFAULT 3.0,
  tin TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Memberships
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'accountant', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- Access function for RLS
CREATE OR REPLACE FUNCTION public.current_user_has_workspace_access(ws_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE workspace_id = ws_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. Accounts (Chart of Accounts)
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'income', 'expense')),
  source_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Data Sources
CREATE TABLE IF NOT EXISTS public.data_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('quickbooks', 'xero', 'bank', 'stripe', 'gusto', 'upload')),
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('connected', 'syncing', 'error', 'disconnected')),
  detail TEXT,
  last_synced_at TIMESTAMPTZ,
  error_code TEXT,
  encrypted_tokens JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Uploads
CREATE TABLE IF NOT EXISTS public.uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('reading', 'read', 'failed')),
  error_code TEXT,
  rows_found INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Unified Ledger Transactions (Minor Units integer cents)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount_minor BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payee TEXT NOT NULL,
  memo TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  method TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('cleared', 'pending', 'flagged', 'failed', 'reviewed')),
  source_id UUID REFERENCES public.data_sources(id) ON DELETE SET NULL,
  upload_id UUID REFERENCES public.uploads(id) ON DELETE SET NULL,
  external_id TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transactions_ws_date ON public.transactions(workspace_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(workspace_id, category_id);

-- 9. Budgets
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  amount_minor BIGINT NOT NULL,
  period TEXT NOT NULL,
  alert_at_pct INTEGER DEFAULT 90,
  owner_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Goals
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  start_minor BIGINT NOT NULL,
  current_minor BIGINT NOT NULL,
  target_minor BIGINT NOT NULL,
  target_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('On track', 'Behind pace', 'Not started')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Conversations & Messages
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content JSONB NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('Fast', 'Balanced', 'Deep Analysis')),
  status TEXT NOT NULL CHECK (status IN ('streaming', 'done', 'error', 'stopped')),
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Scheduled Tasks
CREATE TABLE IF NOT EXISTS public.scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  cron TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Africa/Addis_Ababa',
  deliver_to TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS across all tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_tasks ENABLE ROW LEVEL SECURITY;

-- Base RLS Policies
CREATE POLICY "Users access own workspaces" ON public.workspaces
  FOR ALL USING (id IN (SELECT workspace_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users access memberships of their workspaces" ON public.memberships
  FOR ALL USING (public.current_user_has_workspace_access(workspace_id));

CREATE POLICY "Users access transactions of their workspaces" ON public.transactions
  FOR ALL USING (public.current_user_has_workspace_access(workspace_id));

CREATE POLICY "Users access budgets of their workspaces" ON public.budgets
  FOR ALL USING (public.current_user_has_workspace_access(workspace_id));

CREATE POLICY "Users access goals of their workspaces" ON public.goals
  FOR ALL USING (public.current_user_has_workspace_access(workspace_id));

CREATE POLICY "Users access projects of their workspaces" ON public.projects
  FOR ALL USING (public.current_user_has_workspace_access(workspace_id));

CREATE POLICY "Users access conversations of their workspaces" ON public.conversations
  FOR ALL USING (public.current_user_has_workspace_access(workspace_id));

CREATE POLICY "Users access messages of accessible conversations" ON public.messages
  FOR ALL USING (conversation_id IN (
    SELECT c.id FROM public.conversations c WHERE public.current_user_has_workspace_access(c.workspace_id)
  ));
