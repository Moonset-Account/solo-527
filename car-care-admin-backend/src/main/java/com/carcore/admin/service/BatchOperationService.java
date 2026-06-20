package com.carcore.admin.service;

import com.carcore.admin.common.BusinessException;
import com.carcore.admin.common.CodeGenerator;
import com.carcore.admin.common.PageResult;
import com.carcore.admin.dto.BatchOperationConfirmDTO;
import com.carcore.admin.dto.BatchOperationDTO;
import com.carcore.admin.entity.BatchOperation;
import com.carcore.admin.entity.ExceptionRecord;
import com.carcore.admin.entity.RepairOrder;
import com.carcore.admin.repository.BatchOperationRepository;
import com.carcore.admin.repository.ExceptionRecordRepository;
import com.carcore.admin.repository.SysUserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class BatchOperationService {

    private final BatchOperationRepository batchOperationRepository;
    private final ExceptionRecordRepository exceptionRecordRepository;
    private final RepairOrderService repairOrderService;
    private final SysUserRepository sysUserRepository;
    private final CodeGenerator codeGenerator;

    public BatchOperationService(BatchOperationRepository batchOperationRepository, ExceptionRecordRepository exceptionRecordRepository, RepairOrderService repairOrderService, SysUserRepository sysUserRepository, CodeGenerator codeGenerator) {
        this.batchOperationRepository = batchOperationRepository;
        this.exceptionRecordRepository = exceptionRecordRepository;
        this.repairOrderService = repairOrderService;
        this.sysUserRepository = sysUserRepository;
        this.codeGenerator = codeGenerator;
    }

    public BatchOperation getById(Long id) {
        BatchOperation operation = batchOperationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("批量操作不存在"));
        enrichOperation(operation);
        return operation;
    }

    public BatchOperation getByBatchNo(String batchNo) {
        BatchOperation operation = batchOperationRepository.findByBatchNo(batchNo)
                .orElseThrow(() -> new BusinessException("批量操作不存在"));
        enrichOperation(operation);
        return operation;
    }

    public PageResult<BatchOperation> page(String batchNo, String operationType,
                                           String targetType, Integer status,
                                           int pageNum, int pageSize) {
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize, Sort.by(Sort.Direction.DESC, "createTime"));
        Page<BatchOperation> page = batchOperationRepository.findByConditions(
                batchNo, operationType, targetType, status, pageable);
        
        List<BatchOperation> operations = page.getContent();
        operations.forEach(this::enrichOperation);
        
        return PageResult.of(operations, page.getTotalElements(), pageNum, pageSize);
    }

    @Transactional
    public BatchOperation create(BatchOperationDTO dto) {
        BatchOperation operation = new BatchOperation();
        operation.setBatchNo(codeGenerator.generateBatchNo());
        operation.setOperationType(dto.getOperationType());
        operation.setOperationName(dto.getOperationName());
        operation.setTargetType(dto.getTargetType());
        operation.setTargetIds(dto.getTargetIds().stream()
                .map(String::valueOf)
                .collect(Collectors.joining(",")));
        operation.setOperationDetail(dto.getOperationDetail());
        operation.setTotalCount(dto.getTargetIds().size());
        operation.setSuccessCount(0);
        operation.setFailCount(0);
        operation.setOperatorId(dto.getOperatorId());
        operation.setStatus(0);
        
        return batchOperationRepository.save(operation);
    }

    @Transactional
    public BatchOperation confirm(BatchOperationConfirmDTO dto) {
        BatchOperation operation = getById(dto.getBatchOperationId());
        
        if (operation.getStatus() != 0) {
            throw new BusinessException("只有待确认的批量操作才能确认");
        }
        
        if (!dto.getConfirmed()) {
            operation.setStatus(3);
            return batchOperationRepository.save(operation);
        }
        
        operation.setStatus(1);
        operation.setConfirmTime(LocalDateTime.now());
        BatchOperation saved = batchOperationRepository.save(operation);
        
        executeAsync(saved);
        
        return saved;
    }

    @Async
    @Transactional
    public void executeAsync(BatchOperation operation) {
        List<Long> targetIds = parseTargetIds(operation.getTargetIds());
        int successCount = 0;
        int failCount = 0;
        
        for (Long targetId : targetIds) {
            try {
                executeSingleOperation(operation, targetId);
                successCount++;
            } catch (Exception e) {
                failCount++;
                createExceptionRecord(operation, targetId, e);
            }
        }
        
        operation.setSuccessCount(successCount);
        operation.setFailCount(failCount);
        operation.setStatus(2);
        batchOperationRepository.save(operation);
    }

    private void executeSingleOperation(BatchOperation operation, Long targetId) {
        if ("REPAIR_ORDER".equals(operation.getTargetType())) {
            if ("STATUS_CHANGE".equals(operation.getOperationType())) {
                Map<String, Object> detail = parseOperationDetail(operation.getOperationDetail());
                Integer newStatus = (Integer) detail.get("newStatus");
                String remark = (String) detail.get("remark");
                Long operatorId = operation.getOperatorId();
                
                repairOrderService.batchUpdateStatus(List.of(targetId), newStatus, operatorId, remark);
            }
        }
    }

    private void createExceptionRecord(BatchOperation operation, Long sourceId, Exception e) {
        ExceptionRecord exception = new ExceptionRecord();
        exception.setExceptionNo(codeGenerator.generateExceptionNo());
        exception.setExceptionType("BATCH_FAIL");
        exception.setSourceType(operation.getTargetType());
        exception.setSourceId(sourceId);
        exception.setBatchOperationId(operation.getId());
        exception.setErrorCode("BATCH_001");
        exception.setErrorMessage(e.getMessage());
        exception.setErrorDetail("{\"operationType\":\"" + operation.getOperationType() + "\"}");
        exception.setStatus(0);
        exceptionRecordRepository.save(exception);
    }

    private List<Long> parseTargetIds(String targetIds) {
        List<Long> ids = new ArrayList<>();
        if (targetIds != null && !targetIds.isEmpty()) {
            String[] parts = targetIds.split(",");
            for (String part : parts) {
                try {
                    ids.add(Long.parseLong(part.trim()));
                } catch (NumberFormatException ignored) {
                }
            }
        }
        return ids;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseOperationDetail(String detail) {
        if (detail == null || detail.isEmpty()) {
            return Map.of();
        }
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().readValue(detail, Map.class);
        } catch (Exception e) {
            return Map.of();
        }
    }

    private void enrichOperation(BatchOperation operation) {
        sysUserRepository.findById(operation.getOperatorId())
                .ifPresent(u -> operation.setOperatorName(u.getRealName()));
    }
}
