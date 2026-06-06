package com.ceramic.kiln.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "kiln_runs")
public class KilnRun {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "run_code", nullable = false, unique = true, length = 50)
    private String runCode;

    @Column(name = "kiln_id", nullable = false)
    private Long kilnId;

    @Column(name = "firing_curve_id", nullable = false)
    private Long firingCurveId;

    @Column(name = "temperature_zone", nullable = false, length = 20)
    private String temperatureZone;

    @Column(name = "scheduled_start_time")
    private LocalDateTime scheduledStartTime;

    @Column(name = "actual_start_time")
    private LocalDateTime actualStartTime;

    @Column(name = "actual_end_time")
    private LocalDateTime actualEndTime;

    @Column(length = 20)
    private String status = "DRAFT";

    @Column(name = "max_capacity", nullable = false)
    private Integer maxCapacity;

    @Column(name = "used_capacity")
    private Integer usedCapacity = 0;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
