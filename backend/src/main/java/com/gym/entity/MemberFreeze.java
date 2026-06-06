package com.gym.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "member_freezes")
public class MemberFreeze extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "freeze_no", nullable = false, unique = true, length = 50)
    private String freezeNo;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "member_package_id")
    private Long memberPackageId;

    @Column(name = "freeze_type", length = 20)
    private String freezeType = "NORMAL";

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "freeze_days", nullable = false)
    private Integer freezeDays;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(length = 20)
    private String status = "ACTIVE";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", insertable = false, updatable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_package_id", insertable = false, updatable = false)
    private MemberPackage memberPackage;
}
