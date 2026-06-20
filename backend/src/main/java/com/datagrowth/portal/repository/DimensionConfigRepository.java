package com.datagrowth.portal.repository;

import com.datagrowth.portal.entity.DimensionConfig;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DimensionConfigRepository extends JpaRepository<DimensionConfig, Long> {
    Optional<DimensionConfig> findByDimensionCode(String dimensionCode);
    List<DimensionConfig> findByEnabledTrue();
    Page<DimensionConfig> findByEnabled(Boolean enabled, Pageable pageable);
    Page<DimensionConfig> findByDimensionNameContaining(String dimensionName, Pageable pageable);
}
