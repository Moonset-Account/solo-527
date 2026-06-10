package com.energy.dashboard.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.energy.dashboard.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {
}
