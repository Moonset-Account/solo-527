package com.qinghe.course.service;

import com.qinghe.course.common.PageResult;
import com.qinghe.course.common.QueryParams;
import com.qinghe.course.entity.DistributionCommission;
import com.qinghe.course.repository.DistributionCommissionRepository;
import com.qinghe.course.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class DistributionService {

    private final DistributionCommissionRepository commissionRepository;
    private final OperationPanelService operationPanelService;

    public PageResult<DistributionCommission> search(QueryParams params) {
        Pageable pageable = PageRequest.of(params.getPageNum() - 1, params.getPageSize());
        Page<DistributionCommission> page = commissionRepository.search(
                SecurityUtils.getCurrentUser().isAdmin() ? null : SecurityUtils.getCurrentUserId(),
                params.getStatus(),
                params.getStartTime(),
                params.getEndTime(),
                pageable
        );
        return new PageResult<>(page.getContent(), page.getTotalElements(), params.getPageNum(), params.getPageSize());
    }

    public DistributionCommission getById(Long id) {
        return commissionRepository.findById(id).orElseThrow(() -> new RuntimeException("佣金记录不存在"));
    }

    @Transactional
    public DistributionCommission create(DistributionCommission commission) {
        if (commission.getCommissionRate() != null && commission.getOrderAmount() != null) {
            commission.setCommissionAmount(
                    commission.getOrderAmount()
                            .multiply(commission.getCommissionRate())
                            .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP)
            );
        }
        commission.setStatus("PENDING");
        return commissionRepository.save(commission);
    }

    @Transactional
    public DistributionCommission settle(Long id, String remark) {
        DistributionCommission commission = getById(id);
        String oldStatus = commission.getStatus();

        commission.setStatus("SETTLED");
        commission.setSettledAt(LocalDateTime.now());
        commission.setRemark(remark);

        operationPanelService.logStatusFlow("COMMISSION", id, oldStatus, "SETTLED", remark);

        return commissionRepository.save(commission);
    }
}
