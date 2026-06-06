package com.ceramic.kiln.repository;

import com.ceramic.kiln.entity.Glaze;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GlazeRepository extends JpaRepository<Glaze, Long>, JpaSpecificationExecutor<Glaze> {
    Optional<Glaze> findByCode(String code);
    List<Glaze> findByIsActiveTrue();
    List<Glaze> findByTemperatureZoneAndIsActiveTrue(String temperatureZone);
}
