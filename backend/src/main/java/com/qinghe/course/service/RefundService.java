package com.qinghe.course.service;

import com.qinghe.course.common.PageResult;
import com.qinghe.course.common.QueryParams;
import com.qinghe.course.entity.RefundRequest;
import com.qinghe.course.entity.CourseOrder;
import com.qinghe.course.entity.LearningProgress;
import com.qinghe.course.repository.RefundRequestRepository;
import com.qinghe.course.repository.CourseOrderRepository;
import com.qinghe.course.repository.LearningProgressRepository;
import com.qinghe.course.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefundService {

    private final RefundRequestRepository refundRequestRepository;
    private final CourseOrderRepository courseOrderRepository;
    private final LearningProgressRepository learningProgressRepository;
    private final LearningService learningService;
    private final OperationPanelService operationPanelService;

    public PageResult<RefundRequest> search(QueryParams params) {
        Pageable pageable = PageRequest.of(params.getPageNum() - 1, params.getPageSize());
        Page<RefundRequest> page = refundRequestRepository.search(
                params.getKeyword(),
                params.getStatus(),
                params.getStartTime(),
                params.getEndTime(),
                pageable
        );
        return new PageResult<>(page.getContent(), page.getTotalElements(), params.getPageNum(), params.getPageSize());
    }

    public RefundRequest getById(Long id) {
        return refundRequestRepository.findById(id).orElseThrow(() -> new RuntimeException("退款申请不存在"));
    }

    @Transactional
    public RefundRequest create(RefundRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        CourseOrder order = courseOrderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("订单不存在"));

        request.setUserId(userId);
        request.setStatus("PENDING");

        LearningProgress progress = learningProgressRepository
                .findByUserIdAndCourseIdAndClassId(order.getUserId(), order.getCourseId(), order.getClassId())
                .orElse(null);
        if (progress != null) {
            request.setConsumedHours(progress.getConsumedHours());
        }

        return refundRequestRepository.save(request);
    }

    @Transactional
    public RefundRequest sendReminder(Long id) {
        RefundRequest request = getById(id);
        if (request.getReminderSent()) {
            throw new RuntimeException("提醒已发送");
        }
        request.setReminderSent(true);
        request.setReminderSentAt(LocalDateTime.now());
        log.info("退款异常提醒已发送, refundId={}, orderId={}", id, request.getOrderId());
        return refundRequestRepository.save(request);
    }

    @Transactional
    public RefundRequest approve(Long id, String processRemark) {
        RefundRequest request = getById(id);
        String oldStatus = request.getStatus();

        CourseOrder order = courseOrderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("订单不存在"));

        if (!request.getHoursWrittenBack() && request.getConsumedHours() != null) {
            LearningProgress progress = learningProgressRepository
                    .findByUserIdAndCourseIdAndClassId(order.getUserId(), order.getCourseId(), order.getClassId())
                    .orElse(null);
            if (progress != null) {
                learningService.writeBackHours(progress.getId(), request.getConsumedHours());
                request.setHoursWrittenBack(true);
            }
        }

        request.setStatus("APPROVED");
        request.setProcessedBy(SecurityUtils.getCurrentUserId());
        request.setProcessedAt(LocalDateTime.now());
        request.setProcessRemark(processRemark);

        operationPanelService.logStatusFlow("REFUND", id, oldStatus, "APPROVED", processRemark);

        String orderOldStatus = order.getStatus();
        order.setRefundStatus("REFUNDED");
        operationPanelService.logStatusFlow("ORDER", request.getOrderId(), orderOldStatus, "REFUNDED", "退款成功");
        courseOrderRepository.save(order);

        return refundRequestRepository.save(request);
    }

    @Transactional
    public RefundRequest reject(Long id, String processRemark) {
        RefundRequest request = getById(id);
        String oldStatus = request.getStatus();

        request.setStatus("REJECTED");
        request.setProcessedBy(SecurityUtils.getCurrentUserId());
        request.setProcessedAt(LocalDateTime.now());
        request.setProcessRemark(processRemark);

        operationPanelService.logStatusFlow("REFUND", id, oldStatus, "REJECTED", processRemark);

        return refundRequestRepository.save(request);
    }

    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void checkAbnormalRefunds() {
        List<RefundRequest> abnormal = refundRequestRepository.findByReminderSentFalseAndHoursWrittenBackFalse();
        for (RefundRequest request : abnormal) {
            if (request.getCreatedAt().plusDays(3).isBefore(LocalDateTime.now())) {
                try {
                    sendReminder(request.getId());
                } catch (Exception e) {
                    log.error("发送退款异常提醒失败, refundId={}", request.getId(), e);
                }
            }
        }
    }
}
