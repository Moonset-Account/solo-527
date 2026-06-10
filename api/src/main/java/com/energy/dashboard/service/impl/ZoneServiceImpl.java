package com.energy.dashboard.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.energy.dashboard.entity.EnergyData;
import com.energy.dashboard.entity.Meter;
import com.energy.dashboard.entity.Zone;
import com.energy.dashboard.mapper.EnergyDataMapper;
import com.energy.dashboard.mapper.MeterMapper;
import com.energy.dashboard.mapper.ZoneMapper;
import com.energy.dashboard.service.ZoneService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ZoneServiceImpl implements ZoneService {

    @Autowired
    private ZoneMapper zoneMapper;

    @Autowired
    private MeterMapper meterMapper;

    @Autowired
    private EnergyDataMapper energyDataMapper;

    @Override
    public List<Zone> getList() {
        return zoneMapper.selectList(null);
    }

    @Override
    public Zone getById(Long id) {
        return zoneMapper.selectById(id);
    }

    @Override
    public Zone create(Zone zone) {
        zone.setCreatedAt(LocalDateTime.now());
        zone.setUpdatedAt(LocalDateTime.now());
        zoneMapper.insert(zone);
        return zone;
    }

    @Override
    public Zone update(Zone zone) {
        zone.setUpdatedAt(LocalDateTime.now());
        zoneMapper.updateById(zone);
        return zoneMapper.selectById(zone.getId());
    }

    @Override
    public List<Meter> getMeters(Long zoneId) {
        QueryWrapper<Meter> wrapper = new QueryWrapper<>();
        wrapper.eq("zone_id", zoneId);
        return meterMapper.selectList(wrapper);
    }

    @Override
    public List<EnergyData> getEnergy(Long zoneId) {
        QueryWrapper<Meter> meterWrapper = new QueryWrapper<>();
        meterWrapper.eq("zone_id", zoneId);
        List<Meter> meters = meterMapper.selectList(meterWrapper);

        List<Long> meterIds = meters.stream().map(Meter::getId).collect(Collectors.toList());
        if (meterIds.isEmpty()) {
            return List.of();
        }

        QueryWrapper<EnergyData> wrapper = new QueryWrapper<>();
        wrapper.in("meter_id", meterIds);
        wrapper.orderByDesc("recorded_at");
        return energyDataMapper.selectList(wrapper);
    }
}
