package com.gym.repository;

import com.gym.entity.BodyMeasurement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BodyMeasurementRepository extends JpaRepository<BodyMeasurement, Long> {

    List<BodyMeasurement> findByMemberIdOrderByMeasureDateDesc(Long memberId);

    List<BodyMeasurement> findByCoachIdOrderByMeasureDateDesc(Long coachId);
}
