package com.gym.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "members")
public class Member extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_no", nullable = false, unique = true, length = 50)
    private String memberNo;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 10)
    private String gender;

    private LocalDate birthday;

    @Column(length = 255)
    private String address;

    @Column(length = 20)
    private String status = "ACTIVE";

    @Column(length = 50)
    private String source;

    @Column(columnDefinition = "TEXT")
    private String remark;
}
