package com.gym.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "package_types")
public class PackageType extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(name = "total_sessions", nullable = false)
    private Integer totalSessions;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    private Integer duration;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 20)
    private String status = "ACTIVE";
}
