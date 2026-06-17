package com.approval.workflow.entity;

import com.approval.workflow.enums.NodeStatus;
import jakarta.persistence.*;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "node_instances", indexes = {
    @Index(name = "idx_node_req", columnList = "requirementId"),
    @Index(name = "idx_node_status", columnList = "status"),
    @Index(name = "idx_node_assignee", columnList = "assigneeId")
})
@EntityListeners(AuditingEntityListener.class)
public class NodeInstance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "requirement_id", nullable = false)
    private Long requirementId;

    @Column(name = "node_def_id", nullable = false)
    private Long nodeDefId;

    @Column(nullable = false, length = 100)
    private String nodeName;

    @Column(nullable = false)
    private Integer nodeOrder;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NodeStatus status = NodeStatus.PENDING;

    @Column(name = "assignee_id")
    private Long assigneeId;

    @Column(name = "assignee_dept_id")
    private Long assigneeDeptId;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private LocalDateTime dueTime;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(length = 500)
    private String delayReason;

    @Column(name = "is_stuck")
    private Boolean stuck = false;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
