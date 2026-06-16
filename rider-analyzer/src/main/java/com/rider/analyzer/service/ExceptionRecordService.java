package com.rider.analyzer.service;

import com.rider.analyzer.dto.ExceptionRecordDTO;
import com.rider.analyzer.dto.ExceptionRecordVO;
import com.rider.analyzer.dto.PageResult;
import com.rider.analyzer.entity.DeliveryOrder;
import com.rider.analyzer.entity.ExceptionRecord;
import com.rider.analyzer.repository.DeliveryOrderRepository;
import com.rider.analyzer.repository.ExceptionRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExceptionRecordService {

    private final ExceptionRecordRepository exceptionRecordRepository;
    private final DeliveryOrderRepository deliveryOrderRepository;

    private static final Map<String, String> TYPE_LABEL_MAP = new HashMap<>();
    static {
        TYPE_LABEL_MAP.put("TEMPERATURE", "温度异常");
        TYPE_LABEL_MAP.put("DELAY", "超时");
        TYPE_LABEL_MAP.put("DAMAGE", "破损");
        TYPE_LABEL_MAP.put("OTHER", "其他");
    }

    private static final Map<String, String> STATUS_LABEL_MAP = new HashMap<>();
    static {
        STATUS_LABEL_MAP.put("PENDING", "待处理");
        STATUS_LABEL_MAP.put("PROCESSING", "处理中");
        STATUS_LABEL_MAP.put("RESOLVED", "已处理");
    }

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
        record.setHandlerName(handlerName);
        record.setTempAnomalyReason(tempAnomalyReason);
        record.setHandleDurationMin(handleDurationMin);
        record.setResolveTime(LocalDateTime.now());
        record.setStatus("RESOLVED");
        return exceptionRecordRepository.save(record);
    }

    public PageResult<ExceptionRecordVO> getExceptionRecords(String type, String status, int page, int pageSize) {
        Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "createTime"));
        Page<ExceptionRecord> recordPage;

        if (type != null && !type.isEmpty() && status != null && !status.isEmpty()) {
            recordPage = exceptionRecordRepository.findByTypeAndStatus(type, status, pageable);
        } else if (type != null && !type.isEmpty()) {
            recordPage = exceptionRecordRepository.findByType(type, pageable);
        } else if (status != null && !status.isEmpty()) {
            recordPage = exceptionRecordRepository.findByStatus(status, pageable);
        } else {
            recordPage = exceptionRecordRepository.findAll(pageable);
        }

        List<Long> orderIds = recordPage.getContent().stream()
                .map(ExceptionRecord::getOrderId).distinct().toList();
        Map<Long, String> orderNoMap = deliveryOrderRepository.findAllById(orderIds).stream()
                .collect(Collectors.toMap(DeliveryOrder::getId, DeliveryOrder::getOrderNo));

        List<ExceptionRecordVO> voList = recordPage.getContent().stream()
                .map(r -> toVO(r, orderNoMap))
                .collect(Collectors.toList());

        return new PageResult<>(voList, recordPage.getTotalElements(), page, pageSize);
    }

    public List<ExceptionRecordVO> getRecentExceptions(int limit) {
        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createTime"));
        Page<ExceptionRecord> page = exceptionRecordRepository.findAll(pageable);

        List<Long> orderIds = page.getContent().stream()
                .map(ExceptionRecord::getOrderId).distinct().toList();
        Map<Long, String> orderNoMap = deliveryOrderRepository.findAllById(orderIds).stream()
                .collect(Collectors.toMap(DeliveryOrder::getId, DeliveryOrder::getOrderNo));

        return page.getContent().stream()
                .map(r -> toVO(r, orderNoMap))
                .collect(Collectors.toList());
    }

    private ExceptionRecordVO toVO(ExceptionRecord record, Map<Long, String> orderNoMap) {
        ExceptionRecordVO vo = new ExceptionRecordVO();
        vo.setId(record.getId());
        vo.setOrderId(record.getOrderId());
        vo.setOrderNo(orderNoMap.getOrDefault(record.getOrderId(), ""));
        vo.setType(record.getType());
        vo.setTypeLabel(TYPE_LABEL_MAP.getOrDefault(record.getType(), record.getType()));
        vo.setDescription(record.getDescription());
        vo.setTempAnomalyReason(record.getTempAnomalyReason());
        vo.setHandleDurationMin(record.getHandleDurationMin());
        vo.setHandlerName(record.getHandlerName());
        vo.setStatus(record.getStatus());
        vo.setStatusLabel(STATUS_LABEL_MAP.getOrDefault(record.getStatus(), record.getStatus()));
        vo.setCreateTime(record.getCreateTime());
        vo.setResolveTime(record.getResolveTime());
        return vo;
    }
}
