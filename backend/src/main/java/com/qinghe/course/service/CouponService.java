package com.qinghe.course.service;

import com.qinghe.course.common.PageResult;
import com.qinghe.course.common.QueryParams;
import com.qinghe.course.entity.Coupon;
import com.qinghe.course.repository.CouponRepository;
import com.qinghe.course.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;
    private final OperationPanelService operationPanelService;

    public PageResult<Coupon> search(QueryParams params) {
        Pageable pageable = PageRequest.of(params.getPageNum() - 1, params.getPageSize());
        Page<Coupon> page = couponRepository.search(
                params.getKeyword(),
                params.getStatus(),
                params.getStartTime(),
                params.getEndTime(),
                pageable
        );
        return new PageResult<>(page.getContent(), page.getTotalElements(), params.getPageNum(), params.getPageSize());
    }

    public Coupon getById(Long id) {
        return couponRepository.findById(id).orElseThrow(() -> new RuntimeException("优惠券不存在"));
    }

    public Coupon getByCode(String code) {
        return couponRepository.findByCode(code).orElseThrow(() -> new RuntimeException("优惠券不存在"));
    }

    @Transactional
    public Coupon create(Coupon coupon) {
        coupon.setCreatedBy(SecurityUtils.getCurrentUserId());
        coupon.setStatus(coupon.getStatus() != null ? coupon.getStatus() : "ACTIVE");
        return couponRepository.save(coupon);
    }

    @Transactional
    public Coupon update(Long id, Coupon coupon) {
        Coupon existing = getById(id);
        String oldStatus = existing.getStatus();

        if (coupon.getName() != null) existing.setName(coupon.getName());
        if (coupon.getType() != null) existing.setType(coupon.getType());
        if (coupon.getDiscountValue() != null) existing.setDiscountValue(coupon.getDiscountValue());
        if (coupon.getMinAmount() != null) existing.setMinAmount(coupon.getMinAmount());
        if (coupon.getTotalCount() != null) existing.setTotalCount(coupon.getTotalCount());
        if (coupon.getStartTime() != null) existing.setStartTime(coupon.getStartTime());
        if (coupon.getEndTime() != null) existing.setEndTime(coupon.getEndTime());
        if (coupon.getCourseIds() != null) existing.setCourseIds(coupon.getCourseIds());

        if (coupon.getStatus() != null && !coupon.getStatus().equals(oldStatus)) {
            existing.setStatus(coupon.getStatus());
            operationPanelService.logStatusFlow("COUPON", id, oldStatus, coupon.getStatus(), "优惠券状态变更");
        }

        return couponRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        couponRepository.deleteById(id);
    }
}
