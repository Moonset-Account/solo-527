package com.energy.dashboard.controller;

import com.energy.dashboard.common.Result;
import com.energy.dashboard.entity.Meter;
import com.energy.dashboard.entity.Zone;
import com.energy.dashboard.mapper.MeterMapper;
import com.energy.dashboard.mapper.ZoneMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/data")
public class DataQueryController {

    @Autowired
    private MeterMapper meterMapper;

    @Autowired
    private ZoneMapper zoneMapper;

    @PostMapping("/query")
    public Result<Map<String, Object>> query(@RequestBody Map<String, Object> params) {
        String startTime = (String) params.get("startTime");
        String endTime = (String) params.get("endTime");
        Number zoneIdNum = (Number) params.get("zoneId");
        Number meterIdNum = (Number) params.get("meterId");
        String granularity = (String) params.get("granularity");

        Long zoneId = zoneIdNum != null ? zoneIdNum.longValue() : null;
        Long meterId = meterIdNum != null ? meterIdNum.longValue() : null;

        String meterNo = "ALL";
        if (meterId != null) {
            Meter meter = meterMapper.selectById(meterId);
            if (meter != null) {
                meterNo = meter.getMeterNo();
            }
        }

        String zoneName = "全园区";
        if (zoneId != null) {
            Zone zone = zoneMapper.selectById(zoneId);
            if (zone != null) {
                zoneName = zone.getName();
            }
        }

        double zoneMultiplier = 1.0;
        if (zoneId != null) {
            if (zoneId == 2) zoneMultiplier = 2.5;
            else if (zoneId == 3) zoneMultiplier = 0.8;
            else if (zoneId == 4) zoneMultiplier = 0.6;
        }

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

        List<Map<String, Object>> items = new ArrayList<>();

        DateTimeFormatter hourFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:00");
        DateTimeFormatter dayFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("yyyy-MM");

        LocalDateTime current = start;
        int maxPoints;
        long stepSeconds;

        if ("month".equals(granularity)) {
            maxPoints = 12;
            stepSeconds = 30L * 24 * 3600;
        } else if ("day".equals(granularity)) {
            maxPoints = 31;
            stepSeconds = 24L * 3600;
        } else {
            maxPoints = 48;
            stepSeconds = 3600L;
        }

        Random random = new Random(42);
        int count = 0;

        while (!current.isAfter(end) && count < maxPoints) {
            Map<String, Object> item = new HashMap<>();

            String timeStr;
            int hour = current.getHour();

            if ("month".equals(granularity)) {
                timeStr = current.format(monthFormatter);
            } else if ("day".equals(granularity)) {
                timeStr = current.format(dayFormatter);
            } else {
                timeStr = current.format(hourFormatter);
            }

            boolean isPeak = (hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 21);
            double baseVal;
            if ("month".equals(granularity)) {
                baseVal = 150 + random.nextDouble() * 100;
            } else if ("day".equals(granularity)) {
                baseVal = 100 + random.nextDouble() * 150;
            } else {
                baseVal = isPeak ? 150 + random.nextDouble() * 100 : 30 + random.nextDouble() * 50;
            }

            double value = Math.round(baseVal * zoneMultiplier * 10) / 10.0;

            item.put("time", timeStr);
            item.put("meterNo", meterNo);
            item.put("zoneName", zoneName);
            item.put("value", value);
            item.put("unit", "kWh");

            items.add(item);
            count++;

            current = current.plusSeconds(stepSeconds);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("total", items.size());
        result.put("items", items);

        return Result.success(result);
    }

    @PostMapping("/export")
    public void export(@RequestBody Map<String, Object> params, HttpServletResponse response) throws Exception {
        Result<Map<String, Object>> queryResult = query(params);
        Map<String, Object> data = queryResult.getData();
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
