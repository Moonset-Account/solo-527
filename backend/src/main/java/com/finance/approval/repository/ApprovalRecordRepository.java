package com.finance.approval.repository;

import com.finance.approval.entity.ApprovalRecord;
import com.finance.approval.enums.ApprovalAction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ApprovalRecordRepository extends JpaRepository<ApprovalRecord, Long> {

    List<ApprovalRecord> findByApplicationIdOrderByCreatedAtAsc(Long applicationId);

    Page<ApprovalRecord> findByApproverId(Long approverId, Pageable pageable);

    Optional<ApprovalRecord> findByApplicationIdAndNodeId(Long applicationId, Long nodeId);

    Page<ApprovalRecord> findByApproverIdAndAction(Long approverId, ApprovalAction action, Pageable pageable);

    @Query("SELECT AVG(TIMESTAMPDIFF(SECOND, r.createdAt, r.approvalTime)) FROM ApprovalRecord r " +
           "WHERE r.approvalTime IS NOT NULL AND r.createdAt BETWEEN :start AND :end")
    Double getAverageApprovalTime(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT r.approverId, COUNT(r) FROM ApprovalRecord r WHERE r.action = 'APPROVE' " +
           "AND r.createdAt BETWEEN :start AND :end GROUP BY r.approverId")
    List<Object[]> getApprovalCountByApprover(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
