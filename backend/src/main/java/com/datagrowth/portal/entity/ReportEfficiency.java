package com.datagrowth.portal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "report_efficiency")
public class ReportEfficiency {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String reportCode;

    @Column(nullable = false, length = 200)
    private String reportName;

    @Column(nullable = false)
    private LocalDate statDate;

    @Column(nullable = false)
    private Integer generationCount;

    @Column(nullable = false)
    private Long avgGenerationTimeMs;

    private Long maxGenerationTimeMs;

    private Long minGenerationTimeMs;

    private Long totalTimeMs;

    private Integer successCount;

    private Integer failCount;

    @Column(precision = 10, scale = 4)
    private java.math.BigDecimal successRate;

    @Column(length = 500)
    private String remark;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
