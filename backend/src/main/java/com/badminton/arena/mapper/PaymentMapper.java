package com.badminton.arena.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.badminton.arena.entity.Payment;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PaymentMapper extends BaseMapper<Payment> {
}
