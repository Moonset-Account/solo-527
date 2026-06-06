package com.ceramic.kiln.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "damage_claims")
public class DamageClaim {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "claim_code", nullable = false, unique = true, length = 50)
    private String claimCode;

    @Column(name = "artwork_id", nullable = false)
    private Long artworkId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "damage_type", nullable = false, length = 50)
    private String damageType;

    @Column(name = "damage_description", columnDefinition = "TEXT")
    private String damageDescription;

    @Column(name = "compensation_type", nullable = false, length = 20)
    private String compensationType;

    @Column(name = "compensation_amount", precision = 10, scale = 2)
    private BigDecimal compensationAmount;

    @Column(length = 20)
    private String status = "PENDING";

    @Column(name = "processed_by")
    private Long processedBy;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "process_notes", columnDefinition = "TEXT")
    private String processNotes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
