package com.gym.entity;

import com.gym.common.entity.BaseEntity;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "body_measurement")
public class BodyMeasurement extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coach_id")
    private Coach coach;

    @Column(nullable = false)
    private LocalDate measureDate;

    @Column(precision = 5, scale = 2)
    private BigDecimal height;

    @Column(precision = 5, scale = 2)
    private BigDecimal weight;

    @Column(precision = 4, scale = 1)
    private BigDecimal bmi;

    @Column(precision = 5, scale = 2)
    private BigDecimal bodyFatRate;

    @Column(precision = 5, scale = 2)
    private BigDecimal muscleMass;

    @Column(precision = 5, scale = 2)
    private BigDecimal waist;

    @Column(precision = 5, scale = 2)
    private BigDecimal hip;

    @Column(precision = 5, scale = 2)
    private BigDecimal chest;

    @Column(precision = 5, scale = 2)
    private BigDecimal leftArm;

    @Column(precision = 5, scale = 2)
    private BigDecimal rightArm;

    @Column(precision = 5, scale = 2)
    private BigDecimal leftThigh;

    @Column(precision = 5, scale = 2)
    private BigDecimal rightThigh;

    @Column(precision = 5, scale = 2)
    private BigDecimal basalMetabolism;

    private String photos;

    @Column(length = 1000)
    private String note;

    public Member getMember() {
        return member;
    }

    public void setMember(Member member) {
        this.member = member;
    }

    public Coach getCoach() {
        return coach;
    }

    public void setCoach(Coach coach) {
        this.coach = coach;
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

    public BigDecimal getBodyFatRate() {
        return bodyFatRate;
    }

    public void setBodyFatRate(BigDecimal bodyFatRate) {
        this.bodyFatRate = bodyFatRate;
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

    public BigDecimal getLeftArm() {
        return leftArm;
    }

    public void setLeftArm(BigDecimal leftArm) {
        this.leftArm = leftArm;
    }

    public BigDecimal getRightArm() {
        return rightArm;
    }

    public void setRightArm(BigDecimal rightArm) {
        this.rightArm = rightArm;
    }

    public BigDecimal getLeftThigh() {
        return leftThigh;
    }

    public void setLeftThigh(BigDecimal leftThigh) {
        this.leftThigh = leftThigh;
    }

    public BigDecimal getRightThigh() {
        return rightThigh;
    }

    public void setRightThigh(BigDecimal rightThigh) {
        this.rightThigh = rightThigh;
    }

    public BigDecimal getBasalMetabolism() {
        return basalMetabolism;
    }

    public void setBasalMetabolism(BigDecimal basalMetabolism) {
        this.basalMetabolism = basalMetabolism;
    }

    public String getPhotos() {
        return photos;
    }

    public void setPhotos(String photos) {
        this.photos = photos;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
