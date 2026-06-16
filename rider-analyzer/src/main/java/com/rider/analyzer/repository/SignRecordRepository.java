package com.rider.analyzer.repository;

import com.rider.analyzer.entity.SignRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SignRecordRepository extends JpaRepository<SignRecord, Long> {

    List<SignRecord> findByOrderId(Long orderId);

    List<SignRecord> findByDiffQtyGreaterThan(Integer diffQty);
}
