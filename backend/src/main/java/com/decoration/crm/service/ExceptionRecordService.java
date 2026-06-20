package com.decoration.crm.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.decoration.crm.dto.PageQuery;
import com.decoration.crm.entity.ExceptionRecord;

public interface ExceptionRecordService {
    IPage<ExceptionRecord> getPage(PageQuery query);
    ExceptionRecord getById(Long id);
    ExceptionRecord create(ExceptionRecord record);
    ExceptionRecord update(Long id, ExceptionRecord record);
    void delete(Long id);
    void resolve(Long id, String overdueReason, Integer handlingCostMinutes);
}
