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
@Table(name = "saved_filters", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "page_name", "filter_name"})
})
public class SavedFilter {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "page_name", nullable = false, length = 100)
    private String pageName;

    @Column(name = "filter_name", nullable = false, length = 100)
    private String filterName;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "filter_criteria", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> filterCriteria;

    @Column(name = "is_default")
    private Boolean isDefault = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
