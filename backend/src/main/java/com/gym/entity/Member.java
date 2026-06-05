package com.gym.entity;

import com.gym.common.entity.BaseEntity;
import com.gym.common.enums.MemberStatusEnum;
import jakarta.persistence.*;

import java.time.LocalDate;

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

    public String getMemberNo() {
        return memberNo;
    }

    public void setMemberNo(String memberNo) {
        this.memberNo = memberNo;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public LocalDate getBirthday() {
        return birthday;
    }

    public void setBirthday(LocalDate birthday) {
        this.birthday = birthday;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getIdCard() {
        return idCard;
    }

    public void setIdCard(String idCard) {
        this.idCard = idCard;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }

    public MemberStatusEnum getStatus() {
        return status;
    }

    public void setStatus(MemberStatusEnum status) {
        this.status = status;
    }

    public LocalDate getJoinDate() {
        return joinDate;
    }

    public void setJoinDate(LocalDate joinDate) {
        this.joinDate = joinDate;
    }

    public LocalDate getExpireDate() {
        return expireDate;
    }

    public void setExpireDate(LocalDate expireDate) {
        this.expireDate = expireDate;
    }

    public Integer getTotalRemainingSessions() {
        return totalRemainingSessions;
    }

    public void setTotalRemainingSessions(Integer totalRemainingSessions) {
        this.totalRemainingSessions = totalRemainingSessions;
    }

    public Coach getAssignedCoach() {
        return assignedCoach;
    }

    public void setAssignedCoach(Coach assignedCoach) {
        this.assignedCoach = assignedCoach;
    }

    public String getQrCode() {
        return qrCode;
    }

    public void setQrCode(String qrCode) {
        this.qrCode = qrCode;
    }
}
