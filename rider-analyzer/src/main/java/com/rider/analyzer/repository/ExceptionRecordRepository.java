package com.rider.analyzer.repository;

import com.rider.analyzer.entity.ExceptionRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExceptionRecordRepository extends JpaRepository<ExceptionRecord, Long> {

    List<ExceptionRecord> findByTypeAndStatus(String type, String status);

    List<ExceptionRecord> findByOrderId(Long orderId);

    List<ExceptionRecord> findByStatus(String status);
}
