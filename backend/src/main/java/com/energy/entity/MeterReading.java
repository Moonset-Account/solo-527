package com.energy.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "meter_readings", indexes = {
    @Index(name = "idx_meter_readings_meter_time", columnList = "meter_id, reading_time"),
    @Index(name = "idx_meter_readings_time", columnList = "reading_time")
})
public class MeterReading {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "meter_id", nullable = false)
    private Long meterId;

    @Column(name = "reading_time", nullable = false)
    private LocalDateTime readingTime;

    @Column(name = "active_power", precision = 14, scale = 4)
    private BigDecimal activePower;

    @Column(name = "reactive_power", precision = 14, scale = 4)
    private BigDecimal reactivePower;

    @Column(precision = 10, scale = 4)
    private BigDecimal voltage;

    @Column(name = "current_value", precision = 10, scale = 4)
    private BigDecimal currentValue;

    @Column(name = "power_factor", precision = 5, scale = 4)
    private BigDecimal powerFactor;

    @Column(name = "cumulative_energy", precision = 18, scale = 4)
    private BigDecimal cumulativeEnergy;

    @Column(name = "is_valid", nullable = false)
    private Boolean isValid = true;

    @Column(name = "validate_remark", length = 255)
    private String validateRemark;

    @Column(name = "create_time", nullable = false)
    private LocalDateTime createTime = LocalDateTime.now();
}
