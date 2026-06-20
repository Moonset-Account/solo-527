package com.datagrowth.portal.repository;

import com.datagrowth.portal.entity.AlertRule;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertRuleRepository extends JpaRepository<AlertRule, Long> {
    Page<AlertRule> findByEnabled(Boolean enabled, Pageable pageable);
    List<AlertRule> findByEnabledTrue();
    Page<AlertRule> findByMetricNameContaining(String metricName, Pageable pageable);
    Page<AlertRule> findBySeverity(String severity, Pageable pageable);
}
