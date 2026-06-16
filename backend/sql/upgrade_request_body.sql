-- 新增请求体字段，查询参数字段同步可初始化
ALTER TABLE api_log
    ADD COLUMN request_body TEXT DEFAULT NULL COMMENT '请求体(@RequestBody注解参数的JSON)' AFTER query_params;

-- 如需重建整个表，以下是完整结构，执行上面 ALTER 即可
