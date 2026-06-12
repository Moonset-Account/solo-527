package com.energy.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "peak_loads", indexes = {
    @Index(name = "idx_peak_loads_area_time", columnList = "area, peak_time")
})
public class PeakLoad {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64)
    private String area;

    @Column(name = "peak_time", nullable = false)
    private LocalDateTime peakTime;

    @Column(name = "peak_value", nullable = false, precision = 18, scale = 4)
    private BigDecimal peakValue;

    @Column(name = "avg_value", precision = 18, scale = 4)
    private BigDecimal avgValue;

    @Column(name = "meter_count")
    private Integer meterCount;

    @Column(name = "related_strategy_id")
    private Long relatedStrategyId;

    @Column(name = "strategy_failure")
    private Boolean strategyFailure = false;

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;

    @Column(name = "create_time", nullable = false)
    private LocalDateTime createTime = LocalDateTime.now();
}
