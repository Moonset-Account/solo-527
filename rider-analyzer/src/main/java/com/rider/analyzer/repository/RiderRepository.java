package com.rider.analyzer.repository;

import com.rider.analyzer.entity.Rider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RiderRepository extends JpaRepository<Rider, Long> {

    List<Rider> findByStationId(Long stationId);

    List<Rider> findByStatus(String status);

    List<Rider> findByStationIdAndStatus(Long stationId, String status);
}
