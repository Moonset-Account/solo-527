package com.citytour.inventory.service;

import com.citytour.inventory.dto.PageResult;
import com.citytour.inventory.entity.RefundRecord;
import com.citytour.inventory.entity.TourOrder;
import com.citytour.inventory.repository.RefundRecordRepository;
import com.citytour.inventory.repository.TourOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefundService {

    private final RefundRecordRepository refundRecordRepository;
    private final TourOrderRepository tourOrderRepository;
    private final RoomInventoryService roomInventoryService;

    public PageResult<RefundRecord> list(int page, int size, String refundNo, String orderNo,
                                         Long routeId, String refundStatus, String refundType) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<RefundRecord> result = refundRecordRepository.findByConditions(
                refundNo, orderNo, routeId, refundStatus, refundType, pageRequest);
        return new PageResult<>(result.getContent(), result.getTotalElements(), page, size);
    }

    public RefundRecord getById(Long id) {
        return refundRecordRepository.findById(id).orElse(null);
    }

    public RefundRecord getByRefundNo(String refundNo) {
        return refundRecordRepository.findByRefundNo(refundNo).orElse(null);
    }

    @Transactional
    public RefundRecord applyRefund(String orderNo, BigDecimal refundAmount,
                                    String refundReason, String refundType, String operator) {
        TourOrder order = tourOrderRepository.findByOrderNo(orderNo).orElseThrow();

        RefundRecord record = new RefundRecord();
        record.setRefundNo("RF" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        record.setOrderNo(orderNo);
        record.setRouteId(order.getRouteId());
        record.setRefundAmount(refundAmount);
        record.setRefundReason(refundReason);
        record.setRefundType(refundType);
        record.setRefundStatus("PENDING");
        record.setCreatedBy(operator);

        order.setRefundStatus("PROCESSING");
        order.setUpdatedBy(operator);
        order.setVersion(order.getVersion() + 1);
        tourOrderRepository.save(order);

        return refundRecordRepository.save(record);
    }

    @Transactional
    public RefundRecord approveRefund(Long refundId, String approver) {
        RefundRecord record = refundRecordRepository.findById(refundId).orElseThrow();
        record.setRefundStatus("APPROVED");
        record.setApprover(approver);
        record.setApproveTime(LocalDateTime.now());
        record.setUpdatedBy(approver);

        TourOrder order = tourOrderRepository.findByOrderNo(record.getOrderNo()).orElseThrow();
        order.setRefundStatus("REFUNDED");
        order.setRefundAmount(record.getRefundAmount());
        order.setVersion(order.getVersion() + 1);
        order.setUpdatedBy(approver);
        tourOrderRepository.save(order);

        return refundRecordRepository.save(record);
    }

    @Transactional
    public RefundRecord rejectRefund(Long refundId, String approver, String rejectReason) {
        RefundRecord record = refundRecordRepository.findById(refundId).orElseThrow();
        record.setRefundStatus("REJECTED");
        record.setApprover(approver);
        record.setRemark(rejectReason);
        record.setUpdatedBy(approver);

        TourOrder order = tourOrderRepository.findByOrderNo(record.getOrderNo()).orElseThrow();
        order.setRefundStatus("REJECTED");
        order.setVersion(order.getVersion() + 1);
        order.setUpdatedBy(approver);
        tourOrderRepository.save(order);

        return refundRecordRepository.save(record);
    }

    @Transactional
    public void delete(Long id) {
        refundRecordRepository.deleteById(id);
    }
}
