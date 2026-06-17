package com.citytour.inventory.repository;

import com.citytour.inventory.entity.ReminderRule;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReminderRuleRepository extends JpaRepository<ReminderRule, Long> {

    Optional<ReminderRule> findByRuleCode(String ruleCode);

    List<ReminderRule> findByRuleTypeAndEnabledTrue(String ruleType);

    @Query("SELECT r FROM ReminderRule r WHERE " +
           "(:ruleCode IS NULL OR r.ruleCode LIKE %:ruleCode%) AND " +
           "(:ruleName IS NULL OR r.ruleName LIKE %:ruleName%) AND " +
           "(:ruleType IS NULL OR r.ruleType = :ruleType) AND " +
           "(:enabled IS NULL OR r.enabled = :enabled)")
    Page<ReminderRule> findByConditions(@Param("ruleCode") String ruleCode,
                                       @Param("ruleName") String ruleName,
                                       @Param("ruleType") String ruleType,
                                       @Param("enabled") Boolean enabled,
                                       Pageable pageable);
}
