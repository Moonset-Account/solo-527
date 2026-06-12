package com.energy.repository;

import com.energy.entity.Meter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MeterRepository extends JpaRepository<Meter, Long> {
    List<Meter> findByArea(String area);
    List<Meter> findByStatus(String status);
    Meter findByMeterCode(String meterCode);

    @Query("SELECT DISTINCT m.area FROM Meter m ORDER BY m.area")
    List<String> findAllAreas();
}
