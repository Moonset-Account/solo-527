package com.datagrowth.portal.repository;

import com.datagrowth.portal.entity.DatasetPermission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DatasetPermissionRepository extends JpaRepository<DatasetPermission, Long> {
    List<DatasetPermission> findByRoleIdAndEnabledTrue(Long roleId);
    Page<DatasetPermission> findByDatasetCodeContaining(String datasetCode, Pageable pageable);
    Page<DatasetPermission> findByEnabled(Boolean enabled, Pageable pageable);
    List<DatasetPermission> findByRoleIdInAndEnabledTrue(List<Long> roleIds);
}
