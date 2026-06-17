package com.approval.workflow.entity;

import com.approval.workflow.enums.RequirementStatus;
import jakarta.persistence.*;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "requirements", indexes = {
    @Index(name = "idx_requirement_status", columnList = "status"),
    @Index(name = "idx_requirement_dept", columnList = "deptId"),
    @Index(name = "idx_requirement_creator", columnList = "creatorId"),
    @Index(name = "idx_requirement_assignee", columnList = "assigneeId"),
    @Index(name = "idx_requirement_priority", columnList = "priority")
})
@EntityListeners(AuditingEntityListener.class)
public class Requirement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 50)
    private String category;

    @Column(nullable = false)
    private Integer priority = 3;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RequirementStatus status = RequirementStatus.DRAFT;

    @Column(name = "dept_id")
    private Long deptId;

    @Column(name = "creator_id", nullable = false)
    private Long creatorId;

    @Column(name = "assignee_id")
    private Long assigneeId;

    private LocalDate expectedDate;

    private LocalDate actualDate;

    @Column(name = "merged_to_id")
    private Long mergedToId;

    @Column(name = "workflow_id")
    private Long workflowId;

    @Column(length = 500)
    private String tags;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
