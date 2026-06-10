package com.energy.dashboard.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.energy.dashboard.common.Result;
import com.energy.dashboard.entity.EnergyData;
import com.energy.dashboard.entity.Meter;
import com.energy.dashboard.entity.Zone;
import com.energy.dashboard.mapper.EnergyDataMapper;
import com.energy.dashboard.mapper.MeterMapper;
import com.energy.dashboard.mapper.ZoneMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.io.OutputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/data")
public class DataQueryController {

    @Autowired
    private EnergyDataMapper energyDataMapper;

    @Autowired
    private MeterMapper meterMapper;

    @Autowired
    private ZoneMapper zoneMapper;

    private String formatTime(LocalDateTime t, String granularity) {
        if ("month".equals(granularity)) {
            return t.format(DateTimeFormatter.ofPattern("yyyy-MM"));
        } else if ("day".equals(granularity)) {
            return t.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        } else {
            return t.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:00"));
        }
    }

    private String resolveDataType(String frontDataType) {
        if ("usage".equals(frontDataType) || "peak".equals(frontDataType) || "demand".equals(frontDataType)) {
            return "electricity";
        }
        return frontDataType != null ? frontDataType : "electricity";
    }

    private Map<String, Object> emptyResult() {
        Map<String, Object> result = new HashMap<>();
        result.put("total", 0);
        result.put("items", new ArrayList<>());
        return result;
    }

    @PostMapping("/query")
    public Result<Map<String, Object>> query(@RequestBody Map<String, Object> params) {
        String startTime = (String) params.get("startTime");
        String endTime = (String) params.get("endTime");
        Number zoneIdNum = (Number) params.get("zoneId");
        Number meterIdNum = (Number) params.get("meterId");
        String granularity = (String) params.get("granularity");
        String frontDataType = (String) params.get("dataType");

        Long zoneId = zoneIdNum != null ? zoneIdNum.longValue() : null;
        Long meterId = meterIdNum != null ? meterIdNum.longValue() : null;
        String dataType = resolveDataType(frontDataType);

        DateTimeFormatter inputFormatter = DateTimeFormatter.ISO_DATE_TIME;
        LocalDateTime start;
        LocalDateTime end;
        try {
            start = LocalDateTime.parse(startTime, inputFormatter);
        } catch (Exception e) {
            start = LocalDateTime.parse(startTime + "T00:00:00");
        }
        try {
            end = LocalDateTime.parse(endTime, inputFormatter);
        } catch (Exception e) {
            end = LocalDateTime.parse(endTime + "T23:59:59");
        }

        List<Long> meterIds = new ArrayList<>();
        if (meterId != null) {
            Meter m = meterMapper.selectById(meterId);
            if (m == null) {
                return Result.success(emptyResult());
            }
            meterIds.add(meterId);
        } else if (zoneId != null) {
            QueryWrapper<Meter> mw = new QueryWrapper<>();
            mw.eq("zone_id", zoneId);
            List<Meter> meters = meterMapper.selectList(mw);
            if (meters.isEmpty()) {
                return Result.success(emptyResult());
            }
            for (Meter m : meters) {
                meterIds.add(m.getId());
            }
        }

        QueryWrapper<EnergyData> wrapper = new QueryWrapper<>();
        wrapper.ge("recorded_at", start).lt("recorded_at", end);
        wrapper.eq("data_type", dataType);
        if (!meterIds.isEmpty()) {
            wrapper.in("meter_id", meterIds);
        }
        wrapper.orderByAsc("recorded_at");

        List<EnergyData> rawData = energyDataMapper.selectList(wrapper);
        if (rawData.isEmpty()) {
            return Result.success(emptyResult());
        }

        Map<Long, Meter> meterCache = new HashMap<>();
        Map<Long, Zone> zoneCache = new HashMap<>();

        Map<String, List<EnergyData>> grouped = new LinkedHashMap<>();
        for (EnergyData d : rawData) {
            String key = formatTime(d.getRecordedAt(), granularity) + "|" + d.getMeterId();
            grouped.computeIfAbsent(key, k -> new ArrayList<>()).add(d);
        }

        Map<String, BigDecimal> timeTotals = new LinkedHashMap<>();
        Map<String, String> timeUnit = new HashMap<>();
        Map<String, Map<Long, BigDecimal>> timeMeterValues = new LinkedHashMap<>();

        for (Map.Entry<String, List<EnergyData>> entry : grouped.entrySet()) {
            String[] parts = entry.getKey().split("\\|", 2);
            String timeKey = parts[0];
            Long mId = Long.parseLong(parts[1]);

            BigDecimal sum = BigDecimal.ZERO;
            String unit = null;
            for (EnergyData d : entry.getValue()) {
                if (d.getValue() != null) sum = sum.add(d.getValue());
                if (unit == null && d.getUnit() != null) unit = d.getUnit();
            }

            timeTotals.merge(timeKey, sum, BigDecimal::add);
            if (unit != null) timeUnit.putIfAbsent(timeKey, unit);

            timeMeterValues.computeIfAbsent(timeKey, k -> new HashMap<>()).put(mId, sum);
        }

        String zoneNameStr = "全园区";
        if (zoneId != null) {
            Zone z = zoneMapper.selectById(zoneId);
            if (z != null) zoneNameStr = z.getName() != null ? z.getName() : "";
        }

        List<Map<String, Object>> items = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : timeTotals.entrySet()) {
            String timeKey = entry.getKey();
            BigDecimal totalValue = entry.getValue();
            String unit = timeUnit.getOrDefault(timeKey, "kWh");

            if (meterId != null) {
                Meter m = meterCache.computeIfAbsent(meterId, mid -> meterMapper.selectById(mid));
                String meterNoStr = "";
                String rowZoneName = zoneNameStr;
                if (m != null) {
                    meterNoStr = m.getMeterNo() != null ? m.getMeterNo() : "";
                    if (m.getZoneId() != null) {
                        Zone z = zoneCache.computeIfAbsent(m.getZoneId(), zid -> zoneMapper.selectById(zid));
                        if (z != null) rowZoneName = z.getName() != null ? z.getName() : "";
                    }
                }
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("time", timeKey);
                row.put("meterNo", meterNoStr);
                row.put("zoneName", rowZoneName);
                Map<Long, BigDecimal> mv = timeMeterValues.get(timeKey);
                row.put("value", mv != null && mv.containsKey(meterId) ? mv.get(meterId) : totalValue);
                row.put("unit", unit);
                items.add(row);
            } else {
                String meterNoStr = "ALL";
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("time", timeKey);
                row.put("meterNo", meterNoStr);
                row.put("zoneName", zoneNameStr);
                row.put("value", totalValue);
                row.put("unit", unit);
                items.add(row);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("total", items.size());
        result.put("items", items);

        return Result.success(result);
    }

    @PostMapping("/export")
    public void export(@RequestBody Map<String, Object> params, HttpServletResponse response) throws Exception {
        Map<String, Object> data = query(params).getData();
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items = (List<Map<String, Object>>) data.get("items");

        StringBuilder csv = new StringBuilder();
        csv.append("时间,电表号,区域,数值,单位\n");

        for (Map<String, Object> item : items) {
            csv.append(item.get("time")).append(",");
            csv.append(item.get("meterNo")).append(",");
            csv.append(item.get("zoneName")).append(",");
            csv.append(item.get("value")).append(",");
            csv.append(item.get("unit")).append("\n");
        }

        response.setContentType("text/csv;charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"data_export.csv\"");

        try (OutputStream os = response.getOutputStream()) {
            os.write(csv.toString().getBytes(StandardCharsets.UTF_8));
            os.flush();
        }
    }
}
