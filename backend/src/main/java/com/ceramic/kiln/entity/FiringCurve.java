package com.ceramic.kiln.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Entity
@Table(name = "firing_curves")
public class FiringCurve {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "temperature_zone", nullable = false, length = 20)
    private String temperatureZone;

    @Column(name = "target_temperature", nullable = false)
    private Integer targetTemperature;

    @Column(name = "total_duration", nullable = false)
    private Integer totalDuration;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "curve_data", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> curveData;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_public")
    private Boolean isPublic = true;

    @Column(name = "created_by")
    private Long createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
