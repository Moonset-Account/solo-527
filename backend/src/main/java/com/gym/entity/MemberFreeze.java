package com.gym.entity;

import jakarta.persistence.*;

import java.time.LocalDate;

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

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFreezeNo() {
        return freezeNo;
    }

    public void setFreezeNo(String freezeNo) {
        this.freezeNo = freezeNo;
    }

    public Long getMemberId() {
        return memberId;
    }

    public void setMemberId(Long memberId) {
        this.memberId = memberId;
    }

    public Long getMemberPackageId() {
        return memberPackageId;
    }

    public void setMemberPackageId(Long memberPackageId) {
        this.memberPackageId = memberPackageId;
    }

    public String getFreezeType() {
        return freezeType;
    }

    public void setFreezeType(String freezeType) {
        this.freezeType = freezeType;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public Integer getFreezeDays() {
        return freezeDays;
    }

    public void setFreezeDays(Integer freezeDays) {
        this.freezeDays = freezeDays;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Member getMember() {
        return member;
    }

    public void setMember(Member member) {
        this.member = member;
    }

    public MemberPackage getMemberPackage() {
        return memberPackage;
    }

    public void setMemberPackage(MemberPackage memberPackage) {
        this.memberPackage = memberPackage;
    }
}
