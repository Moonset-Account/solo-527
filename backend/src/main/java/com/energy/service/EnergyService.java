package com.energy.service;

import com.energy.dto.EnergyQueryDTO;
import com.energy.dto.EnergyDataPoint;
import com.energy.entity.MeterReading;

import java.util.List;
import java.util.Map;

public interface EnergyService {
    List<EnergyDataPoint> getEnergyCurve(EnergyQueryDTO dto);
    List<EnergyDataPoint> getPeakAnalysis(EnergyQueryDTO dto);
    List<MeterReading> validateReadings(EnergyQueryDTO dto);
    byte[] exportPeakByArea(EnergyQueryDTO dto);
    String generatePeakCsv(EnergyQueryDTO dto);
    Map<String, Object> getDashboardStats();
    List<String> getAllAreas();
}
