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
@Table(name = "coach")
public class Coach extends BaseEntity {

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

    private String specialty;

    private String introduction;

    @Column(precision = 10, scale = 2)
    private BigDecimal baseSalary;

    @Column(precision = 5, scale = 2)
    private BigDecimal commissionRate;

    @Column(nullable = false)
    private Boolean active = true;

    private LocalDate hireDate;

    private String level;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
}
