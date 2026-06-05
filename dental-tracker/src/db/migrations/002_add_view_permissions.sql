BEGIN;

INSERT INTO permissions (code, description) VALUES
  ('autoclave:view', '查看消毒锅'),
  ('department:view', '查看科室')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r, permissions p
  WHERE r.name = 'sterilization_nurse' AND p.code = 'autoclave:view'
  ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r, permissions p
  WHERE r.name = 'sterilization_nurse' AND p.code = 'department:view'
  ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r, permissions p
  WHERE r.name = 'department_nurse' AND p.code = 'department:view'
  ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r, permissions p
  WHERE r.name = 'infection_control' AND p.code = 'autoclave:view'
  ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r, permissions p
  WHERE r.name = 'infection_control' AND p.code = 'department:view'
  ON CONFLICT DO NOTHING;

COMMIT;
