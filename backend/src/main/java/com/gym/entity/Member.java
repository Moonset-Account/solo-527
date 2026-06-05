package com.gym.entity;

import com.gym.common.entity.BaseEntity;
import com.gym.common.enums.MemberStatusEnum;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "member")
public class Member extends BaseEntity {

    @Column(nullable = false, unique = true, length = 32)
    private String memberNo;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 20)
    private String phone;

    @Column(length = 10)
    private String gender;

    private LocalDate birthday;

    private String avatar;

    private String idCard;

    private String address;

    private String remark;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MemberStatusEnum status = MemberStatusEnum.ACTIVE;

    @Column(nullable = false)
    private LocalDate joinDate;

    private LocalDate expireDate;

    private Integer totalRemainingSessions = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_coach_id")
    private Coach assignedCoach;

    private String qrCode;
}
