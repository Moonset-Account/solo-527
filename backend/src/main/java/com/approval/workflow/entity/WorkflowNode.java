package com.approval.workflow.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "workflow_nodes")
public class WorkflowNode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "workflow_id", nullable = false)
    private Long workflowId;

    @Column(nullable = false, length = 100)
    private String nodeName;

    @Column(length = 500)
    private String nodeDescription;

    @Column(nullable = false)
    private Integer nodeOrder;

    @Column(length = 50)
    private String assigneeRole;

    @Column(name = "assignee_dept_id")
    private Long assigneeDeptId;

    @Column(name = "assignee_user_id")
    private Long assigneeUserId;

    @Column(nullable = false)
    private Integer daysLimit = 3;
}
