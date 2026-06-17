package com.sales.email.service;

import com.sales.email.entity.OperationLog;
import com.sales.email.mapper.OperationLogMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class OperationLogService {

    private final OperationLogMapper operationLogMapper;

    @Async
    public void log(String operationType, String businessType, String businessId,
                     String sourceOrderNo, Long operatorId, String operatorName, String remark) {
        try {
            OperationLog logEntity = new OperationLog();
            logEntity.setOperationType(operationType);
            logEntity.setBusinessType(businessType);
            logEntity.setBusinessId(businessId);
            logEntity.setSourceOrderNo(sourceOrderNo);
            logEntity.setOperatorId(operatorId);
            logEntity.setOperatorName(operatorName);
            logEntity.setRemark(remark);
            operationLogMapper.insert(logEntity);
        } catch (Exception e) {
            log.error("记录操作日志失败", e);
        }
    }

    @Async
    public void logDetail(String operationType, String businessType, String businessId,
                          String sourceOrderNo, Long operatorId, String operatorName,
                          String detail, String remark) {
        try {
            OperationLog logEntity = new OperationLog();
            logEntity.setOperationType(operationType);
            logEntity.setBusinessType(businessType);
            logEntity.setBusinessId(businessId);
            logEntity.setSourceOrderNo(sourceOrderNo);
            logEntity.setOperatorId(operatorId);
            logEntity.setOperatorName(operatorName);
            logEntity.setDetail(detail);
            logEntity.setRemark(remark);
            operationLogMapper.insert(logEntity);
        } catch (Exception e) {
            log.error("记录操作日志失败", e);
        }
    }
}
