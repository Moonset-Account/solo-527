package com.carcore.admin.repository;

import com.carcore.admin.entity.ExceptionRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExceptionRecordRepository extends JpaRepository<ExceptionRecord, Long> {

    Optional<ExceptionRecord> findByExceptionNo(String exceptionNo);

    List<ExceptionRecord> findByBatchOperationId(Long batchOperationId);

    List<ExceptionRecord> findByStatus(Integer status);

    @Query("SELECT e FROM ExceptionRecord e WHERE " +
           "(:exceptionNo IS NULL OR :exceptionNo = '' OR e.exceptionNo LIKE %:exceptionNo%) " +
           "AND (:exceptionType IS NULL OR :exceptionType = '' OR e.exceptionType = :exceptionType) " +
           "AND (:sourceType IS NULL OR :sourceType = '' OR e.sourceType = :sourceType) " +
           "AND (:batchOperationId IS NULL OR e.batchOperationId = :batchOperationId) " +
           "AND (:status IS NULL OR e.status = :status)")
    Page<ExceptionRecord> findByConditions(@Param("exceptionNo") String exceptionNo,
                                           @Param("exceptionType") String exceptionType,
                                           @Param("sourceType") String sourceType,
                                           @Param("batchOperationId") Long batchOperationId,
                                           @Param("status") Integer status,
                                           Pageable pageable);
}
