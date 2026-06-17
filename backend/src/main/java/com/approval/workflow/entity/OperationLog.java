package com.approval.workflow.entity;

import com.approval.workflow.enums.OperationType;
import jakarta.persistence.*;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "operation_logs", indexes = {
    @Index(name = "idx_log_req", columnList = "requirementId"),
    @Index(name = "idx_log_operator", columnList = "operatorId"),
    @Index(name = "idx_log_type", columnList = "operationType"),
    @Index(name = "idx_log_time", columnList = "createdAt")
})
@EntityListeners(AuditingEntityListener.class)
public class OperationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "requirement_id")
    private Long requirementId;

    @Column(name = "node_id")
    private Long nodeId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OperationType operationType;

    @Column(name = "operator_id", nullable = false)
    private Long operatorId;

    @Column(length = 50)
    private String operatorName;

    @Column(columnDefinition = "TEXT")
    private String detail;

    @Column(name = "before_status", length = 30)
    private String beforeStatus;

    @Column(name = "after_status", length = 30)
    private String afterStatus;

    @Column(length = 500)
    private String remark;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
