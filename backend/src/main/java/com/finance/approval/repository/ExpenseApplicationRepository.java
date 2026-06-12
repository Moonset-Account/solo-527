package com.finance.approval.repository;

import com.finance.approval.entity.ExpenseApplication;
import com.finance.approval.enums.ApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseApplicationRepository extends JpaRepository<ExpenseApplication, Long> {

    Page<ExpenseApplication> findByApplicantId(Long applicantId, Pageable pageable);

    Page<ExpenseApplication> findByStatus(ApplicationStatus status, Pageable pageable);

    Page<ExpenseApplication> findByCurrentNodeId(Long currentNodeId, Pageable pageable);

    Page<ExpenseApplication> findByDepartmentAndStatus(String department, ApplicationStatus status, Pageable pageable);

    Page<ExpenseApplication> findByAmountBetweenAndExpenseType(BigDecimal min, BigDecimal max, String expenseType, Pageable pageable);

    Optional<ExpenseApplication> findByApplicationNo(String applicationNo);

    @Query("SELECT a FROM ExpenseApplication a WHERE a.applicantId = :applicantId " +
           "AND (:status IS NULL OR a.status = :status) " +
           "AND (:keyword IS NULL OR :keyword = '' OR " +
           "a.title LIKE %:keyword% OR a.applicationNo LIKE %:keyword%)")
    Page<ExpenseApplication> findMyApplications(
            @Param("applicantId") Long applicantId,
            @Param("status") ApplicationStatus status,
            @Param("keyword") String keyword,
            Pageable pageable);

    @Query("SELECT a FROM ExpenseApplication a JOIN ApprovalNode n ON a.currentNodeId = n.id " +
           "WHERE (n.approverRole = :roleCode OR n.approverUserId = :approverId) " +
           "AND a.status = 'PENDING'")
    Page<ExpenseApplication> findApplicationsForApprover(
            @Param("approverId") Long approverId,
            @Param("roleCode") com.finance.approval.enums.RoleCode roleCode,
            Pageable pageable);

    @Query("SELECT COUNT(a) FROM ExpenseApplication a WHERE a.status = :status")
    long countByStatus(@Param("status") ApplicationStatus status);

    @Query("SELECT COUNT(a) FROM ExpenseApplication a WHERE a.applicantId = :applicantId AND a.status = :status")
    long countByApplicantIdAndStatus(@Param("applicantId") Long applicantId, @Param("status") ApplicationStatus status);

    @Query("SELECT COALESCE(SUM(a.amount), 0) FROM ExpenseApplication a WHERE a.status = 'APPROVED' " +
           "AND a.completedAt BETWEEN :start AND :end")
    BigDecimal getTotalApprovedAmount(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT a.expenseType, COALESCE(SUM(a.amount), 0) FROM ExpenseApplication a " +
           "WHERE a.status = 'APPROVED' AND a.completedAt BETWEEN :start AND :end " +
           "GROUP BY a.expenseType")
    List<Object[]> getExpenseStatisticsByType(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
