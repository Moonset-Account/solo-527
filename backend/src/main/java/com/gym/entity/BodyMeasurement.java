package com.gym.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "body_measurements")
public class BodyMeasurement extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "measure_date", nullable = false)
    private LocalDate measureDate;

    @Column(precision = 5, scale = 2)
    private BigDecimal height;

    @Column(precision = 5, scale = 2)
    private BigDecimal weight;

    @Column(precision = 5, scale = 2)
    private BigDecimal bmi;

    @Column(name = "body_fat", precision = 5, scale = 2)
    private BigDecimal bodyFat;

    @Column(name = "muscle_mass", precision = 5, scale = 2)
    private BigDecimal muscleMass;

    @Column(precision = 5, scale = 2)
    private BigDecimal waist;

    @Column(precision = 5, scale = 2)
    private BigDecimal hip;

    @Column(precision = 5, scale = 2)
    private BigDecimal chest;

    @Column(name = "arm_left", precision = 5, scale = 2)
    private BigDecimal armLeft;

    @Column(name = "arm_right", precision = 5, scale = 2)
    private BigDecimal armRight;

    @Column(name = "thigh_left", precision = 5, scale = 2)
    private BigDecimal thighLeft;

    @Column(name = "thigh_right", precision = 5, scale = 2)
    private BigDecimal thighRight;

    @Column(columnDefinition = "TEXT")
    private String remark;

    @Column(name = "attachment_url", length = 255)
    private String attachmentUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", insertable = false, updatable = false)
    private Member member;

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

    public LocalDate getMeasureDate() {
        return measureDate;
    }

    public void setMeasureDate(LocalDate measureDate) {
        this.measureDate = measureDate;
    }

    public BigDecimal getHeight() {
        return height;
    }

    public void setHeight(BigDecimal height) {
        this.height = height;
    }

    public BigDecimal getWeight() {
        return weight;
    }

    public void setWeight(BigDecimal weight) {
        this.weight = weight;
    }

    public BigDecimal getBmi() {
        return bmi;
    }

    public void setBmi(BigDecimal bmi) {
        this.bmi = bmi;
    }

    public BigDecimal getBodyFat() {
        return bodyFat;
    }

    public void setBodyFat(BigDecimal bodyFat) {
        this.bodyFat = bodyFat;
    }

    public BigDecimal getMuscleMass() {
        return muscleMass;
    }

    public void setMuscleMass(BigDecimal muscleMass) {
        this.muscleMass = muscleMass;
    }

    public BigDecimal getWaist() {
        return waist;
    }

    public void setWaist(BigDecimal waist) {
        this.waist = waist;
    }

    public BigDecimal getHip() {
        return hip;
    }

    public void setHip(BigDecimal hip) {
        this.hip = hip;
    }

    public BigDecimal getChest() {
        return chest;
    }

    public void setChest(BigDecimal chest) {
        this.chest = chest;
    }

    public BigDecimal getArmLeft() {
        return armLeft;
    }

    public void setArmLeft(BigDecimal armLeft) {
        this.armLeft = armLeft;
    }

    public BigDecimal getArmRight() {
        return armRight;
    }

    public void setArmRight(BigDecimal armRight) {
        this.armRight = armRight;
    }

    public BigDecimal getThighLeft() {
        return thighLeft;
    }

    public void setThighLeft(BigDecimal thighLeft) {
        this.thighLeft = thighLeft;
    }

    public BigDecimal getThighRight() {
        return thighRight;
    }

    public void setThighRight(BigDecimal thighRight) {
        this.thighRight = thighRight;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }

    public String getAttachmentUrl() {
        return attachmentUrl;
    }

    public void setAttachmentUrl(String attachmentUrl) {
        this.attachmentUrl = attachmentUrl;
    }

    public Member getMember() {
        return member;
    }

    public void setMember(Member member) {
        this.member = member;
    }
}
