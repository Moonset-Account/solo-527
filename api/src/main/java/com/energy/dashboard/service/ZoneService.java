package com.energy.dashboard.service;

import com.energy.dashboard.entity.EnergyData;
import com.energy.dashboard.entity.Meter;
import com.energy.dashboard.entity.Zone;

import java.util.List;

public interface ZoneService {

    List<Zone> getList();

    Zone getById(Long id);

    Zone create(Zone zone);

    Zone update(Zone zone);

    List<Meter> getMeters(Long zoneId);

    List<EnergyData> getEnergy(Long zoneId);
}
