package com.gym.service;

import com.gym.common.BusinessException;
import com.gym.entity.BodyMeasurement;
import com.gym.repository.BodyMeasurementRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class BodyMeasurementService {

    private static final Logger log = LoggerFactory.getLogger(BodyMeasurementService.class);

    private final BodyMeasurementRepository bodyMeasurementRepository;
    private final AuditLogService auditLogService;

    public BodyMeasurementService(BodyMeasurementRepository bodyMeasurementRepository, AuditLogService auditLogService) {
        this.bodyMeasurementRepository = bodyMeasurementRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public BodyMeasurement createMeasurement(BodyMeasurement measurement) {
        BodyMeasurement saved = bodyMeasurementRepository.save(measurement);
        auditLogService.log("CREATE", "BODY_MEASUREMENT", saved.getId(), "BODY_MEASUREMENT", null, saved);
        return saved;
    }

    @Transactional
    public BodyMeasurement updateMeasurement(Long id, BodyMeasurement measurement) {
        BodyMeasurement existing = bodyMeasurementRepository.findById(id)
                .orElseThrow(() -> new BusinessException("体测记录不存在"));

        BodyMeasurement old = new BodyMeasurement();
        old.setWeight(existing.getWeight());
        old.setBodyFat(existing.getBodyFat());

        existing.setHeight(measurement.getHeight());
        existing.setWeight(measurement.getWeight());
        existing.setBmi(measurement.getBmi());
        existing.setBodyFat(measurement.getBodyFat());
        existing.setMuscleMass(measurement.getMuscleMass());
        existing.setWaist(measurement.getWaist());
        existing.setHip(measurement.getHip());
        existing.setChest(measurement.getChest());
        existing.setArmLeft(measurement.getArmLeft());
        existing.setArmRight(measurement.getArmRight());
        existing.setThighLeft(measurement.getThighLeft());
        existing.setThighRight(measurement.getThighRight());
        existing.setRemark(measurement.getRemark());
        existing.setAttachmentUrl(measurement.getAttachmentUrl());

        BodyMeasurement saved = bodyMeasurementRepository.save(existing);
        auditLogService.log("UPDATE", "BODY_MEASUREMENT", id, "BODY_MEASUREMENT", old, saved);
        return saved;
    }

    public List<BodyMeasurement> getMeasurementsByMember(Long memberId) {
        return bodyMeasurementRepository.findByMemberIdOrderByMeasureDateDesc(memberId);
    }

    public List<BodyMeasurement> getMeasurementsByMemberAndDateRange(Long memberId, LocalDate startDate, LocalDate endDate) {
        return bodyMeasurementRepository.findByMemberIdAndDateRange(memberId, startDate, endDate);
    }

    public BodyMeasurement getMeasurementById(Long id) {
        return bodyMeasurementRepository.findById(id)
                .orElseThrow(() -> new BusinessException("体测记录不存在"));
    }
}
