package com.rider.analyzer.repository;

import com.rider.analyzer.entity.StationInventory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StationInventoryRepository extends JpaRepository<StationInventory, Long> {

    List<StationInventory> findByStationId(Long stationId);
}
