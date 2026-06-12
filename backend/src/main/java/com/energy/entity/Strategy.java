package com.energy.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "strategies")
public class Strategy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "strategy_name", nullable = false, length = 128)
    private String strategyName;

    @Column(name = "strategy_code", nullable = false, unique = true, length = 64)
    private String strategyCode;

    @Column(nullable = false, length = 32)
    private String version;

    @Column(name = "strategy_type", nullable = false, length = 32)
    private String strategyType;

    @Column(name = "alert_type", length = 32)
    private String alertType;

    @Column(name = "threshold_value", precision = 18, scale = 4)
    private BigDecimal thresholdValue;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "effective_time")
    private LocalDateTime effectiveTime;

    @Column(name = "expire_time")
    private LocalDateTime expireTime;

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;

    @Column(name = "create_by", length = 64)
    private String createBy;

    @Column(name = "create_time", nullable = false)
    private LocalDateTime createTime = LocalDateTime.now();

    @Column(name = "update_time", nullable = false)
    private LocalDateTime updateTime = LocalDateTime.now();
}
