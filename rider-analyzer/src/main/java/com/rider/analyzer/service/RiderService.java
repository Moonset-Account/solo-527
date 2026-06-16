package com.rider.analyzer.service;

import com.rider.analyzer.entity.Rider;
import com.rider.analyzer.repository.RiderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RiderService {

    private final RiderRepository riderRepository;

    public List<Rider> getRiderList(Long stationId, String status) {
        if (stationId != null && status != null) {
            return riderRepository.findByStationIdAndStatus(stationId, status);
        }
        if (stationId != null) {
            return riderRepository.findByStationId(stationId);
        }
        if (status != null) {
            return riderRepository.findByStatus(status);
        }
        return riderRepository.findAll();
    }

    public Rider getRiderById(Long id) {
        return riderRepository.findById(id).orElse(null);
    }
}
