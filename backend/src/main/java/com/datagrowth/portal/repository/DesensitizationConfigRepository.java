package com.datagrowth.portal.repository;

import com.datagrowth.portal.entity.DesensitizationConfig;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DesensitizationConfigRepository extends JpaRepository<DesensitizationConfig, Long> {
    List<DesensitizationConfig> findByDatasetCodeAndEnabledTrue(String datasetCode);
    Page<DesensitizationConfig> findByDatasetCodeContaining(String datasetCode, Pageable pageable);
    Page<DesensitizationConfig> findByEnabled(Boolean enabled, Pageable pageable);
}
