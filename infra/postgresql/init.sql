CREATE TABLE IF NOT EXISTS public.user_roles (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(32) NOT NULL UNIQUE,
  role_name VARCHAR(64) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_permissions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(32) NOT NULL REFERENCES public.user_roles(user_id),
  resource VARCHAR(128) NOT NULL,
  actions TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.low_sample_config (
  id SERIAL PRIMARY KEY,
  dimension VARCHAR(64) NOT NULL UNIQUE,
  threshold INTEGER NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.currency_exchange (
  id SERIAL PRIMARY KEY,
  currency VARCHAR(8) NOT NULL UNIQUE,
  exchange_rate_to_usd DECIMAL(18, 8) NOT NULL,
  effective_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.user_roles (user_id, role_name) VALUES
('u001', '运营人员'),
('u002', '仓配管理员'),
('u003', '质控主管');

INSERT INTO public.user_permissions (user_id, resource, actions) VALUES
('u001', 'dashboard', '{view_all}'),
('u001', 'csv', '{export}'),
('u001', 'dataset', '{read_all}'),
('u002', 'dashboard', '{view_all}'),
('u002', 'csv', '{export}'),
('u002', 'dataset', '{read_all}'),
('u002', 'warehouse_damage', '{mark}'),
('u002', 'quality_conclusion', '{write}'),
('u003', 'dashboard', '{view_all}'),
('u003', 'csv', '{export}'),
('u003', 'dataset', '{read_all}'),
('u003', 'warehouse_damage', '{mark}'),
('u003', 'quality_conclusion', '{write}'),
('u003', 'return_reason_mapping', '{write}'),
('u003', 'low_sample_config', '{write}');

INSERT INTO public.low_sample_config (dimension, threshold, enabled) VALUES
('sku', 30, TRUE),
('logistics_node', 50, TRUE),
('quality_conclusion', 20, TRUE);

INSERT INTO public.currency_exchange (currency, exchange_rate_to_usd, effective_date) VALUES
('USD', 1.00000000, '2026-06-08'),
('EUR', 1.08000000, '2026-06-08'),
('GBP', 1.27000000, '2026-06-08'),
('JPY', 0.00640000, '2026-06-08'),
('AUD', 0.65000000, '2026-06-08');
