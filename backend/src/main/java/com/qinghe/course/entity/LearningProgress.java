package com.qinghe.course.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "learning_progress")
public class LearningProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private Long courseId;
    private Long classId;
    private Integer totalHours;

    @Column(precision = 10, scale = 1)
    private BigDecimal consumedHours;

    private Integer completedLessons;
    private Long lastLessonId;
    private LocalDateTime lastStudyAt;

    @Column(precision = 5, scale = 2)
    private BigDecimal completionRate;

    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (consumedHours == null) consumedHours = BigDecimal.ZERO;
        if (completedLessons == null) completedLessons = 0;
        if (completionRate == null) completionRate = BigDecimal.ZERO;
        if (totalHours == null) totalHours = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
