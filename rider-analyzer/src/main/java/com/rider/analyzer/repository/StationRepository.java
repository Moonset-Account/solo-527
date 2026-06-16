package com.rider.analyzer.repository;

import com.rider.analyzer.entity.Station;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StationRepository extends JpaRepository<Station, Long> {
}
