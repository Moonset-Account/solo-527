package com.energy.dashboard.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.energy.dashboard.entity.EnergyData;
import com.energy.dashboard.entity.Zone;
import com.energy.dashboard.mapper.EnergyDataMapper;
import com.energy.dashboard.mapper.ZoneMapper;
import com.energy.dashboard.service.EnergyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Service
public class EnergyServiceImpl implements EnergyService {

    @Autowired
    private EnergyDataMapper energyDataMapper;

    @Autowired
    private ZoneMapper zoneMapper;

    private final Random random = new Random();

    @Override
    public Map<String, Object> getOverview() {
        Map<String, Object> overview = new HashMap<>();

        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = todayStart.plusDays(1);
        LocalDateTime yesterdayStart = todayStart.minusDays(1);
        LocalDateTime yesterdayEnd = todayStart;
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime lastMonthStart = monthStart.minusMonths(1);
        LocalDateTime lastMonthEnd = monthStart;

        Double todayUsage = querySumUsage(todayStart, todayEnd);
        Double yesterdayUsage = querySumUsage(yesterdayStart, yesterdayEnd);
        Double monthUsage = querySumUsage(monthStart, todayEnd);
        Double lastMonthUsage = querySumUsage(lastMonthStart, lastMonthEnd);
        Double peakUsage = queryPeakUsage(todayStart, todayEnd);

        if (todayUsage == null && yesterdayUsage == null && monthUsage == null) {
            todayUsage = 2856.3;
            yesterdayUsage = 3120.8;
            monthUsage = 63550.5;
            lastMonthUsage = 58920.0;
            peakUsage = 1860.5;
        }

        double peakRatio = todayUsage != null && todayUsage > 0
                ? Math.round((peakUsage / todayUsage) * 1000.0) / 1000.0
                : 0.651;

        overview.put("todayUsage", todayUsage);
        overview.put("monthUsage", monthUsage);
        overview.put("yesterdayUsage", yesterdayUsage);
        overview.put("lastMonthUsage", lastMonthUsage);
        overview.put("peakUsage", peakUsage);
        overview.put("peakRatio", peakRatio);

        return overview;
    }

    private Double querySumUsage(LocalDateTime start, LocalDateTime end) {
        QueryWrapper<EnergyData> wrapper = new QueryWrapper<>();
        wrapper.select("COALESCE(SUM(value), 0) as total")
                .eq("data_type", "usage")
                .ge("recorded_at", start)
                .lt("recorded_at", end);
        Map<String, Object> result = energyDataMapper.selectMaps(wrapper).stream().findFirst().orElse(null);
        if (result == null) return null;
        Object total = result.get("total");
        if (total == null) return null;
        double val = ((Number) total).doubleValue();
        return val > 0 ? val : null;
    }

    private Double queryPeakUsage(LocalDateTime start, LocalDateTime end) {
        double total = 0;
        boolean hasData = false;
        for (int hour : new int[]{8, 9, 10, 11, 17, 18, 19, 20, 21}) {
            LocalDateTime hStart = start.withHour(hour).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime hEnd = hStart.plusHours(1);
            if (hStart.isAfter(LocalDateTime.now())) continue;
            QueryWrapper<EnergyData> wrapper = new QueryWrapper<>();
            wrapper.select("COALESCE(SUM(value), 0) as total")
                    .eq("data_type", "usage")
                    .ge("recorded_at", hStart)
                    .lt("recorded_at", hEnd);
            Map<String, Object> result = energyDataMapper.selectMaps(wrapper).stream().findFirst().orElse(null);
            if (result != null && result.get("total") != null) {
                double val = ((Number) result.get("total")).doubleValue();
                if (val > 0) {
                    total += val;
                    hasData = true;
                }
            }
        }
        return hasData ? total : 1860.5;
    }

    @Override
    public List<Map<String, Object>> getCurve(String period, Long zoneId) {
        List<Map<String, Object>> points = new ArrayList<>();
        double multiplier = zoneId == null ? 1.0
                : zoneId == 2 ? 2.5
                : zoneId == 3 ? 0.8
                : zoneId == 4 ? 0.6
                : 1.0;

        if ("day".equals(period) || "today".equals(period)) {
            int currentHour = LocalDateTime.now().getHour();
            for (int h = 0; h <= currentHour; h++) {
                boolean isPeak = (h >= 8 && h <= 11) || (h >= 17 && h <= 21);
                double baseLoad = isPeak ? 180 + random.nextDouble() * 80 : 40 + random.nextDouble() * 60;
                Map<String, Object> point = new HashMap<>();
                point.put("time", String.format("%02d:00", h));
                point.put("value", Math.round(baseLoad * multiplier * 10) / 10.0);
                point.put("isPeak", isPeak);
                points.add(point);
            }
        } else if ("yesterday".equals(period)) {
            for (int h = 0; h <= 23; h++) {
                boolean isPeak = (h >= 8 && h <= 11) || (h >= 17 && h <= 21);
                double baseLoad = isPeak ? 180 + random.nextDouble() * 80 : 40 + random.nextDouble() * 60;
                Map<String, Object> point = new HashMap<>();
                point.put("time", String.format("%02d:00", h));
                point.put("value", Math.round(baseLoad * multiplier * 10) / 10.0);
                point.put("isPeak", isPeak);
                points.add(point);
            }
        } else if ("week".equals(period)) {
            LocalDate today = LocalDate.now();
            for (int d = 6; d >= 0; d--) {
                LocalDate date = today.minusDays(d);
                int dayOfWeek = date.getDayOfWeek().getValue();
                boolean isWeekend = dayOfWeek == 6 || dayOfWeek == 7;
                double dailyTotal = isWeekend ? 800 + random.nextDouble() * 300 : 2500 + random.nextDouble() * 800;
                Map<String, Object> point = new HashMap<>();
                point.put("time", (date.getMonthValue()) + "/" + date.getDayOfMonth());
                point.put("value", Math.round(dailyTotal * multiplier * 10) / 10.0);
                point.put("isPeak", !isWeekend);
                points.add(point);
            }
        } else if ("month".equals(period)) {
            LocalDate today = LocalDate.now();
            for (int d = 1; d <= 30; d++) {
                LocalDate date = LocalDate.of(today.getYear(), today.getMonth(), Math.min(d, today.lengthOfMonth()));
                int dayOfWeek = date.getDayOfWeek().getValue();
                boolean isWeekend = dayOfWeek == 6 || dayOfWeek == 7;
                double dailyTotal = isWeekend ? 800 + random.nextDouble() * 300 : 2500 + random.nextDouble() * 800;
                Map<String, Object> point = new HashMap<>();
                point.put("time", d + "日");
                point.put("value", Math.round(dailyTotal * multiplier * 10) / 10.0);
                point.put("isPeak", !isWeekend);
                points.add(point);
            }
        }

        return points;
    }

    @Override
    public List<Map<String, Object>> getZoneComparison() {
        List<Zone> zones = zoneMapper.selectList(null);
        List<Map<String, Object>> result = new ArrayList<>();

        Map<Long, Double> mockUsages = new HashMap<>();
        mockUsages.put(1L, 12580.5);
        mockUsages.put(2L, 38720.0);
        mockUsages.put(3L, 6830.0);
        mockUsages.put(4L, 5420.0);

        double total = 0;
        List<Map<String, Object>> tempList = new ArrayList<>();

        for (Zone zone : zones) {
            double usage = mockUsages.getOrDefault(zone.getId(), 0.0);
            total += usage;
            Map<String, Object> item = new HashMap<>();
            item.put("zoneId", zone.getId());
            item.put("zoneName", zone.getName());
            item.put("usage", usage);
            tempList.add(item);
        }

        if (tempList.isEmpty()) {
            String[] defaultNames = {"A栋办公区", "B栋生产区", "C栋仓储区", "综合服务区"};
            long[] defaultIds = {1L, 2L, 3L, 4L};
            double[] defaultUsages = {12580.5, 38720.0, 6830.0, 5420.0};
            total = 0;
            for (double u : defaultUsages) total += u;
            for (int i = 0; i < 4; i++) {
                Map<String, Object> item = new HashMap<>();
                item.put("zoneId", defaultIds[i]);
                item.put("zoneName", defaultNames[i]);
                item.put("usage", defaultUsages[i]);
                tempList.add(item);
            }
        }

        for (Map<String, Object> item : tempList) {
            double usage = (Double) item.get("usage");
            double percentage = total > 0 ? Math.round((usage / total) * 1000.0) / 10.0 : 0;
            item.put("percentage", percentage);
            result.add(item);
        }

        return result;
    }
}
