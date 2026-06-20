package com.decoration.crm.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.decoration.crm.dto.PageQuery;
import com.decoration.crm.entity.LeadCustomer;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

public interface LeadCustomerMapper extends BaseMapper<LeadCustomer> {

    @Select("<script>" +
            "SELECT lc.*, su1.real_name as owner_name, su2.real_name as measure_designer_name " +
            "FROM lead_customer lc " +
            "LEFT JOIN sys_user su1 ON lc.owner_id = su1.id " +
            "LEFT JOIN sys_user su2 ON lc.measure_designer_id = su2.id " +
            "WHERE lc.deleted_at IS NULL " +
            "<if test='query.keyword != null and query.keyword != \"\"'>" +
            "AND (lc.customer_name LIKE CONCAT('%', #{query.keyword}, '%') OR lc.phone LIKE CONCAT('%', #{query.keyword}, '%'))" +
            "</if>" +
            "<if test='query.status != null and query.status != \"\"'>" +
            "AND lc.status = #{query.status}::lead_status" +
            "</if>" +
            "<if test='query.level != null and query.level != \"\"'>" +
            "AND lc.level = #{query.level}::lead_level" +
            "</if>" +
            "<if test='query.ownerId != null'>" +
            "AND lc.owner_id = #{query.ownerId}" +
            "</if>" +
            "<if test='query.publicSeaStatus != null and query.publicSeaStatus != \"\"'>" +
            "AND lc.public_sea_status = #{query.publicSeaStatus}::public_sea_status" +
            "</if>" +
            "<if test='query.source != null and query.source != \"\"'>" +
            "AND lc.source = #{query.source}" +
            "</if>" +
            "ORDER BY lc.created_at DESC" +
            "</script>")
    IPage<LeadCustomer> selectPageWithNames(Page<LeadCustomer> page, @Param("query") PageQuery query);

    @Select("SELECT lc.*, su1.real_name as owner_name, su2.real_name as measure_designer_name " +
            "FROM lead_customer lc " +
            "LEFT JOIN sys_user su1 ON lc.owner_id = su1.id " +
            "LEFT JOIN sys_user su2 ON lc.measure_designer_id = su2.id " +
            "WHERE lc.id = #{id} AND lc.deleted_at IS NULL")
    LeadCustomer selectByIdWithNames(@Param("id") Long id);
}
