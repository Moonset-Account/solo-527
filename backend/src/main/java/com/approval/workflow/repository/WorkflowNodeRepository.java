package com.approval.workflow.repository;

import com.approval.workflow.entity.WorkflowNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkflowNodeRepository extends JpaRepository<WorkflowNode, Long> {

    List<WorkflowNode> findByWorkflowIdOrderByNodeOrder(Long workflowId);
}
