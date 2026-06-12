package com.finance.approval.entity;

import com.finance.approval.enums.RoleCode;
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
@Table(name = "approval_node")
@EntityListeners(AuditingEntityListener.class)
public class ApprovalNode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long ruleId;

    @Column(nullable = false, length = 50)
    private String nodeName;

    @Column(nullable = false)
    private Integer nodeOrder;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private RoleCode approverRole;

    private Long approverUserId;

    private Integer timeoutHours;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
