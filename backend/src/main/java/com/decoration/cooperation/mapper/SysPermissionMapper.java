package com.decoration.cooperation.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.decoration.cooperation.entity.SysPermission;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SysPermissionMapper extends BaseMapper<SysPermission> {

    List<SysPermission> selectByRoleCodes(@Param("roleCodes") List<String> roleCodes);
}
