package com.qinghe.course.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "refund_request")
public class RefundRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long orderId;
    private Long userId;

    @Column(precision = 10, scale = 2)
    private BigDecimal refundAmount;

    @Column(columnDefinition = "text")
    private String refundReason;

    @Column(precision = 10, scale = 1)
    private BigDecimal consumedHours;

    private Boolean hoursWrittenBack;
    private Boolean reminderSent;
    private LocalDateTime reminderSentAt;
    private Long processedBy;
    private LocalDateTime processedAt;

    @Column(columnDefinition = "text")
    private String processRemark;

    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (hoursWrittenBack == null) hoursWrittenBack = false;
        if (reminderSent == null) reminderSent = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
