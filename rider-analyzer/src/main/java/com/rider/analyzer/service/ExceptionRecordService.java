package com.rider.analyzer.service;

import com.rider.analyzer.dto.ExceptionRecordDTO;
import com.rider.analyzer.entity.ExceptionRecord;
import com.rider.analyzer.repository.ExceptionRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExceptionRecordService {

    private final ExceptionRecordRepository exceptionRecordRepository;

    @Transactional
    public ExceptionRecord createRecord(ExceptionRecordDTO dto) {
        ExceptionRecord record = new ExceptionRecord();
        record.setOrderId(dto.getOrderId());
        record.setType(dto.getType());
        record.setDescription(dto.getDescription());
        record.setTempAnomalyReason(dto.getTempAnomalyReason());
        record.setHandleDurationMin(dto.getHandleDurationMin());
        record.setHandlerName(dto.getHandlerName());
        record.setStatus("PENDING");
        return exceptionRecordRepository.save(record);
    }

    @Transactional
    public ExceptionRecord handleException(Long id, String handlerName, String tempAnomalyReason, Integer handleDurationMin) {
        ExceptionRecord record = exceptionRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("异常记录不存在"));
        record.setStatus("PROCESSING");
        record.setHandlerName(handlerName);
        record.setTempAnomalyReason(tempAnomalyReason);
        record.setHandleDurationMin(handleDurationMin);
        record.setResolveTime(LocalDateTime.now());
        record.setStatus("RESOLVED");
        return exceptionRecordRepository.save(record);
    }

    public List<ExceptionRecordDTO> getExceptionRecords(String type, String status) {
        List<ExceptionRecord> records;
        if (type != null && status != null) {
            records = exceptionRecordRepository.findByTypeAndStatus(type, status);
        } else if (status != null) {
            records = exceptionRecordRepository.findByStatus(status);
        } else {
            records = exceptionRecordRepository.findAll();
        }
        return records.stream().map(this::toDTO).collect(Collectors.toList());
    }

    private ExceptionRecordDTO toDTO(ExceptionRecord record) {
        ExceptionRecordDTO dto = new ExceptionRecordDTO();
        dto.setId(record.getId());
        dto.setOrderId(record.getOrderId());
        dto.setType(record.getType());
        dto.setDescription(record.getDescription());
        dto.setTempAnomalyReason(record.getTempAnomalyReason());
        dto.setHandleDurationMin(record.getHandleDurationMin());
        dto.setHandlerName(record.getHandlerName());
        dto.setStatus(record.getStatus());
        dto.setCreateTime(record.getCreateTime());
        dto.setResolveTime(record.getResolveTime());
        return dto;
    }
}
