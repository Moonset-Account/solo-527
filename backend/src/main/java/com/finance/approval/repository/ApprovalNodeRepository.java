package com.finance.approval.repository;

import com.finance.approval.entity.ApprovalNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApprovalNodeRepository extends JpaRepository<ApprovalNode, Long> {

    List<ApprovalNode> findByRuleIdOrderByNodeOrderAsc(Long ruleId);

    Optional<ApprovalNode> findByRuleIdAndNodeOrder(Long ruleId, Integer nodeOrder);

    @Modifying
    @Query("DELETE FROM ApprovalNode n WHERE n.ruleId = :ruleId")
    void deleteByRuleId(@Param("ruleId") Long ruleId);
}
