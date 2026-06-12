package com.finance.approval.entity;

import com.finance.approval.enums.ApprovalAction;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "approval_record")
@EntityListeners(AuditingEntityListener.class)
public class ApprovalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long applicationId;

    @Column(nullable = false)
    private Long nodeId;

    @Column(length = 50)
    private String nodeName;

    @Column(nullable = false)
    private Long approverId;

    @Column(length = 50)
    private String approverName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ApprovalAction action;

    @Column(length = 500)
    private String opinion;

    private LocalDateTime approvalTime;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
