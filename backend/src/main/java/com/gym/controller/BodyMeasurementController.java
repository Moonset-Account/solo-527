package com.gym.controller;

import com.gym.common.response.Result;
import com.gym.entity.BodyMeasurement;
import com.gym.entity.Coach;
import com.gym.entity.Member;
import com.gym.repository.BodyMeasurementRepository;
import com.gym.repository.CoachRepository;
import com.gym.repository.MemberRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/body-measurements")
public class BodyMeasurementController {

    private final BodyMeasurementRepository bodyMeasurementRepository;
    private final MemberRepository memberRepository;
    private final CoachRepository coachRepository;

    public BodyMeasurementController(BodyMeasurementRepository bodyMeasurementRepository,
                                      MemberRepository memberRepository,
                                      CoachRepository coachRepository) {
        this.bodyMeasurementRepository = bodyMeasurementRepository;
        this.memberRepository = memberRepository;
        this.coachRepository = coachRepository;
    }

    private Long getCurrentUserId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'COACH', 'RECEPTION')")
    public Result<List<BodyMeasurement>> list() {
        return Result.success(bodyMeasurementRepository.findAll());
    }

    @GetMapping("/member/{memberId}")
    @PreAuthorize("isAuthenticated()")
    public Result<List<BodyMeasurement>> getByMemberId(@PathVariable Long memberId) {
        return Result.success(bodyMeasurementRepository.findByMemberIdOrderByMeasureDateDesc(memberId));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('COACH')")
    public Result<List<BodyMeasurement>> getMyMeasurements() {
        Long currentUserId = getCurrentUserId();
        Coach coach = coachRepository.findByUserId(currentUserId);
        if (coach == null) {
            return Result.error("教练信息不存在");
        }
        return Result.success(bodyMeasurementRepository.findByCoachIdOrderByMeasureDateDesc(coach.getId()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public Result<BodyMeasurement> getById(@PathVariable Long id) {
        return bodyMeasurementRepository.findById(id)
                .map(Result::success)
                .orElse(Result.error("体测记录不存在"));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'COACH', 'RECEPTION')")
    public Result<BodyMeasurement> create(@RequestBody BodyMeasurementCreateRequest request) {
        Member member = memberRepository.findById(request.getMemberId())
                .orElseThrow(() -> new RuntimeException("会员不存在"));

        BodyMeasurement measurement = new BodyMeasurement();
        measurement.setMember(member);

        if (request.getCoachId() != null) {
            Coach coach = coachRepository.findById(request.getCoachId())
                    .orElseThrow(() -> new RuntimeException("教练不存在"));
            measurement.setCoach(coach);
        }

        measurement.setMeasureDate(request.getMeasureDate() != null ? request.getMeasureDate() : LocalDate.now());
        measurement.setHeight(request.getHeight());
        measurement.setWeight(request.getWeight());
        measurement.setBmi(request.getBmi());
        measurement.setBodyFatRate(request.getBodyFatRate());
        measurement.setMuscleMass(request.getMuscleMass());
        measurement.setWaist(request.getWaist());
        measurement.setHip(request.getHip());
        measurement.setChest(request.getChest());
        measurement.setLeftArm(request.getLeftArm());
        measurement.setRightArm(request.getRightArm());
        measurement.setLeftThigh(request.getLeftThigh());
        measurement.setRightThigh(request.getRightThigh());
        measurement.setBasalMetabolism(request.getBasalMetabolism());
        measurement.setPhotos(request.getPhotos());
        measurement.setNote(request.getNote());

        return Result.success(bodyMeasurementRepository.save(measurement));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'COACH')")
    public Result<BodyMeasurement> update(@PathVariable Long id, @RequestBody BodyMeasurementCreateRequest request) {
        return bodyMeasurementRepository.findById(id).map(measurement -> {
            if (request.getMeasureDate() != null) measurement.setMeasureDate(request.getMeasureDate());
            if (request.getHeight() != null) measurement.setHeight(request.getHeight());
            if (request.getWeight() != null) measurement.setWeight(request.getWeight());
            if (request.getBmi() != null) measurement.setBmi(request.getBmi());
            if (request.getBodyFatRate() != null) measurement.setBodyFatRate(request.getBodyFatRate());
            if (request.getMuscleMass() != null) measurement.setMuscleMass(request.getMuscleMass());
            if (request.getWaist() != null) measurement.setWaist(request.getWaist());
            if (request.getHip() != null) measurement.setHip(request.getHip());
            if (request.getChest() != null) measurement.setChest(request.getChest());
            if (request.getLeftArm() != null) measurement.setLeftArm(request.getLeftArm());
            if (request.getRightArm() != null) measurement.setRightArm(request.getRightArm());
            if (request.getLeftThigh() != null) measurement.setLeftThigh(request.getLeftThigh());
            if (request.getRightThigh() != null) measurement.setRightThigh(request.getRightThigh());
            if (request.getBasalMetabolism() != null) measurement.setBasalMetabolism(request.getBasalMetabolism());
            if (request.getPhotos() != null) measurement.setPhotos(request.getPhotos());
            if (request.getNote() != null) measurement.setNote(request.getNote());
            return Result.success(bodyMeasurementRepository.save(measurement));
        }).orElse(Result.error("体测记录不存在"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Result<Void> delete(@PathVariable Long id) {
        bodyMeasurementRepository.deleteById(id);
        return Result.success(null);
    }

    public static class BodyMeasurementCreateRequest {
        private Long memberId;
        private Long coachId;
        private LocalDate measureDate;
        private java.math.BigDecimal height;
        private java.math.BigDecimal weight;
        private java.math.BigDecimal bmi;
        private java.math.BigDecimal bodyFatRate;
        private java.math.BigDecimal muscleMass;
        private java.math.BigDecimal waist;
        private java.math.BigDecimal hip;
        private java.math.BigDecimal chest;
        private java.math.BigDecimal leftArm;
        private java.math.BigDecimal rightArm;
        private java.math.BigDecimal leftThigh;
        private java.math.BigDecimal rightThigh;
        private java.math.BigDecimal basalMetabolism;
        private String photos;
        private String note;

        public Long getMemberId() { return memberId; }
        public void setMemberId(Long memberId) { this.memberId = memberId; }
        public Long getCoachId() { return coachId; }
        public void setCoachId(Long coachId) { this.coachId = coachId; }
        public LocalDate getMeasureDate() { return measureDate; }
        public void setMeasureDate(LocalDate measureDate) { this.measureDate = measureDate; }
        public java.math.BigDecimal getHeight() { return height; }
        public void setHeight(java.math.BigDecimal height) { this.height = height; }
        public java.math.BigDecimal getWeight() { return weight; }
        public void setWeight(java.math.BigDecimal weight) { this.weight = weight; }
        public java.math.BigDecimal getBmi() { return bmi; }
        public void setBmi(java.math.BigDecimal bmi) { this.bmi = bmi; }
        public java.math.BigDecimal getBodyFatRate() { return bodyFatRate; }
        public void setBodyFatRate(java.math.BigDecimal bodyFatRate) { this.bodyFatRate = bodyFatRate; }
        public java.math.BigDecimal getMuscleMass() { return muscleMass; }
        public void setMuscleMass(java.math.BigDecimal muscleMass) { this.muscleMass = muscleMass; }
        public java.math.BigDecimal getWaist() { return waist; }
        public void setWaist(java.math.BigDecimal waist) { this.waist = waist; }
        public java.math.BigDecimal getHip() { return hip; }
        public void setHip(java.math.BigDecimal hip) { this.hip = hip; }
        public java.math.BigDecimal getChest() { return chest; }
        public void setChest(java.math.BigDecimal chest) { this.chest = chest; }
        public java.math.BigDecimal getLeftArm() { return leftArm; }
        public void setLeftArm(java.math.BigDecimal leftArm) { this.leftArm = leftArm; }
        public java.math.BigDecimal getRightArm() { return rightArm; }
        public void setRightArm(java.math.BigDecimal rightArm) { this.rightArm = rightArm; }
        public java.math.BigDecimal getLeftThigh() { return leftThigh; }
        public void setLeftThigh(java.math.BigDecimal leftThigh) { this.leftThigh = leftThigh; }
        public java.math.BigDecimal getRightThigh() { return rightThigh; }
        public void setRightThigh(java.math.BigDecimal rightThigh) { this.rightThigh = rightThigh; }
        public java.math.BigDecimal getBasalMetabolism() { return basalMetabolism; }
        public void setBasalMetabolism(java.math.BigDecimal basalMetabolism) { this.basalMetabolism = basalMetabolism; }
        public String getPhotos() { return photos; }
        public void setPhotos(String photos) { this.photos = photos; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
    }
}
