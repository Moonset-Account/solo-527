package com.gym.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "body_measurements")
public class BodyMeasurement extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "measure_date", nullable = false)
    private LocalDate measureDate;

    @Column(precision = 5, scale = 2)
    private BigDecimal height;

    @Column(precision = 5, scale = 2)
    private BigDecimal weight;

    @Column(precision = 5, scale = 2)
    private BigDecimal bmi;

    @Column(name = "body_fat", precision = 5, scale = 2)
    private BigDecimal bodyFat;

    @Column(name = "muscle_mass", precision = 5, scale = 2)
    private BigDecimal muscleMass;

    @Column(precision = 5, scale = 2)
    private BigDecimal waist;

    @Column(precision = 5, scale = 2)
    private BigDecimal hip;

    @Column(precision = 5, scale = 2)
    private BigDecimal chest;

    @Column(name = "arm_left", precision = 5, scale = 2)
    private BigDecimal armLeft;

    @Column(name = "arm_right", precision = 5, scale = 2)
    private BigDecimal armRight;

    @Column(name = "thigh_left", precision = 5, scale = 2)
    private BigDecimal thighLeft;

    @Column(name = "thigh_right", precision = 5, scale = 2)
    private BigDecimal thighRight;

    @Column(columnDefinition = "TEXT")
    private String remark;

    @Column(name = "attachment_url", length = 255)
    private String attachmentUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", insertable = false, updatable = false)
    private Member member;
}
