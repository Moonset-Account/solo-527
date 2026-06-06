package com.ceramic.kiln.repository;

import com.ceramic.kiln.entity.Clay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClayRepository extends JpaRepository<Clay, Long>, JpaSpecificationExecutor<Clay> {
    Optional<Clay> findByCode(String code);
    List<Clay> findByIsActiveTrue();
    List<Clay> findByTemperatureZoneAndIsActiveTrue(String temperatureZone);
}
