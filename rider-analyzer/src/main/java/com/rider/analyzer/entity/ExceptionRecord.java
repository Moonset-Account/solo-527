package com.rider.analyzer.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "exception_record")
public class ExceptionRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "type", nullable = false, length = 20)
    private String type;

    @Column(name = "description", length = 512)
    private String description;

    @Column(name = "temp_anomaly_reason", length = 256)
    private String tempAnomalyReason;

    @Column(name = "handle_duration_min")
    private Integer handleDurationMin;

    @Column(name = "handler_name", length = 64)
    private String handlerName;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "create_time", nullable = false, updatable = false)
    private LocalDateTime createTime;

    @Column(name = "resolve_time")
    private LocalDateTime resolveTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
    }
}
