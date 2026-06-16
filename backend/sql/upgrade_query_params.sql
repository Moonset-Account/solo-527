-- 新增查询参数字段
ALTER TABLE api_log ADD COLUMN query_params TEXT DEFAULT NULL COMMENT '查询参数(JSON)' AFTER request_params;
