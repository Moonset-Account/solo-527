-- ========================================
-- 更新密码为正确的BCrypt加密值（明文密码：123456）
-- 哈希值由 BCryptPasswordEncoder(10) 标准生成
-- ========================================

-- 所有测试账号密码统一为 123456
-- 此BCrypt哈希值对应明文 123456，已验证可通过Spring Security密码校验
UPDATE sys_user SET password = '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG';
