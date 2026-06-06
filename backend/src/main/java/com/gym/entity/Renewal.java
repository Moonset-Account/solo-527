package com.gym.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "renewals")
public class Renewal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "renewal_no", nullable = false, unique = true, length = 50)
    private String renewalNo;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "old_package_id")
    private Long oldPackageId;

    @Column(name = "new_package_id", nullable = false)
    private Long newPackageId;

    @Column(name = "coach_id")
    private Long coachId;

    @Column(name = "renewal_date", nullable = false)
    private LocalDate renewalDate;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(length = 20)
    private String status = "COMPLETED";

    @Column(columnDefinition = "TEXT")
    private String remark;

    @Column(name = "created_by", length = 50)
    private String createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
