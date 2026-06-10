package com.energy.dashboard.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.energy.dashboard.config.EnumMapping;
import com.energy.dashboard.entity.EnergyData;
import com.energy.dashboard.entity.Meter;
import com.energy.dashboard.entity.Zone;
import com.energy.dashboard.mapper.EnergyDataMapper;
import com.energy.dashboard.mapper.MeterMapper;
import com.energy.dashboard.mapper.ZoneMapper;
import com.energy.dashboard.service.ZoneService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ZoneServiceImpl implements ZoneService {

    @Autowired
    private ZoneMapper zoneMapper;

    @Autowired
    private MeterMapper meterMapper;

    @Autowired
    private EnergyDataMapper energyDataMapper;

    private static final String ENERGY_TYPE = "electricity";
    private static final int[] PEAK_HOURS = {8, 9, 10, 11, 17, 18, 19, 20, 21};

    private List<Long> getMeterIdsForZone(Long zoneId) {
        QueryWrapper<Meter> wrapper = new QueryWrapper<>();
        if (zoneId != null) {
            wrapper.eq("zone_id", zoneId);
        }
        return meterMapper.selectList(wrapper).stream().map(Meter::getId).collect(Collectors.toList());
    }

    private double sumUsage(LocalDateTime start, LocalDateTime end, List<Long> meterIds) {
        if (meterIds.isEmpty()) return 0.0;
        QueryWrapper<EnergyData> wrapper = new QueryWrapper<>();
        wrapper.select("COALESCE(SUM(value), 0) as total")
                .eq("data_type", ENERGY_TYPE)
                .in("meter_id", meterIds)
                .ge("recorded_at", start)
                .lt("recorded_at", end);
        Map<String, Object> result = energyDataMapper.selectMaps(wrapper).stream().findFirst().orElse(null);
        if (result == null || result.get("total") == null) return 0.0;
        return ((Number) result.get("total")).doubleValue();
    }

    private double getTotalUsageForZone(Long zoneId) {
        List<Long> meterIds = getMeterIdsForZone(zoneId);
        if (meterIds.isEmpty()) return 0.0;
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime nowEnd = LocalDateTime.now();
        return sumUsage(monthStart, nowEnd, meterIds);
    }

    private int countMetersByZone(Long zoneId) {
        QueryWrapper<Meter> wrapper = new QueryWrapper<>();
        wrapper.eq("zone_id", zoneId);
        Long count = meterMapper.selectCount(wrapper);
        return count != null ? count.intValue() : 0;
    }

    private String calcLastSyncStatus(Meter meter) {
        if (meter.getLastSyncTime() != null) {
            LocalDateTime twoHoursAgo = LocalDateTime.now().minusHours(2);
            if (meter.getLastSyncTime().isAfter(twoHoursAgo)) {
                return "success";
            }
        }
        if ("fault".equals(meter.getStatus())) {
            return "failed";
        }
        if ("offline".equals(meter.getStatus())) {
            return "pending";
        }
        return "success";
    }

    private Map<String, Object> enrichMeterWithZone(Meter meter, String zoneName) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", meter.getId());
        map.put("meterNo", meter.getMeterNo());
        map.put("location", meter.getLocation());
        map.put("zoneId", meter.getZoneId());
        map.put("status", EnumMapping.mapMeterStatus(meter.getStatus()));
        map.put("communicationParams", meter.getCommunicationParams());
        map.put("sourceDocumentNo", meter.getSourceDocumentNo());
        map.put("remark", meter.getRemark());
        map.put("lastSyncTime", meter.getLastSyncTime());
        map.put("createdAt", meter.getCreatedAt());
        map.put("zoneName", zoneName != null ? zoneName : "");
        map.put("lastSyncStatus", calcLastSyncStatus(meter));
        return map;
    }

    private Map<String, Object> enrichZone(Zone zone) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", zone.getId());
        map.put("name", zone.getName());
        map.put("sourceDocumentNo", zone.getSourceDocumentNo());
        map.put("remark", zone.getRemark());
        map.put("createdAt", zone.getCreatedAt());
        map.put("meterCount", countMetersByZone(zone.getId()));
        map.put("totalUsage", Math.round(getTotalUsageForZone(zone.getId()) * 10.0) / 10.0);
        return map;
    }

    @Override
    public List<Map<String, Object>> getList() {
        List<Zone> zones = zoneMapper.selectList(null);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Zone zone : zones) {
            result.add(enrichZone(zone));
        }
        return result;
    }

    @Override
    public Map<String, Object> getById(Long id) {
        Zone zone = zoneMapper.selectById(id);
        if (zone == null) return null;
        return enrichZone(zone);
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
    public List<Map<String, Object>> getMeters(Long zoneId) {
        QueryWrapper<Meter> wrapper = new QueryWrapper<>();
        wrapper.eq("zone_id", zoneId);
        List<Meter> meters = meterMapper.selectList(wrapper);

        Zone zone = zoneMapper.selectById(zoneId);
        String zoneName = zone != null ? zone.getName() : "";

        List<Map<String, Object>> result = new ArrayList<>();
        for (Meter meter : meters) {
            result.add(enrichMeterWithZone(meter, zoneName));
        }
        return result;
    }

    @Override
    public Map<String, Object> getEnergy(Long zoneId) {
        Map<String, Object> result = new HashMap<>();

        List<Long> meterIds = getMeterIdsForZone(zoneId);
        if (meterIds.isEmpty()) {
            result.put("usage", 0.0);
            result.put("curve", new ArrayList<>());
            return result;
        }

        double usage = getTotalUsageForZone(zoneId);
        result.put("usage", Math.round(usage * 10.0) / 10.0);

        if (usage == 0.0) {
            result.put("curve", new ArrayList<>());
            return result;
        }

        List<Map<String, Object>> curve = new ArrayList<>();
        LocalDate today = LocalDate.now();
        int days = Math.min(today.getDayOfMonth(), 30);
        for (int d = 1; d <= days; d++) {
            LocalDate date = today.withDayOfMonth(d);
            double val = sumUsage(date.atStartOfDay(), date.plusDays(1).atStartOfDay(), meterIds);
            Map<String, Object> point = new HashMap<>();
            point.put("time", date.toString());
            point.put("value", BigDecimal.valueOf(Math.round(val * 10.0) / 10.0));
            point.put("isPeak", false);
            curve.add(point);
        }

        result.put("curve", curve);
        return result;
    }
}
