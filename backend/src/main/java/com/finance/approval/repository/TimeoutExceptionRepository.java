package com.finance.approval.repository;

import com.finance.approval.entity.TimeoutException;
import com.finance.approval.enums.TimeoutStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TimeoutExceptionRepository extends JpaRepository<TimeoutException, Long> {

    Page<TimeoutException> findByStatus(TimeoutStatus status, Pageable pageable);

    List<TimeoutException> findByApplicationId(Long applicationId);

    Page<TimeoutException> findByApproverId(Long approverId, Pageable pageable);

    @Query("SELECT t FROM TimeoutException t WHERE t.dueTime <= :now AND t.status = 'PENDING'")
    List<TimeoutException> findPendingTimeouts(@Param("now") LocalDateTime now);

    boolean existsByApplicationIdAndNodeIdAndStatus(Long applicationId, Long nodeId, TimeoutStatus status);

    @Query("SELECT COUNT(t) FROM TimeoutException t WHERE t.status = :status")
    long countByStatus(@Param("status") TimeoutStatus status);

    @Query("SELECT t.approverId, COUNT(t) FROM TimeoutException t GROUP BY t.approverId")
    List<Object[]> getTimeoutCountByApprover();
}
