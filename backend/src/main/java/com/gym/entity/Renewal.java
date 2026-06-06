package com.gym.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

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

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRenewalNo() {
        return renewalNo;
    }

    public void setRenewalNo(String renewalNo) {
        this.renewalNo = renewalNo;
    }

    public Long getMemberId() {
        return memberId;
    }

    public void setMemberId(Long memberId) {
        this.memberId = memberId;
    }

    public Long getOldPackageId() {
        return oldPackageId;
    }

    public void setOldPackageId(Long oldPackageId) {
        this.oldPackageId = oldPackageId;
    }

    public Long getNewPackageId() {
        return newPackageId;
    }

    public void setNewPackageId(Long newPackageId) {
        this.newPackageId = newPackageId;
    }

    public Long getCoachId() {
        return coachId;
    }

    public void setCoachId(Long coachId) {
        this.coachId = coachId;
    }

    public LocalDate getRenewalDate() {
        return renewalDate;
    }

    public void setRenewalDate(LocalDate renewalDate) {
        this.renewalDate = renewalDate;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
