package com.finance.approval.repository;

import com.finance.approval.entity.ApprovalRule;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ApprovalRuleRepository extends JpaRepository<ApprovalRule, Long> {

    List<ApprovalRule> findByExpenseTypeAndEnabled(String expenseType, Boolean enabled);

    List<ApprovalRule> findByDepartmentAndEnabled(String department, Boolean enabled);

    List<ApprovalRule> findByMinAmountLessThanEqualAndMaxAmountGreaterThanEqualAndEnabled(BigDecimal amount, BigDecimal amount2, Boolean enabled);

    Page<ApprovalRule> findAllByEnabled(Boolean enabled, Pageable pageable);

    @Query("SELECT r FROM ApprovalRule r WHERE r.enabled = true " +
           "AND (:expenseType IS NULL OR r.expenseType = :expenseType) " +
           "AND (:department IS NULL OR r.department = :department) " +
           "AND r.minAmount <= :amount AND r.maxAmount >= :amount " +
           "ORDER BY r.maxAmount ASC")
    List<ApprovalRule> findMatchingRules(
            @Param("amount") BigDecimal amount,
            @Param("expenseType") String expenseType,
            @Param("department") String department);

    @Query("SELECT r FROM ApprovalRule r WHERE (:keyword IS NULL OR :keyword = '' OR " +
           "r.ruleName LIKE %:keyword%)")
    Page<ApprovalRule> findByKeyword(@Param("keyword") String keyword, Pageable pageable);
}
