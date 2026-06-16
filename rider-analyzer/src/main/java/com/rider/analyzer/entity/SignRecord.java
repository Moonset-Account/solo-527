package com.rider.analyzer.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "sign_record")
public class SignRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "expected_qty", nullable = false)
    private Integer expectedQty = 0;

    @Column(name = "actual_qty", nullable = false)
    private Integer actualQty = 0;

    @Column(name = "diff_qty", nullable = false)
    private Integer diffQty = 0;

    @Column(name = "diff_reason", length = 256)
    private String diffReason;

    @Column(name = "sign_type", length = 20)
    private String signType;

    @Column(name = "create_time", nullable = false, updatable = false)
    private LocalDateTime createTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
    }
}
