package com.ceramic.kiln.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "kiln_out_records")
public class KilnOutRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "kiln_run_id", nullable = false)
    private Long kilnRunId;

    @Column(name = "artwork_id", nullable = false)
    private Long artworkId;

    @Column(name = "out_time")
    private LocalDateTime outTime = LocalDateTime.now();

    @Column(name = "quality_status", nullable = false, length = 20)
    private String qualityStatus;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "recorded_by", nullable = false)
    private Long recordedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
