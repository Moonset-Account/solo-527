package com.ceramic.kiln.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "artworks")
public class Artwork {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "artwork_code", nullable = false, unique = true, length = 50)
    private String artworkCode;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "clay_id", nullable = false)
    private Long clayId;

    @Column(name = "glaze_id")
    private Long glazeId;

    @Column(length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(precision = 10, scale = 2)
    private BigDecimal weight;

    @Column(length = 20)
    private String status = "SUBMITTED";

    @Column(name = "kiln_run_id")
    private Long kilnRunId;

    @Column(name = "position_in_kiln", length = 50)
    private String positionInKiln;

    @Column(name = "submission_source", length = 20)
    private String submissionSource = "EXTERNAL";

    @Column(name = "submitted_by")
    private Long submittedBy;

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
