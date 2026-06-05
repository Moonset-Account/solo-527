package com.gym.entity;

import com.gym.common.entity.BaseEntity;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "member_package")
public class MemberPackage extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id", nullable = false)
    private CoursePackage coursePackage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coach_id")
    private Coach coach;

    @Column(nullable = false)
    private Integer totalSessions;

    @Column(nullable = false)
    private Integer usedSessions = 0;

    @Column(nullable = false)
    private Integer remainingSessions;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal paidAmount;

    @Column(nullable = false)
    private LocalDate purchaseDate;

    private LocalDate startDate;

    private LocalDate expireDate;

    @Column(nullable = false)
    private Boolean active = true;

    private String remark;

    public Member getMember() {
        return member;
    }

    public void setMember(Member member) {
        this.member = member;
    }

    public CoursePackage getCoursePackage() {
        return coursePackage;
    }

    public void setCoursePackage(CoursePackage coursePackage) {
        this.coursePackage = coursePackage;
    }

    public Coach getCoach() {
        return coach;
    }

    public void setCoach(Coach coach) {
        this.coach = coach;
    }

    public Integer getTotalSessions() {
        return totalSessions;
    }

    public void setTotalSessions(Integer totalSessions) {
        this.totalSessions = totalSessions;
    }

    public Integer getUsedSessions() {
        return usedSessions;
    }

    public void setUsedSessions(Integer usedSessions) {
        this.usedSessions = usedSessions;
    }

    public Integer getRemainingSessions() {
        return remainingSessions;
    }

    public void setRemainingSessions(Integer remainingSessions) {
        this.remainingSessions = remainingSessions;
    }

    public BigDecimal getPaidAmount() {
        return paidAmount;
    }

    public void setPaidAmount(BigDecimal paidAmount) {
        this.paidAmount = paidAmount;
    }

    public LocalDate getPurchaseDate() {
        return purchaseDate;
    }

    public void setPurchaseDate(LocalDate purchaseDate) {
        this.purchaseDate = purchaseDate;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getExpireDate() {
        return expireDate;
    }

    public void setExpireDate(LocalDate expireDate) {
        this.expireDate = expireDate;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }
}
