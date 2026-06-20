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
@Table(name = "data_delay_monitor")
public class DataDelayMonitor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String datasetCode;

    @Column(nullable = false, length = 200)
    private String datasetName;

    private LocalDateTime lastUpdateTime;

    private LocalDateTime expectedUpdateTime;

    @Column(nullable = false)
    private Integer delayMinutes;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(length = 500)
    private String notifyUsers;

    private Boolean notified = false;

    private LocalDateTime notifiedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
