package com.pm.workstation.repository;

import com.pm.workstation.entity.ProcessInstanceNode;
import com.pm.workstation.enums.NodeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProcessInstanceNodeRepository extends JpaRepository<ProcessInstanceNode, Long> {

    List<ProcessInstanceNode> findByInstanceId(Long instanceId);

    List<ProcessInstanceNode> findByInstanceIdAndStatus(Long instanceId, NodeStatus status);

    List<ProcessInstanceNode> findByAssigneeIdAndStatus(Long assigneeId, NodeStatus status);

    List<ProcessInstanceNode> findByNodeId(Long nodeId);
}
