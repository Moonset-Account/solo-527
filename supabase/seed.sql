-- 汽配协同台 - 演示数据 (可选)
-- 请先运行 schema.sql，再运行 seed.sql

-- 1. Profiles (注意：真实环境需要先在 auth.users 建账号)
-- 这里提供 uuid 占位示例
insert into public.profiles (id, email, full_name, role, is_active, created_at) values
  ('00000000-0000-0000-0000-000000000001', 'manager@autoparts.com', '张店长', 'store_manager', true, now()),
  ('00000000-0000-0000-0000-000000000002', 'reception@autoparts.com', '李前台', 'reception', true, now()),
  ('00000000-0000-0000-0000-000000000003', 'warehouse@autoparts.com', '王仓库', 'warehouse', true, now()),
  ('00000000-0000-0000-0000-000000000004', 'lead@autoparts.com', '赵班长', 'team_lead', true, now()),
  ('00000000-0000-0000-0000-000000000005', 'tech@autoparts.com', '孙技师', 'team_lead', true, now()),
  ('00000000-0000-0000-0000-000000000006', 'inspector@autoparts.com', '周质检', 'inspector', true, now())
on conflict (id) do nothing;

-- 2. 车辆
insert into public.vehicles (plate_number, brand, model, vin, owner_name, owner_phone, created_by) values
  ('京A·12345', '大众', '帕萨特 2023款', 'WVWZZZ3CZWE123456', '陈先生', '138****1234', '00000000-0000-0000-0000-000000000002'),
  ('京B·66888', '丰田', '凯美瑞 2022款', 'LVGBF4K28NG000001', '刘女士', '139****8888', '00000000-0000-0000-0000-000000000002'),
  ('沪C·77777', '奔驰', 'E300L 2024款', 'WDDZF4JB8KA123456', '吴总', '137****7777', '00000000-0000-0000-0000-000000000002'),
  ('粤A·52052', '比亚迪', '汉 EV 2024款', 'BYD20240001234567', '郑先生', '136****5201', '00000000-0000-0000-0000-000000000002'),
  ('京A·99999', '宝马', '530Li 2023款', 'WBA5A5C57FD123456', '何先生', '135****9999', '00000000-0000-0000-0000-000000000002')
on conflict (plate_number) do nothing;

-- 3. 配件
insert into public.parts (part_code, name, category, stock, unit_price, unit, min_stock) values
  ('P-OIL-001', '全合成机油 5W-30 4L', '润滑油', 58, 298.0, '桶', 20),
  ('P-FIL-002', '机油滤清器', '滤清器', 120, 45.0, '个', 50),
  ('P-BRK-003', '前刹车片（通风盘）', '制动系统', 8, 680.0, '副', 15),
  ('P-TIR-004', '米其林 225/55 R17', '轮胎', 22, 1080.0, '条', 10),
  ('P-BAT-005', '蓄电池 6-QW-70', '电气', 5, 760.0, '个', 8),
  ('P-SPK-006', '铱金火花塞', '点火系统', 40, 120.0, '支', 30),
  ('P-AIR-007', '空气滤清器', '滤清器', 75, 55.0, '个', 30),
  ('P-BRF-008', '刹车油 DOT4', '制动系统', 14, 88.0, '瓶', 20)
on conflict (part_code) do nothing;
