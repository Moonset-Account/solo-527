package com.energy.dashboard.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.energy.dashboard.common.PageResult;
import com.energy.dashboard.config.EnumMapping;
import com.energy.dashboard.entity.Meter;
import com.energy.dashboard.entity.Zone;
import com.energy.dashboard.mapper.MeterMapper;
import com.energy.dashboard.mapper.ZoneMapper;
import com.energy.dashboard.service.MeterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class MeterServiceImpl implements MeterService {

    @Autowired
    private MeterMapper meterMapper;

    @Autowired
    private ZoneMapper zoneMapper;

    private int toInt(Object val, int def) {
        if (val == null) return def;
        if (val instanceof Number) return ((Number) val).intValue();
        if (val instanceof String) {
            try { return Integer.parseInt((String) val); } catch (Exception e) { return def; }
        }
        return def;
    }

    private String calcLastSyncStatus(Meter meter) {
        if (meter.getLastSyncTime() != null) {
            LocalDateTime twoHoursAgo = LocalDateTime.now().minusHours(2);
            if (meter.getLastSyncTime().isAfter(twoHoursAgo)) {
                return "success";
            }
        }
        String mappedStatus = EnumMapping.mapMeterStatus(meter.getStatus());
        if ("fault".equals(mappedStatus)) {
            return "failed";
        }
        if ("offline".equals(mappedStatus)) {
            return "pending";
        }
        return "success";
    }

    private Map<String, Object> enrichMeter(Meter meter) {
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

        if (meter.getZoneId() != null) {
            Zone zone = zoneMapper.selectById(meter.getZoneId());
            if (zone != null) {
                map.put("zoneName", zone.getName());
            } else {
                map.put("zoneName", "");
            }
        } else {
            map.put("zoneName", "");
        }
        map.put("lastSyncStatus", calcLastSyncStatus(meter));
        return map;
    }

    @Override
    public PageResult<Map<String, Object>> getList(Map<String, Object> params) {
        int page = toInt(params.get("page"), 1);
        int pageSize = toInt(params.get("pageSize"), 10);

        QueryWrapper<Meter> wrapper = new QueryWrapper<>();
        if (params.containsKey("zoneId")) {
            wrapper.eq("zone_id", params.get("zoneId"));
        }
        if (params.containsKey("status")) {
            String status = (String) params.get("status");
            if ("fault".equals(status)) {
                wrapper.eq("status", "warning");
            } else {
                wrapper.eq("status", status);
            }
        }
        if (params.containsKey("keyword") && params.get("keyword") != null && !params.get("keyword").toString().trim().isEmpty()) {
            wrapper.like("meter_no", params.get("keyword").toString().trim());
        }

        Page<Meter> result = meterMapper.selectPage(new Page<>(page, pageSize), wrapper);
        List<Map<String, Object>> enrichedList = new ArrayList<>();
        for (Meter meter : result.getRecords()) {
            enrichedList.add(enrichMeter(meter));
        }
        return new PageResult<>(result.getTotal(), enrichedList);
    }

    @Override
    public Map<String, Object> getById(Long id) {
        Meter meter = meterMapper.selectById(id);
        if (meter == null) return null;
        return enrichMeter(meter);
    }

    @Override
    public Meter create(Meter meter) {
        meter.setCreatedAt(LocalDateTime.now());
        meter.setUpdatedAt(LocalDateTime.now());
        meterMapper.insert(meter);
        return meter;
    }

    @Override
    public Meter update(Long id, Meter meter) {
        meter.setId(id);
        meter.setUpdatedAt(LocalDateTime.now());
        meterMapper.updateById(meter);
        return meterMapper.selectById(id);
    }
}
