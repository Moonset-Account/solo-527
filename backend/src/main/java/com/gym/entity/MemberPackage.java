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
@Table(name = "member_package")
public class MemberPackage extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id", nullable = false)
    private CoursePackage coursePackage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coach_id")
    private Coach coach;

    @Column(nullable = false)
    private Integer totalSessions;

    @Column(nullable = false)
    private Integer usedSessions = 0;

    @Column(nullable = false)
    private Integer remainingSessions;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal paidAmount;

    @Column(nullable = false)
    private LocalDate purchaseDate;

    private LocalDate startDate;

    private LocalDate expireDate;

    @Column(nullable = false)
    private Boolean active = true;

    private String remark;
}
