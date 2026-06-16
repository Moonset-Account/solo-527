package com.rider.analyzer.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "station")
public class Station {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 128)
    private String name;

    @Column(name = "address", length = 256)
    private String address;

    @Column(name = "lng", precision = 10, scale = 6)
    private java.math.BigDecimal lng;

    @Column(name = "lat", precision = 10, scale = 6)
    private java.math.BigDecimal lat;

    @Column(name = "create_time", nullable = false, updatable = false)
    private LocalDateTime createTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
    }
}
