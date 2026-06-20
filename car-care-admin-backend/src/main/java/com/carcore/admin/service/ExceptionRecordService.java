package com.carcore.admin.service;

import com.carcore.admin.common.BusinessException;
import com.carcore.admin.common.CodeGenerator;
import com.carcore.admin.common.PageResult;
import com.carcore.admin.entity.ExceptionRecord;
import com.carcore.admin.repository.BatchOperationRepository;
import com.carcore.admin.repository.ExceptionRecordRepository;
import com.carcore.admin.repository.SysUserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ExceptionRecordService {

    private final ExceptionRecordRepository exceptionRecordRepository;
    private final BatchOperationRepository batchOperationRepository;
    private final SysUserRepository sysUserRepository;
    private final CodeGenerator codeGenerator;

    public ExceptionRecordService(ExceptionRecordRepository exceptionRecordRepository, BatchOperationRepository batchOperationRepository, SysUserRepository sysUserRepository, CodeGenerator codeGenerator) {
        this.exceptionRecordRepository = exceptionRecordRepository;
        this.batchOperationRepository = batchOperationRepository;
        this.sysUserRepository = sysUserRepository;
        this.codeGenerator = codeGenerator;
    }

    public ExceptionRecord getById(Long id) {
        ExceptionRecord record = exceptionRecordRepository.findById(id)
                .orElseThrow(() -> new BusinessException("异常记录不存在"));
        enrichRecord(record);
        return record;
    }

    public ExceptionRecord getByExceptionNo(String exceptionNo) {
        ExceptionRecord record = exceptionRecordRepository.findByExceptionNo(exceptionNo)
                .orElseThrow(() -> new BusinessException("异常记录不存在"));
        enrichRecord(record);
        return record;
    }

    public List<ExceptionRecord> getByBatchOperationId(Long batchOperationId) {
        List<ExceptionRecord> records = exceptionRecordRepository.findByBatchOperationId(batchOperationId);
        records.forEach(this::enrichRecord);
        return records;
    }

    public PageResult<ExceptionRecord> page(String exceptionNo, String exceptionType,
                                            String sourceType, Long batchOperationId,
                                            Integer status, int pageNum, int pageSize) {
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize, Sort.by(Sort.Direction.DESC, "createTime"));
        Page<ExceptionRecord> page = exceptionRecordRepository.findByConditions(
                exceptionNo, exceptionType, sourceType, batchOperationId, status, pageable);
        
        List<ExceptionRecord> records = page.getContent();
        records.forEach(this::enrichRecord);
        
        return PageResult.of(records, page.getTotalElements(), pageNum, pageSize);
    }

    @Transactional
    public ExceptionRecord handleException(Long id, Long handlerId, String handleResult) {
        ExceptionRecord record = getById(id);
        
        if (record.getStatus() == 2 || record.getStatus() == 3) {
            throw new BusinessException("该异常已处理或已忽略");
        }
        
        record.setHandlerId(handlerId);
        record.setHandleResult(handleResult);
        record.setHandleTime(LocalDateTime.now());
        record.setStatus(2);
        
        return exceptionRecordRepository.save(record);
    }

    @Transactional
    public ExceptionRecord ignoreException(Long id, Long handlerId, String handleResult) {
        ExceptionRecord record = getById(id);
        
        if (record.getStatus() == 2 || record.getStatus() == 3) {
            throw new BusinessException("该异常已处理或已忽略");
        }
        
        record.setHandlerId(handlerId);
        record.setHandleResult(handleResult != null ? handleResult : "忽略该异常");
        record.setHandleTime(LocalDateTime.now());
        record.setStatus(3);
        
        return exceptionRecordRepository.save(record);
    }

    @Transactional
    public void retryException(Long id) {
        ExceptionRecord record = getById(id);
        
        if (record.getStatus() != 0) {
            throw new BusinessException("只有待处理的异常才能重试");
        }
        
        record.setStatus(1);
        exceptionRecordRepository.save(record);
        
        try {
            executeRetry(record);
            record.setStatus(2);
            record.setHandleResult("重试成功");
            record.setHandleTime(LocalDateTime.now());
        } catch (Exception e) {
            record.setStatus(0);
            record.setErrorDetail(record.getErrorDetail() + 
                    "; 重试失败: " + e.getMessage());
            throw new BusinessException("重试失败: " + e.getMessage());
        }
        
        exceptionRecordRepository.save(record);
    }

    private void executeRetry(ExceptionRecord record) {
        if ("BATCH_FAIL".equals(record.getExceptionType())) {
        }
    }

    public ExceptionRecord createException(ExceptionRecord record) {
        record.setExceptionNo(codeGenerator.generateExceptionNo());
        if (record.getStatus() == null) {
            record.setStatus(0);
        }
        return exceptionRecordRepository.save(record);
    }

    private void enrichRecord(ExceptionRecord record) {
        if (record.getHandlerId() != null) {
            sysUserRepository.findById(record.getHandlerId())
                    .ifPresent(u -> record.setHandlerName(u.getRealName()));
        }
        
        if (record.getBatchOperationId() != null) {
            batchOperationRepository.findById(record.getBatchOperationId())
                    .ifPresent(b -> record.setBatchNo(b.getBatchNo()));
        }
    }
}
