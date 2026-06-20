package com.datagrowth.portal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "anomaly_record")
public class AnomalyRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String metricName;

    @Column(length = 50)
    private String dimension;

    @Column(length = 100)
    private String dimensionValue;

    @Column(precision = 20, scale = 4)
    private BigDecimal currentValue;

    @Column(precision = 20, scale = 4)
    private BigDecimal expectedValue;

    @Column(precision = 10, scale = 4)
    private BigDecimal deviationRate;

    @Column(nullable = false, length = 20)
    private String severity;

    @Column(length = 1000)
    private String anomalyReason;

    @Column(length = 1000)
    private String suggestion;

    @Column(length = 20)
    private String status;

    private LocalDateTime anomalyTime;

    @Column(length = 50)
    private String handledBy;

    private LocalDateTime handledAt;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
