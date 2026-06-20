package com.datagrowth.portal.repository;

import com.datagrowth.portal.entity.ApprovalRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApprovalRequestRepository extends JpaRepository<ApprovalRequest, Long> {
    Page<ApprovalRequest> findByUserId(Long userId, Pageable pageable);
    Page<ApprovalRequest> findByStatus(String status, Pageable pageable);
    Page<ApprovalRequest> findByApproverId(Long approverId, Pageable pageable);
    
    @Query("SELECT a FROM ApprovalRequest a WHERE a.status = :status AND a.userId = :userId")
    Page<ApprovalRequest> findByStatusAndUserId(@Param("status") String status, @Param("userId") Long userId, Pageable pageable);
    
    List<ApprovalRequest> findByStatusIn(List<String> statuses);
    
    @Query("SELECT COUNT(a) FROM ApprovalRequest a WHERE a.status = :status")
    long countByStatus(@Param("status") String status);
}
