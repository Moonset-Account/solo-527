package com.gym.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "coaches")
public class Coach extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "coach_no", nullable = false, unique = true, length = 50)
    private String coachNo;

    @Column(length = 200)
    private String specialty;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "hire_date")
    private LocalDate hireDate;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;
}
