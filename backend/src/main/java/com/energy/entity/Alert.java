package com.energy.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "alerts", indexes = {
    @Index(name = "idx_alerts_status", columnList = "status"),
    @Index(name = "idx_alerts_meter", columnList = "meter_id"),
    @Index(name = "idx_alerts_time", columnList = "alert_time")
})
public class Alert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "alert_no", nullable = false, unique = true, length = 64)
    private String alertNo;

    @Column(name = "meter_id", nullable = false)
    private Long meterId;

    @Column(name = "alert_type", nullable = false, length = 32)
    private String alertType;

    @Column(name = "alert_level", nullable = false, length = 32)
    private String alertLevel;

    @Column(name = "alert_content", nullable = false, columnDefinition = "TEXT")
    private String alertContent;

    @Column(name = "trigger_value", precision = 18, scale = 4)
    private BigDecimal triggerValue;

    @Column(name = "threshold_value", precision = 18, scale = 4)
    private BigDecimal thresholdValue;

    @Column(name = "alert_time", nullable = false)
    private LocalDateTime alertTime;

    @Column(nullable = false, length = 32)
    private String status = "PENDING";

    @Column(length = 64)
    private String assignee;

    @Column(name = "assign_time")
    private LocalDateTime assignTime;

    @Column(name = "strategy_id")
    private Long strategyId;

    @Column(name = "strategy_version", length = 32)
    private String strategyVersion;

    @Column(name = "create_time", nullable = false)
    private LocalDateTime createTime = LocalDateTime.now();

    @Column(name = "update_time", nullable = false)
    private LocalDateTime updateTime = LocalDateTime.now();
}
