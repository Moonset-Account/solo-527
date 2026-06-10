package com.courselearning.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.courselearning.entity.UserOrder;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserOrderMapper extends BaseMapper<UserOrder> {
}
