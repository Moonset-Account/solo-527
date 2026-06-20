package com.datagrowth.portal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "desensitization_config")
public class DesensitizationConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String datasetCode;

    @Column(nullable = false, length = 100)
    private String tableName;

    @Column(nullable = false, length = 100)
    private String columnName;

    @Column(length = 100)
    private String columnAlias;

    @Column(nullable = false, length = 50)
    private String desensitizationType;

    @Column(length = 500)
    private String desensitizationRule;

    @Column(length = 50)
    private String dataLevel;

    @Column(length = 500)
    private String effectiveCondition;

    @Column(nullable = false)
    private Boolean enabled = true;

    @Column(length = 500)
    private String description;

    @Column(length = 50)
    private String createdBy;

    @Column(length = 50)
    private String updatedBy;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
