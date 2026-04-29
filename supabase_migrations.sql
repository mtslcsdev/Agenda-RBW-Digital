-- Expand clients table with missing fields
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS responsible TEXT,
ADD COLUMN IF NOT EXISTS plan TEXT,
ADD COLUMN IF NOT EXISTS monthly_value DECIMAL,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo' CHECK (status IN ('lead', 'onboarding', 'ativo', 'pausado', 'cancelado')),
ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS renewal_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS company_id UUID;

-- Expand tasks table with missing fields
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS client_id UUID,
ADD COLUMN IF NOT EXISTS assignee_id UUID,
ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_andamento', 'revisao', 'concluida')),
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS list_type TEXT DEFAULT 'geral',
ADD COLUMN IF NOT EXISTS estimated_hours INT;

-- Add color column to clients if missing
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS color TEXT;

-- Update profiles table with company_id and improve role enum
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS company_id UUID,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'operacional' CHECK (role IN ('admin', 'gestor', 'operacional', 'financeiro'));

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT CHECK (event_type IN ('reuniao', 'call', 'follow_up', 'entrega', 'pagamento', 'renovacao')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  client_id UUID,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (client_id) REFERENCES public.clients (id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES public.profiles (id) ON DELETE CASCADE
);

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (task_id) REFERENCES public.tasks (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE CASCADE
);

-- Create checklists table (subtasks)
CREATE TABLE IF NOT EXISTS public.checklists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (task_id) REFERENCES public.tasks (id) ON DELETE CASCADE
);

-- Create onboarding_checklist template
CREATE TABLE IF NOT EXISTS public.onboarding_checklist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (client_id) REFERENCES public.clients (id) ON DELETE CASCADE
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('task', 'client', 'payment', 'event', 'system')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON public.clients(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON public.tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_events_client_id ON public.events(client_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON public.comments(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_onboarding_client_id ON public.onboarding_checklist(client_id);

-- Add foreign key for tasks.client_id if not exists
ALTER TABLE public.tasks
ADD CONSTRAINT IF NOT EXISTS fk_tasks_client_id
FOREIGN KEY (client_id) REFERENCES public.clients (id) ON DELETE CASCADE;

-- Add foreign key for tasks.assignee_id if not exists
ALTER TABLE public.tasks
ADD CONSTRAINT IF NOT EXISTS fk_tasks_assignee_id
FOREIGN KEY (assignee_id) REFERENCES public.profiles (id) ON DELETE SET NULL;
