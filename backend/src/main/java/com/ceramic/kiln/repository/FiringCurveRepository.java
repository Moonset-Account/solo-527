package com.ceramic.kiln.repository;

import com.ceramic.kiln.entity.FiringCurve;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FiringCurveRepository extends JpaRepository<FiringCurve, Long>, JpaSpecificationExecutor<FiringCurve> {
    Optional<FiringCurve> findByCode(String code);
    List<FiringCurve> findByIsPublicTrue();
    List<FiringCurve> findByTemperatureZoneAndIsPublicTrue(String temperatureZone);
}
