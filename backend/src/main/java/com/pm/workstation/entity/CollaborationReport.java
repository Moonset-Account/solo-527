package com.pm.workstation.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "collaboration_report")
public class CollaborationReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private LocalDate reportDate;

    @Column(nullable = false)
    private Integer totalRequirements;

    @Column(nullable = false)
    private Integer completedCount;

    @Column(nullable = false)
    private Integer delayedCount;

    @Column(precision = 5, scale = 4)
    private BigDecimal delayRatio;

    @Column(precision = 8, scale = 2)
    private BigDecimal avgProcessDays;

    @Column(columnDefinition = "JSON")
    private String deptMetrics;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
