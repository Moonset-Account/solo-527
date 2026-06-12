package com.energy.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "alert_handlings", indexes = {
    @Index(name = "idx_alert_handlings_alert", columnList = "alert_id")
})
public class AlertHandling {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "alert_id", nullable = false)
    private Long alertId;

    @Column(nullable = false, length = 64)
    private String handler;

    @Column(name = "handle_time", nullable = false)
    private LocalDateTime handleTime;

    @Column(name = "handle_result", nullable = false, length = 32)
    private String handleResult;

    @Column(name = "handle_remark", columnDefinition = "TEXT")
    private String handleRemark;

    @Column(name = "response_duration")
    private Integer responseDuration;

    @Column(name = "create_time", nullable = false)
    private LocalDateTime createTime = LocalDateTime.now();
}
