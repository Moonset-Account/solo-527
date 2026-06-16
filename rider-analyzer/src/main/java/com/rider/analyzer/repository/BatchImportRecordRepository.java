package com.rider.analyzer.repository;

import com.rider.analyzer.entity.BatchImportRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BatchImportRecordRepository extends JpaRepository<BatchImportRecord, Long> {

    Optional<BatchImportRecord> findByBatchNo(String batchNo);
}
