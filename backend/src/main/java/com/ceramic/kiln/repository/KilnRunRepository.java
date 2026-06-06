package com.ceramic.kiln.repository;

import com.ceramic.kiln.entity.KilnRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KilnRunRepository extends JpaRepository<KilnRun, Long>, JpaSpecificationExecutor<KilnRun> {
    Optional<KilnRun> findByRunCode(String runCode);
    List<KilnRun> findByKilnId(Long kilnId);
    List<KilnRun> findByStatus(String status);
    List<KilnRun> findByTemperatureZoneAndStatusIn(String temperatureZone, List<String> statuses);
}
