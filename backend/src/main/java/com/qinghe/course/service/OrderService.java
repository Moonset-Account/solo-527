package com.qinghe.course.service;

import com.qinghe.course.common.PageResult;
import com.qinghe.course.common.QueryParams;
import com.qinghe.course.entity.CourseOrder;
import com.qinghe.course.entity.Coupon;
import com.qinghe.course.entity.Course;
import com.qinghe.course.entity.LearningProgress;
import com.qinghe.course.repository.CourseOrderRepository;
import com.qinghe.course.repository.CouponRepository;
import com.qinghe.course.repository.CourseRepository;
import com.qinghe.course.repository.LearningProgressRepository;
import com.qinghe.course.repository.CourseClassRepository;
import com.qinghe.course.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final CourseOrderRepository courseOrderRepository;
    private final CouponRepository couponRepository;
    private final CourseRepository courseRepository;
    private final CourseClassRepository courseClassRepository;
    private final LearningProgressRepository learningProgressRepository;
    private final OperationPanelService operationPanelService;

    public PageResult<CourseOrder> search(QueryParams params, Long userId) {
        Pageable pageable = PageRequest.of(params.getPageNum() - 1, params.getPageSize());
        Page<CourseOrder> page = courseOrderRepository.search(
                userId,
                params.getKeyword(),
                params.getStatus(),
                params.getStartTime(),
                params.getEndTime(),
                pageable
        );
        return new PageResult<>(page.getContent(), page.getTotalElements(), params.getPageNum(), params.getPageSize());
    }

    public CourseOrder getById(Long id) {
        return courseOrderRepository.findById(id).orElseThrow(() -> new RuntimeException("订单不存在"));
    }

    @Transactional
    public CourseOrder createOrder(Long courseId, Long classId, Long couponId) {
        Long userId = SecurityUtils.getCurrentUserId();
        Course course = courseRepository.findById(courseId).orElseThrow(() -> new RuntimeException("课程不存在"));

        CourseOrder order = new CourseOrder();
        order.setOrderNo("QH" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        order.setUserId(userId);
        order.setCourseId(courseId);
        order.setClassId(classId);
        order.setOriginalAmount(course.getPrice());

        BigDecimal discountAmount = BigDecimal.ZERO;
        if (couponId != null) {
            Coupon coupon = couponRepository.findById(couponId).orElse(null);
            if (coupon != null && "ACTIVE".equals(coupon.getStatus())) {
                if ("FIXED".equals(coupon.getType())) {
                    discountAmount = coupon.getDiscountValue();
                } else if ("PERCENT".equals(coupon.getType())) {
                    discountAmount = course.getPrice().multiply(coupon.getDiscountValue()).divide(BigDecimal.valueOf(100));
                }
                order.setCouponId(couponId);
                coupon.setUsedCount(coupon.getUsedCount() + 1);
                couponRepository.save(coupon);
            }
        }

        order.setDiscountAmount(discountAmount);
        order.setFinalAmount(course.getPrice().subtract(discountAmount).max(BigDecimal.ZERO));
        order.setStatus("PENDING");

        return courseOrderRepository.save(order);
    }

    @Transactional
    public CourseOrder payOrder(Long orderId) {
        CourseOrder order = getById(orderId);
        String oldStatus = order.getStatus();

        if (!"PENDING".equals(order.getStatus())) {
            throw new RuntimeException("订单状态异常");
        }

        order.setStatus("PAID");
        order.setPaidAt(LocalDateTime.now());

        operationPanelService.logStatusFlow("ORDER", orderId, oldStatus, "PAID", "订单支付成功");

        if (order.getClassId() != null) {
            courseClassRepository.findById(order.getClassId()).ifPresent(cls -> {
                cls.setEnrolledCount(cls.getEnrolledCount() + 1);
                courseClassRepository.save(cls);
            });
        }

        Course course = courseRepository.findById(order.getCourseId()).orElse(null);
        LearningProgress progress = new LearningProgress();
        progress.setUserId(order.getUserId());
        progress.setCourseId(order.getCourseId());
        progress.setClassId(order.getClassId());
        progress.setTotalHours(course != null ? course.getTotalHours() : 0);
        progress.setStatus("IN_PROGRESS");
        learningProgressRepository.save(progress);

        return courseOrderRepository.save(order);
    }

    @Transactional
    public CourseOrder updateStatus(Long id, String status, String remark) {
        CourseOrder order = getById(id);
        String oldStatus = order.getStatus();
        order.setStatus(status);
        operationPanelService.logStatusFlow("ORDER", id, oldStatus, status, remark);
        return courseOrderRepository.save(order);
    }
}
