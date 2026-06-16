package com.pm.workstation.repository;

import com.pm.workstation.entity.ProcessInstance;
import com.pm.workstation.enums.ProcessStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProcessInstanceRepository extends JpaRepository<ProcessInstance, Long> {

    Optional<ProcessInstance> findByRequirementId(Long requirementId);

    List<ProcessInstance> findByStatus(ProcessStatus status);

    List<ProcessInstance> findByDefinitionId(Long definitionId);
}
