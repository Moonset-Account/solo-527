package com.pm.workstation.repository;

import com.pm.workstation.entity.ProcessNode;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProcessNodeRepository extends JpaRepository<ProcessNode, Long> {

    List<ProcessNode> findByDefinitionIdOrderByNodeOrderAsc(Long definitionId);

    List<ProcessNode> findByRoleId(Long roleId);

    long countByDefinitionId(Long definitionId);

    void deleteByDefinitionId(Long definitionId);
}
