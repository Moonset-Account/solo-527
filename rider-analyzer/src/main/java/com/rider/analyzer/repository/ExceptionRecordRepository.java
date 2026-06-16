package com.rider.analyzer.repository;

import com.rider.analyzer.entity.ExceptionRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExceptionRecordRepository extends JpaRepository<ExceptionRecord, Long> {

    List<ExceptionRecord> findByTypeAndStatus(String type, String status);

    Page<ExceptionRecord> findByTypeAndStatus(String type, String status, Pageable pageable);

    List<ExceptionRecord> findByOrderId(Long orderId);

    List<ExceptionRecord> findByStatus(String status);

    Page<ExceptionRecord> findByStatus(String status, Pageable pageable);

    List<ExceptionRecord> findByType(String type);

    Page<ExceptionRecord> findByType(String type, Pageable pageable);
}
