package com.sales.email.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sales.email.entity.EmailDraft;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface EmailDraftMapper extends BaseMapper<EmailDraft> {
}
