package com.gym.entity;

import com.gym.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "member_freeze")
public class MemberFreeze extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(nullable = false)
    private Integer freezeDays;

    @Column(nullable = false, length = 200)
    private String reason;

    @Column(nullable = false)
    private Boolean active = true;

    private String approveBy;

    private LocalDate approveDate;

    private String remark;
}
