-- 汽配门店业务协同台 - PostgreSQL Schema (Supabase 兼容)
-- 运行于 Supabase SQL Editor 或 psql

create extension if not exists "pgcrypto";

-- ============================================
-- 1. Profiles (业务用户档案，绑定 auth.users)
-- ============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text not null,
  role text not null check (role in ('store_manager','warehouse','inspector','team_lead','reception')),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ============================================
-- 2. Vehicles 车辆
-- ============================================
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  plate_number text not null unique,
  brand text not null,
  model text not null,
  vin text,
  owner_name text,
  owner_phone text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);
create index if not exists vehicles_plate_idx on public.vehicles(plate_number);

-- ============================================
-- 3. Parts 配件
-- ============================================
create table if not exists public.parts (
  id uuid primary key default gen_random_uuid(),
  part_code text not null unique,
  name text not null,
  category text,
  stock integer default 0,
  unit_price numeric(10,2) default 0,
  unit text default '件',
  min_stock integer default 0,
  created_at timestamptz default now()
);
create index if not exists parts_code_idx on public.parts(part_code);

-- ============================================
-- 4. Work Orders 维修工单
-- ============================================
create table if not exists public.work_orders (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending','assigned','in_progress','quality_check','completed','cancelled')),
  team_id uuid references public.profiles(id),
  assignee_id uuid references public.profiles(id),
  created_at timestamptz default now(),
  completed_at timestamptz
);
create index if not exists wo_status_idx on public.work_orders(status);
create index if not exists wo_vehicle_idx on public.work_orders(vehicle_id);

-- ============================================
-- 5. Part Turnovers 配件周转明细
-- ============================================
create table if not exists public.part_turnovers (
  id uuid primary key default gen_random_uuid(),
  part_id uuid not null references public.parts(id) on delete cascade,
  type text not null check (type in ('in','out','transfer')),
  quantity integer not null,
  workorder_id uuid references public.work_orders(id),
  operator_id uuid references public.profiles(id),
  remark text,
  created_at timestamptz default now()
);
create index if not exists pt_part_idx on public.part_turnovers(part_id);
create index if not exists pt_created_idx on public.part_turnovers(created_at desc);

-- 触发更新库存
create or replace function public.update_part_stock()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    if NEW.type = 'in' then
      update public.parts set stock = stock + NEW.quantity where id = NEW.part_id;
    elsif NEW.type = 'out' then
      update public.parts set stock = greatest(0, stock - NEW.quantity) where id = NEW.part_id;
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_update_stock on public.part_turnovers;
create trigger trg_update_stock
after insert on public.part_turnovers
for each row execute function public.update_part_stock();

-- ============================================
-- 6. Production Nodes 生产节点
-- ============================================
create table if not exists public.production_nodes (
  id uuid primary key default gen_random_uuid(),
  workorder_id uuid not null references public.work_orders(id) on delete cascade,
  node_name text not null,
  sequence integer not null,
  status text default 'pending' check (status in ('pending','in_progress','completed')),
  started_at timestamptz,
  completed_at timestamptz,
  operator_id uuid references public.profiles(id)
);
create index if not exists pn_wo_idx on public.production_nodes(workorder_id);

-- ============================================
-- 7. Team Schedules 班组排期
-- ============================================
create table if not exists public.team_schedules (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.profiles(id),
  workorder_id uuid references public.work_orders(id),
  start_time timestamptz not null,
  end_time timestamptz not null,
  assignee_ids uuid[] default '{}',
  created_at timestamptz default now()
);

-- ============================================
-- 8. Quality Inspections 质检
-- ============================================
create table if not exists public.quality_inspections (
  id uuid primary key default gen_random_uuid(),
  workorder_id uuid not null references public.work_orders(id) on delete cascade,
  inspector_id uuid references public.profiles(id),
  items jsonb not null default '[]',
  overall_result text not null check (overall_result in ('pass','fail','rework')),
  remark text,
  created_at timestamptz default now()
);
create index if not exists qi_wo_idx on public.quality_inspections(workorder_id);

-- ============================================
-- 9. Order Changes 订单变更
-- ============================================
create table if not exists public.order_changes (
  id uuid primary key default gen_random_uuid(),
  workorder_id uuid references public.work_orders(id),
  change_type text not null,
  content text not null,
  affected_objects jsonb not null default '[]',
  responsible_id uuid references public.profiles(id),
  status text default 'open' check (status in ('open','processing','closed')),
  close_note text,
  closed_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);
create index if not exists oc_status_idx on public.order_changes(status);

-- ============================================
-- 10. Callback Records 回调记录
-- ============================================
create table if not exists public.callback_records (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  event_type text not null,
  payload jsonb not null default '{}',
  status text default 'pending' check (status in ('pending','success','failed')),
  failure_reason text,
  retry_count integer default 0,
  created_at timestamptz default now(),
  processed_at timestamptz
);
create index if not exists cb_status_idx on public.callback_records(status);

-- ============================================
-- 11. Compensation Records 补偿记录
-- ============================================
create table if not exists public.compensation_records (
  id uuid primary key default gen_random_uuid(),
  callback_record_id uuid not null references public.callback_records(id) on delete cascade,
  action text not null,
  executed_by uuid references public.profiles(id),
  executed_at timestamptz default now(),
  result text not null check (result in ('success','failed')),
  remark text
);

-- ============================================
-- 12. RLS (Row Level Security)
-- ============================================
alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.parts enable row level security;
alter table public.part_turnovers enable row level security;
alter table public.work_orders enable row level security;
alter table public.production_nodes enable row level security;
alter table public.team_schedules enable row level security;
alter table public.quality_inspections enable row level security;
alter table public.order_changes enable row level security;
alter table public.callback_records enable row level security;
alter table public.compensation_records enable row level security;

-- 公共读：登录用户都可读所有业务表；店长有全部权限；其他角色按功能限制写入
create policy "Authenticated read all profiles" on public.profiles
  for select using (auth.uid() is not null);

create policy "Manager write all" on public.profiles
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'store_manager')
  ) with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'store_manager')
  );

-- Vehicles: 接待和店长可写，全员可读
create policy "Vehicles readable by all auth users" on public.vehicles for select using (auth.uid() is not null);
create policy "Vehicles writable by reception and manager" on public.vehicles
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('reception','store_manager'))
  ) with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('reception','store_manager'))
  );

-- Parts: 仓库和店长可写，全员可读
create policy "Parts readable by all auth users" on public.parts for select using (auth.uid() is not null);
create policy "Parts writable by warehouse and manager" on public.parts
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('warehouse','store_manager'))
  ) with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('warehouse','store_manager'))
  );

-- Part Turnovers: 仓库和店长可写
create policy "PT readable by all" on public.part_turnovers for select using (auth.uid() is not null);
create policy "PT writable by warehouse" on public.part_turnovers
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('warehouse','store_manager'))
  ) with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('warehouse','store_manager'))
  );

-- Work Orders: 接待/店长可写，班组长可更新状态
create policy "WO readable by all" on public.work_orders for select using (auth.uid() is not null);
create policy "WO writable" on public.work_orders
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('reception','store_manager','team_lead'))
  ) with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('reception','store_manager','team_lead'))
  );

-- Production Nodes: 班组长/店长可写
create policy "PN readable" on public.production_nodes for select using (auth.uid() is not null);
create policy "PN writable" on public.production_nodes
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('team_lead','store_manager'))
  ) with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('team_lead','store_manager'))
  );

-- Team Schedules
create policy "TS readable" on public.team_schedules for select using (auth.uid() is not null);
create policy "TS writable" on public.team_schedules
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('team_lead','store_manager'))
  ) with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('team_lead','store_manager'))
  );

-- Quality
create policy "QI readable" on public.quality_inspections for select using (auth.uid() is not null);
create policy "QI writable" on public.quality_inspections
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('inspector','store_manager'))
  ) with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('inspector','store_manager'))
  );

-- Order Changes
create policy "OC readable" on public.order_changes for select using (auth.uid() is not null);
create policy "OC writable" on public.order_changes
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('reception','store_manager'))
  ) with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('reception','store_manager'))
  );

-- Callbacks: 仅店长可读可写
create policy "CB manager only" on public.callback_records
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'store_manager')
  ) with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'store_manager')
  );

-- Compensations: 仅店长
create policy "CR manager only" on public.compensation_records
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'store_manager')
  ) with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'store_manager')
  );
