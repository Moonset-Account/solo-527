INSERT INTO clinics (id, name, address, phone) VALUES
    ('00000000-0000-0000-0000-000000000001', '总店口腔诊所', '北京市朝阳区XX路100号', '010-12345678'),
    ('00000000-0000-0000-0000-000000000002', '分店A口腔诊所', '北京市海淀区XX路50号', '010-87654321')
ON CONFLICT (id) DO NOTHING;

INSERT INTO roles (id, name, display_name, description) VALUES
    ('10000000-0000-0000-0000-000000000001', 'super_admin', '超级管理员', '系统最高权限，可管理所有功能'),
    ('10000000-0000-0000-0000-000000000002', 'clinic_director', '诊所院长', '管理诊所所有业务'),
    ('10000000-0000-0000-0000-000000000003', 'doctor', '医生', '接诊患者，开具处方'),
    ('10000000-0000-0000-0000-000000000004', 'receptionist', '前台', '预约挂号，收费核对'),
    ('10000000-0000-0000-0000-000000000005', 'cashier', '收费员', '收费结算'),
    ('10000000-0000-0000-0000-000000000006', 'nurse', '护士', '护理及随访'),
    ('10000000-0000-0000-0000-000000000007', 'financial', '财务', '收费准确核对及报表')
ON CONFLICT (id) DO NOTHING;

INSERT INTO permissions (code, name, module, description) VALUES
    ('user:manage', '用户管理', '用户权限', '增删改查用户'),
    ('role:manage', '角色管理', '用户权限', '增删改查角色'),
    ('permission:view', '权限查看', '用户权限', '查看权限列表'),
    ('clinic:manage', '诊所管理', '基础配置', '管理诊所信息'),
    ('appointment:create', '创建预约', '预约管理', '创建患者预约'),
    ('appointment:view', '查看预约', '预约管理', '查看预约列表'),
    ('appointment:update', '更新预约', '预约管理', '修改预约信息'),
    ('appointment:cancel', '取消预约', '预约管理', '取消预约'),
    ('slot:manage', '号源管理', '预约管理', '管理医生号源'),
    ('slot:view', '号源查看', '预约管理', '查看号源使用情况'),
    ('patient:create', '创建患者', '患者管理', '新增患者档案'),
    ('patient:view', '查看患者', '患者管理', '查看患者信息'),
    ('patient:update', '更新患者', '患者管理', '修改患者信息'),
    ('prescription:create', '创建处方', '处方管理', '开具处方'),
    ('prescription:view', '查看处方', '处方管理', '查看处方列表'),
    ('prescription:update', '更新处方', '处方管理', '修改处方'),
    ('charge:create', '创建收费', '收费管理', '创建收费单'),
    ('charge:view', '查看收费', '收费管理', '查看收费记录'),
    ('charge:check', '收费核对', '收费管理', '核对收费项目'),
    ('charge:refund', '退费处理', '收费管理', '办理退费'),
    ('charge_accuracy:view', '查看收费准确', '报表管理', '查看收费准确报表'),
    ('charge_accuracy:check', '收费准确核对', '报表管理', '确认收费准确'),
    ('charge_accuracy:backfill', '报表回填', '报表管理', '复诊流失回填报表'),
    ('reminder:create', '创建催办', '催办管理', '创建催办任务'),
    ('reminder:view', '查看催办', '催办管理', '查看催办列表'),
    ('reminder:handle', '处理催办', '催办管理', '处理催办任务'),
    ('followup:create', '创建随访', '随访管理', '创建随访任务'),
    ('followup:view', '查看随访', '随访管理', '查看随访列表'),
    ('followup:handle', '处理随访', '随访管理', '处理随访任务'),
    ('revisit_churn:view', '查看复诊流失', '复诊管理', '查看复诊流失列表'),
    ('revisit_churn:handle', '处理复诊流失', '复诊管理', '处理复诊流失'),
    ('revisit_churn:close', '关闭复诊流失', '复诊管理', '关闭并回填报表'),
    ('log:view', '查看日志', '系统管理', '查看操作日志'),
    ('api_log:view', '查看接口日志', '系统管理', '查看接口请求日志'),
    ('api_retry:view', '查看重试状态', '系统管理', '查看接口重试记录'),
    ('api_retry:retry', '手动重试', '系统管理', '手动重试失败接口'),
    ('report:view', '查看报表', '报表管理', '查看统计报表')
ON CONFLICT (code) DO NOTHING;

DO $$
DECLARE
    r RECORD;
    p RECORD;
BEGIN
    FOR r IN SELECT id FROM roles WHERE name = 'super_admin' LOOP
        FOR p IN SELECT id FROM permissions LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (r.id, p.id)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;

    FOR r IN SELECT id FROM roles WHERE name = 'clinic_director' LOOP
        FOR p IN SELECT id FROM permissions WHERE code NOT LIKE '%manage%' OR code IN ('appointment:manage', 'patient:manage') LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (r.id, p.id)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END$$;

INSERT INTO users (id, username, password_hash, real_name, phone, email, clinic_id) VALUES
    ('20000000-0000-0000-0000-000000000001', 'admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '系统管理员', '13800000000', 'admin@dental.com', '00000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000002', 'director', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '张院长', '13800000001', 'director@dental.com', '00000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000003', 'doctor1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '李医生', '13800000002', 'doctor1@dental.com', '00000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000004', 'reception1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '王前台', '13800000003', 'reception@dental.com', '00000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000005', 'cashier1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '赵收费', '13800000004', 'cashier@dental.com', '00000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000006', 'nurse1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '刘护士', '13800000005', 'nurse@dental.com', '00000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000007', 'finance1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '陈财务', '13800000006', 'finance@dental.com', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id) VALUES
    ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002'),
    ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003'),
    ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004'),
    ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005'),
    ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006'),
    ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000007')
ON CONFLICT DO NOTHING;

INSERT INTO doctors (id, user_id, title, department, specialty, clinic_id) VALUES
    ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', '主治医师', '口腔科', '口腔种植、正畸', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO charge_items (code, name, category, unit, price, cost, clinic_id) VALUES
    ('EXAM001', '口腔检查', '检查费', '次', 50.00, 10.00, '00000000-0000-0000-0000-000000000001'),
    ('XRAY001', '根尖片', '影像检查', '张', 80.00, 15.00, '00000000-0000-0000-0000-000000000001'),
    ('CLEAN001', '超声波洁牙', '洁牙', '次', 200.00, 50.00, '00000000-0000-0000-0000-000000000001'),
    ('FILL001', '树脂补牙', '牙体治疗', '颗', 300.00, 80.00, '00000000-0000-0000-0000-000000000001'),
    ('ROOT001', '根管治疗', '牙体治疗', '颗', 800.00, 200.00, '00000000-0000-0000-0000-000000000001'),
    ('EXTRACT001', '拔牙', '外科', '颗', 200.00, 50.00, '00000000-0000-0000-0000-000000000001'),
    ('IMPLANT001', '种植牙', '种植', '颗', 8000.00, 3000.00, '00000000-0000-0000-0000-000000000001'),
    ('BRACE001', '正畸治疗', '正畸', '全口', 15000.00, 5000.00, '00000000-0000-0000-0000-000000000001'),
    ('MED001', '阿莫西林胶囊', '药品', '盒', 30.00, 15.00, '00000000-0000-0000-0000-000000000001'),
    ('MED002', '甲硝唑片', '药品', '瓶', 15.00, 5.00, '00000000-0000-0000-0000-000000000001')
ON CONFLICT (code) DO NOTHING;

INSERT INTO patients (id, name, phone, gender, birth_date, clinic_id) VALUES
    ('40000000-0000-0000-0000-000000000001', '张三', '13900000001', '男', '1985-05-15', '00000000-0000-0000-0000-000000000001'),
    ('40000000-0000-0000-0000-000000000002', '李四', '13900000002', '女', '1990-10-20', '00000000-0000-0000-0000-000000000001'),
    ('40000000-0000-0000-0000-000000000003', '王五', '13900000003', '男', '1978-03-08', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO appointment_slots (doctor_id, clinic_id, date, start_time, end_time, max_patients, status) VALUES
    ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', CURRENT_DATE, '09:00:00', '09:30:00', 1, 'available'),
    ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', CURRENT_DATE, '09:30:00', '10:00:00', 1, 'available'),
    ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', CURRENT_DATE, '10:00:00', '10:30:00', 1, 'available'),
    ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', CURRENT_DATE, '10:30:00', '11:00:00', 1, 'available'),
    ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', CURRENT_DATE, '14:00:00', '14:30:00', 1, 'available'),
    ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', CURRENT_DATE, '14:30:00', '15:00:00', 1, 'available')
ON CONFLICT DO NOTHING;
