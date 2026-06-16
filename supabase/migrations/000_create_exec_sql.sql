-- 创建 exec_sql 函数用于执行任意 SQL 语句
-- 此函数需要先于其他迁移执行，因为 init-db.ts 和 seed-db.ts 会调用它
-- 在 Supabase SQL Editor 中执行此脚本

CREATE OR REPLACE FUNCTION public.exec_sql(sql_query TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 授权给 postgres 和 service_role 角色
REVOKE ALL ON FUNCTION public.exec_sql(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO postgres;
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO service_role;
