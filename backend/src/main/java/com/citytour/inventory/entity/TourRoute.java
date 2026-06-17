package com.citytour.inventory.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "tour_route")
public class TourRoute extends BaseEntity {

    @Column(name = "route_code", unique = true, nullable = false, length = 50)
    private String routeCode;

    @Column(name = "route_name", nullable = false, length = 100)
    private String routeName;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "city", length = 50)
    private String city;

    @Column(name = "duration_days")
    private Integer durationDays;

    @Column(name = "base_price", precision = 10, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "max_capacity")
    private Integer maxCapacity;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "version")
    private Integer version;

    @Column(name = "cover_image", length = 500)
    private String coverImage;
}
