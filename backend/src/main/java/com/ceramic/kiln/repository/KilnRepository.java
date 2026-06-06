package com.ceramic.kiln.repository;

import com.ceramic.kiln.entity.Kiln;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KilnRepository extends JpaRepository<Kiln, Long>, JpaSpecificationExecutor<Kiln> {
    Optional<Kiln> findByCode(String code);
    List<Kiln> findByStatus(String status);
    
    @Query(value = "SELECT * FROM kilns WHERE ?1 = ANY(temperature_zones)", nativeQuery = true)
    List<Kiln> findByTemperatureZone(String temperatureZone);
}
