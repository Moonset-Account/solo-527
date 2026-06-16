package com.rider.analyzer.service;

import com.rider.analyzer.dto.DashboardStatsDTO;
import com.rider.analyzer.repository.DeliveryOrderRepository;
import com.rider.analyzer.repository.ExceptionRecordRepository;
import com.rider.analyzer.repository.SettlementRecordRepository;
import com.rider.analyzer.repository.TimelinessNodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final DeliveryOrderRepository deliveryOrderRepository;
    private final TimelinessNodeRepository timelinessNodeRepository;
    private final ExceptionRecordRepository exceptionRecordRepository;
    private final SettlementRecordRepository settlementRecordRepository;

    public DashboardStatsDTO getStats() {
        DashboardStatsDTO dto = new DashboardStatsDTO();

        long totalOrders = deliveryOrderRepository.count();
        long signedOrders = deliveryOrderRepository.findByStatus("SIGNED").size();
        long timeoutOrders = timelinessNodeRepository.findByIsTimeoutAndCreateTimeBetween(
                1, java.time.LocalDateTime.now().minusDays(30), java.time.LocalDateTime.now()
        ).size();
        long exceptionCount = exceptionRecordRepository.count();

        dto.setTotalOrders(totalOrders);
        dto.setSignedOrders(signedOrders);
        dto.setTimeoutOrders(timeoutOrders);
        dto.setExceptionCount(exceptionCount);
        dto.setSettlementAccuracy(getSettlementAccuracy());

        return dto;
    }

    public BigDecimal getSettlementAccuracy() {
        long total = settlementRecordRepository.count();
        if (total == 0) {
            return BigDecimal.valueOf(100.0).setScale(2, RoundingMode.HALF_UP);
        }
        long accurateCount = settlementRecordRepository.countByAccuracyFlag(1);
        return BigDecimal.valueOf(accurateCount)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
    }
}
