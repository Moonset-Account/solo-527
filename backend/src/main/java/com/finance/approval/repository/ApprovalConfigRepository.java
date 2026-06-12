package com.finance.approval.repository;

import com.finance.approval.entity.ApprovalConfig;
import com.finance.approval.enums.ConfigType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApprovalConfigRepository extends JpaRepository<ApprovalConfig, Long> {

    List<ApprovalConfig> findByConfigType(ConfigType configType);

    List<ApprovalConfig> findByConfigTypeAndEnabled(ConfigType configType, Boolean enabled);

    Optional<ApprovalConfig> findByConfigTypeAndConfigKey(ConfigType configType, String configKey);

    Page<ApprovalConfig> findAllByOrderByConfigTypeAscSortOrderAsc(Pageable pageable);

    boolean existsByConfigTypeAndConfigKey(ConfigType configType, String configKey);
}
