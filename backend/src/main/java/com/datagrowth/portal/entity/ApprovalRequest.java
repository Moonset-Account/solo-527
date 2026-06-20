package com.datagrowth.portal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "approval_request")
public class ApprovalRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, length = 50)
    private String requestType;

    @Column(nullable = false)
    private Long targetId;

    @Column(length = 50)
    private String targetName;

    @Column(length = 500)
    private String reason;

    @Column(nullable = false, length = 20)
    private String status;

    private Long approverId;

    @Column(length = 500)
    private String approvalComment;

    private LocalDateTime approvedAt;

    @Column(length = 50)
    private String dataLevel;

    private LocalDateTime validFrom;

    private LocalDateTime validTo;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
