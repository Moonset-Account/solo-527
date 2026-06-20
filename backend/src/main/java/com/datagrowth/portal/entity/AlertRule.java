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
@Table(name = "alert_rule")
public class AlertRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String ruleName;

    @Column(nullable = false, length = 100)
    private String metricName;

    @Column(length = 50)
    private String dimension;

    @Column(nullable = false, length = 20)
    private String alertType;

    @Column(precision = 10, scale = 4)
    private java.math.BigDecimal threshold;

    @Column(length = 20)
    private String operator;

    @Column(length = 20)
    private String severity;

    @Column(length = 500)
    private String effectiveCondition;

    @Column(nullable = false)
    private Boolean enabled = true;

    @Column(length = 500)
    private String notificationChannels;

    @Column(length = 200)
    private String notifyUsers;

    @Column(length = 50)
    private String createdBy;

    @Column(length = 50)
    private String updatedBy;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
