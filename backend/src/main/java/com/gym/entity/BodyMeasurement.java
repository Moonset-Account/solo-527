package com.gym.entity;

import com.gym.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "body_measurement")
public class BodyMeasurement extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coach_id")
    private Coach coach;

    @Column(nullable = false)
    private LocalDate measureDate;

    @Column(precision = 5, scale = 2)
    private BigDecimal height;

    @Column(precision = 5, scale = 2)
    private BigDecimal weight;

    @Column(precision = 4, scale = 1)
    private BigDecimal bmi;

    @Column(precision = 5, scale = 2)
    private BigDecimal bodyFatRate;

    @Column(precision = 5, scale = 2)
    private BigDecimal muscleMass;

    @Column(precision = 5, scale = 2)
    private BigDecimal waist;

    @Column(precision = 5, scale = 2)
    private BigDecimal hip;

    @Column(precision = 5, scale = 2)
    private BigDecimal chest;

    @Column(precision = 5, scale = 2)
    private BigDecimal leftArm;

    @Column(precision = 5, scale = 2)
    private BigDecimal rightArm;

    @Column(precision = 5, scale = 2)
    private BigDecimal leftThigh;

    @Column(precision = 5, scale = 2)
    private BigDecimal rightThigh;

    @Column(precision = 5, scale = 2)
    private BigDecimal basalMetabolism;

    private String photos;

    @Column(length = 1000)
    private String note;
}
