package com.rider.analyzer.service;

import com.rider.analyzer.entity.Station;
import com.rider.analyzer.entity.StationInventory;
import com.rider.analyzer.repository.StationInventoryRepository;
import com.rider.analyzer.repository.StationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StationService {

    private final StationRepository stationRepository;
    private final StationInventoryRepository stationInventoryRepository;

    public List<Station> getStationList() {
        return stationRepository.findAll();
    }

    public List<StationInventory> getStationInventory(Long stationId) {
        return stationInventoryRepository.findByStationId(stationId);
    }
}
