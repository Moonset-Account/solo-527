package com.decoration.crm.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.decoration.crm.dto.PageQuery;
import com.decoration.crm.entity.ExceptionRecord;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

public interface ExceptionRecordMapper extends BaseMapper<ExceptionRecord> {

    @Select("<script>" +
            "SELECT er.*, su1.real_name as responsible_name, su2.real_name as handler_name, lc.customer_name " +
            "FROM exception_record er " +
            "LEFT JOIN sys_user su1 ON er.responsible_id = su1.id " +
            "LEFT JOIN sys_user su2 ON er.handler_id = su2.id " +
            "LEFT JOIN lead_customer lc ON er.lead_id = lc.id " +
            "WHERE 1=1 " +
            "<if test='query.status != null and query.status != \"\"'>" +
            "AND er.status = #{query.status}" +
            "</if>" +
            "<if test='query.keyword != null and query.keyword != \"\"'>" +
            "AND (er.title LIKE CONCAT('%', #{query.keyword}, '%') OR lc.customer_name LIKE CONCAT('%', #{query.keyword}, '%'))" +
            "</if>" +
            "ORDER BY er.created_at DESC" +
            "</script>")
    IPage<ExceptionRecord> selectPageWithNames(Page<ExceptionRecord> page, @Param("query") PageQuery query);
}
