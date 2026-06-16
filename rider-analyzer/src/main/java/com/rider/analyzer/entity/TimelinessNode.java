package com.rider.analyzer.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "timeliness_node")
public class TimelinessNode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "node_type", nullable = false, length = 20)
    private String nodeType;

    @Column(name = "plan_time")
    private LocalDateTime planTime;

    @Column(name = "actual_time")
    private LocalDateTime actualTime;

    @Column(name = "is_timeout", nullable = false)
    private Integer isTimeout = 0;

    @Column(name = "timeout_minutes", nullable = false)
    private Integer timeoutMinutes = 0;

    @Column(name = "reason", length = 100)
    private String reason;

    @Column(name = "create_time", nullable = false, updatable = false)
    private LocalDateTime createTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
    }
}
