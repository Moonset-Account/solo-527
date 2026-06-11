package com.qinghe.course.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "course_order")
public class CourseOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String orderNo;
    private Long userId;
    private Long courseId;
    private Long classId;
    private Long couponId;

    @Column(precision = 10, scale = 2)
    private java.math.BigDecimal originalAmount;

    @Column(precision = 10, scale = 2)
    private java.math.BigDecimal discountAmount;

    @Column(precision = 10, scale = 2)
    private java.math.BigDecimal finalAmount;

    private String paymentMethod;
    private LocalDateTime paidAt;
    private String status;
    private String refundStatus;

    @Column(columnDefinition = "text")
    private String remark;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
