package com.qinghe.course.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "distribution_commission")
public class DistributionCommission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long orderId;
    private Long distributorId;

    @Column(precision = 10, scale = 2)
    private BigDecimal orderAmount;

    @Column(precision = 5, scale = 2)
    private BigDecimal commissionRate;

    @Column(precision = 10, scale = 2)
    private BigDecimal commissionAmount;

    private LocalDateTime settledAt;
    private String status;

    @Column(columnDefinition = "text")
    private String remark;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
