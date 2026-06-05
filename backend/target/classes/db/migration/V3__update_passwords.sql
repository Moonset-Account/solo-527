-- ========================================
-- 更新密码为正确的BCrypt加密值（明文密码：123456）
-- 哈希值由 BCryptPasswordEncoder(10) 标准生成并通过代码验证
-- ========================================

-- 所有测试账号密码统一为 123456
-- 生成验证: BCryptPasswordEncoder.matches("123456", hash) = true
UPDATE sys_user SET password = '$2a$10$yLOyImvRtuUfM4.si/xZ2Ogx4P6RwMNSki2Wzi0tFCpvrpiR4FaMG';
