package com.rider.analyzer.service;

import com.rider.analyzer.entity.BatchImportRecord;
import com.rider.analyzer.repository.BatchImportRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BatchImportService {

    private final BatchImportRecordRepository batchImportRecordRepository;

    @Transactional
    public BatchImportRecord importWithValidation(String type, Object file) {
        String batchNo = "BATCH_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + "_" + UUID.randomUUID().toString().substring(0, 8);

        BatchImportRecord record = new BatchImportRecord();
        record.setBatchNo(batchNo);
        record.setType(type);
        record.setTotalCount(0);
        record.setSuccessCount(0);
        record.setFailCount(0);
        record.setStatus("VALIDATING");
        return batchImportRecordRepository.save(record);
    }

    public String generateErrorFile(String batchNo) {
        BatchImportRecord record = batchImportRecordRepository.findByBatchNo(batchNo)
                .orElseThrow(() -> new RuntimeException("批次记录不存在"));
        String errorFilePath = "/tmp/import_errors/" + batchNo + ".csv";
        record.setErrorFilePath(errorFilePath);
        batchImportRecordRepository.save(record);
        return errorFilePath;
    }

    @Transactional
    public BatchImportRecord approve(String batchNo) {
        BatchImportRecord record = batchImportRecordRepository.findByBatchNo(batchNo)
                .orElseThrow(() -> new RuntimeException("批次记录不存在"));
        if (!"VALIDATING".equals(record.getStatus())) {
            throw new RuntimeException("批次状态不允许审批");
        }
        record.setStatus("APPROVED");
        return batchImportRecordRepository.save(record);
    }
}
