package com.approval.workflow.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "delay_records", indexes = {
    @Index(name = "idx_delay_req", columnList = "requirementId"),
    @Index(name = "idx_delay_dept", columnList = "deptId")
})
@EntityListeners(AuditingEntityListener.class)
public class DelayRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "requirement_id", nullable = false)
    private Long requirementId;

    @Column(name = "node_id")
    private Long nodeId;

    @Column(name = "dept_id")
    private Long deptId;

    @Column(name = "responsible_dept_id")
    private Long responsibleDeptId;

    @Column(nullable = false, length = 500)
    private String reason;

    @Column(nullable = false)
    private Integer delayDays;

    private LocalDate originalDate;

    private LocalDate newDate;

    @Column(name = "operator_id", nullable = false)
    private Long operatorId;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
