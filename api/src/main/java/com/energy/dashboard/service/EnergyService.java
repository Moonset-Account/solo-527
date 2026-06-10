package com.energy.dashboard.service;

import java.util.List;
import java.util.Map;

public interface EnergyService {

    Map<String, Object> getOverview();

    List<Map<String, Object>> getCurve(String period, Long zoneId);

    List<Map<String, Object>> getZoneComparison();
}
