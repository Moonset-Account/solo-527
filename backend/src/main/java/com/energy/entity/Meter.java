package com.energy.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "meters")
public class Meter {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "meter_code", nullable = false, unique = true, length = 64)
    private String meterCode;

    @Column(name = "meter_name", nullable = false, length = 128)
    private String meterName;

    @Column(nullable = false, length = 64)
    private String area;

    @Column(length = 255)
    private String location;

    @Column(name = "rated_current", precision = 10, scale = 2)
    private BigDecimal ratedCurrent;

    @Column(name = "rated_voltage", precision = 10, scale = 2)
    private BigDecimal ratedVoltage;

    @Column(nullable = false, length = 32)
    private String status = "NORMAL";

    @Column(name = "install_date")
    private LocalDate installDate;

    @Column(name = "create_time", nullable = false)
    private LocalDateTime createTime = LocalDateTime.now();

    @Column(name = "update_time", nullable = false)
    private LocalDateTime updateTime = LocalDateTime.now();
}
