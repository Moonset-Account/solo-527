package com.rider.analyzer.repository;

import com.rider.analyzer.entity.SettlementRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface SettlementRecordRepository extends JpaRepository<SettlementRecord, Long> {

    List<SettlementRecord> findByOrderId(Long orderId);

    List<SettlementRecord> findByRiderId(Long riderId);

    Long countByAccuracyFlag(Integer accuracyFlag);

    List<SettlementRecord> findByCreateTimeBetween(LocalDateTime start, LocalDateTime end);
}
