package com.gym.entity;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "member_packages")
public class MemberPackage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "package_type_id", nullable = false)
    private Long packageTypeId;

    @Column(name = "coach_id")
    private Long coachId;

    @Column(name = "purchase_date", nullable = false)
    private LocalDate purchaseDate;

    @Column(name = "expire_date")
    private LocalDate expireDate;

    @Column(name = "total_sessions", nullable = false)
    private Integer totalSessions;

    @Column(name = "remaining_sessions", nullable = false)
    private Integer remainingSessions;

    @Column(name = "used_sessions")
    private Integer usedSessions = 0;

    @Column(name = "freeze_days")
    private Integer freezeDays = 0;

    @Column(length = 20)
    private String status = "ACTIVE";

    @Column(columnDefinition = "TEXT")
    private String remark;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", insertable = false, updatable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_type_id", insertable = false, updatable = false)
    private PackageType packageType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coach_id", insertable = false, updatable = false)
    private Coach coach;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getMemberId() {
        return memberId;
    }

    public void setMemberId(Long memberId) {
        this.memberId = memberId;
    }

    public Long getPackageTypeId() {
        return packageTypeId;
    }

    public void setPackageTypeId(Long packageTypeId) {
        this.packageTypeId = packageTypeId;
    }

    public Long getCoachId() {
        return coachId;
    }

    public void setCoachId(Long coachId) {
        this.coachId = coachId;
    }

    public LocalDate getPurchaseDate() {
        return purchaseDate;
    }

    public void setPurchaseDate(LocalDate purchaseDate) {
        this.purchaseDate = purchaseDate;
    }

    public LocalDate getExpireDate() {
        return expireDate;
    }

    public void setExpireDate(LocalDate expireDate) {
        this.expireDate = expireDate;
    }

    public Integer getTotalSessions() {
        return totalSessions;
    }

    public void setTotalSessions(Integer totalSessions) {
        this.totalSessions = totalSessions;
    }

    public Integer getRemainingSessions() {
        return remainingSessions;
    }

    public void setRemainingSessions(Integer remainingSessions) {
        this.remainingSessions = remainingSessions;
    }

    public Integer getUsedSessions() {
        return usedSessions;
    }

    public void setUsedSessions(Integer usedSessions) {
        this.usedSessions = usedSessions;
    }

    public Integer getFreezeDays() {
        return freezeDays;
    }

    public void setFreezeDays(Integer freezeDays) {
        this.freezeDays = freezeDays;
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

    public Member getMember() {
        return member;
    }

    public void setMember(Member member) {
        this.member = member;
    }

    public PackageType getPackageType() {
        return packageType;
    }

    public void setPackageType(PackageType packageType) {
        this.packageType = packageType;
    }

    public Coach getCoach() {
        return coach;
    }

    public void setCoach(Coach coach) {
        this.coach = coach;
    }
}
