package com.carcore.admin.repository;

import com.carcore.admin.entity.BatchOperation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BatchOperationRepository extends JpaRepository<BatchOperation, Long> {

    Optional<BatchOperation> findByBatchNo(String batchNo);

    @Query("SELECT b FROM BatchOperation b WHERE " +
           "(:batchNo IS NULL OR :batchNo = '' OR b.batchNo LIKE %:batchNo%) " +
           "AND (:operationType IS NULL OR :operationType = '' OR b.operationType = :operationType) " +
           "AND (:targetType IS NULL OR :targetType = '' OR b.targetType = :targetType) " +
           "AND (:status IS NULL OR b.status = :status)")
    Page<BatchOperation> findByConditions(@Param("batchNo") String batchNo,
                                          @Param("operationType") String operationType,
                                          @Param("targetType") String targetType,
                                          @Param("status") Integer status,
                                          Pageable pageable);
}
