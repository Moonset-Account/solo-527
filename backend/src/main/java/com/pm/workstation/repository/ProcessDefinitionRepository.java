package com.pm.workstation.repository;

import com.pm.workstation.entity.ProcessDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProcessDefinitionRepository extends JpaRepository<ProcessDefinition, Long> {

    List<ProcessDefinition> findByStatus(Integer status);
}
