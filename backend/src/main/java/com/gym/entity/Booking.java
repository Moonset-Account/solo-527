package com.gym.entity;

import com.gym.common.entity.BaseEntity;
import com.gym.common.enums.BookingStatusEnum;
import com.gym.common.enums.CourseTypeEnum;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "booking")
public class Booking extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CourseTypeEnum courseType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coach_id", nullable = false)
    private Coach coach;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_package_id")
    private MemberPackage memberPackage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_class_id")
    private GroupClass groupClass;

    @Column(nullable = false)
    private LocalDateTime startTime;

    @Column(nullable = false)
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BookingStatusEnum status = BookingStatusEnum.PENDING;

    private String location;

    private String remark;

    private LocalDateTime checkInTime;

    private String checkInBy;

    private Boolean deducted = false;

    public Member getMember() {
        return member;
    }

    public void setMember(Member member) {
        this.member = member;
    }

    public CourseTypeEnum getCourseType() {
        return courseType;
    }

    public void setCourseType(CourseTypeEnum courseType) {
        this.courseType = courseType;
    }

    public Coach getCoach() {
        return coach;
    }

    public void setCoach(Coach coach) {
        this.coach = coach;
    }

    public MemberPackage getMemberPackage() {
        return memberPackage;
    }

    public void setMemberPackage(MemberPackage memberPackage) {
        this.memberPackage = memberPackage;
    }

    public GroupClass getGroupClass() {
        return groupClass;
    }

    public void setGroupClass(GroupClass groupClass) {
        this.groupClass = groupClass;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public BookingStatusEnum getStatus() {
        return status;
    }

    public void setStatus(BookingStatusEnum status) {
        this.status = status;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }

    public LocalDateTime getCheckInTime() {
        return checkInTime;
    }

    public void setCheckInTime(LocalDateTime checkInTime) {
        this.checkInTime = checkInTime;
    }

    public String getCheckInBy() {
        return checkInBy;
    }

    public void setCheckInBy(String checkInBy) {
        this.checkInBy = checkInBy;
    }

    public Boolean getDeducted() {
        return deducted;
    }

    public void setDeducted(Boolean deducted) {
        this.deducted = deducted;
    }
}
