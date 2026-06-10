package com.energy.dashboard.service;

import com.energy.dashboard.entity.Zone;

import java.util.List;
import java.util.Map;

public interface ZoneService {

    List<Map<String, Object>> getList();

    Map<String, Object> getById(Long id);

    Zone create(Zone zone);

    Zone update(Zone zone);

    List<Map<String, Object>> getMeters(Long zoneId);

    Map<String, Object> getEnergy(Long zoneId);
}
