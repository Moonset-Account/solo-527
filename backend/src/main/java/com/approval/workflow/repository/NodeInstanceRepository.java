package com.approval.workflow.repository;

import com.approval.workflow.entity.NodeInstance;
import com.approval.workflow.enums.NodeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NodeInstanceRepository extends JpaRepository<NodeInstance, Long>, JpaSpecificationExecutor<NodeInstance> {

    List<NodeInstance> findByRequirementIdOrderByNodeOrder(Long requirementId);

    Optional<NodeInstance> findByRequirementIdAndNodeOrder(Long requirementId, Integer nodeOrder);

    List<NodeInstance> findByAssigneeIdAndStatus(Long assigneeId, NodeStatus status);

    List<NodeInstance> findByAssigneeDeptIdAndStatus(Long assigneeDeptId, NodeStatus status);

    @Query("SELECT n FROM NodeInstance n WHERE n.status = :status AND n.assigneeDeptId IN :deptIds")
    List<NodeInstance> findByStatusAndAssigneeDeptIdIn(@Param("status") NodeStatus status,
                                                        @Param("deptIds") List<Long> deptIds);

    @Query("SELECT COUNT(n) FROM NodeInstance n WHERE n.assigneeId = :assigneeId AND n.status = :status")
    long countByAssigneeIdAndStatus(@Param("assigneeId") Long assigneeId, @Param("status") NodeStatus status);

    @Query("SELECT n FROM NodeInstance n WHERE n.status = :status AND n.stuck = true")
    List<NodeInstance> findByStatusAndStuckTrue(@Param("status") NodeStatus status);

    List<NodeInstance> findByRequirementIdIn(List<Long> requirementIds);
}
