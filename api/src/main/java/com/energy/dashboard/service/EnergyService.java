package com.energy.dashboard.service;

import com.energy.dashboard.entity.EnergyData;

import java.util.List;
import java.util.Map;

public interface EnergyService {

    Map<String, Object> getOverview();

    List<EnergyData> getCurve(String period, Long zoneId);

    List<Map<String, Object>> getZoneComparison();
}
