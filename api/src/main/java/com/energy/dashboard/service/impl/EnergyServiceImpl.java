package com.energy.dashboard.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.energy.dashboard.entity.EnergyData;
import com.energy.dashboard.entity.Meter;
import com.energy.dashboard.entity.Zone;
import com.energy.dashboard.mapper.EnergyDataMapper;
import com.energy.dashboard.mapper.MeterMapper;
import com.energy.dashboard.mapper.ZoneMapper;
import com.energy.dashboard.service.EnergyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class EnergyServiceImpl implements EnergyService {

    @Autowired
    private EnergyDataMapper energyDataMapper;

    @Autowired
    private ZoneMapper zoneMapper;

    @Autowired
    private MeterMapper meterMapper;

    private static final String ENERGY_TYPE = "electricity";
    private static final int[] PEAK_HOURS = {8, 9, 10, 11, 17, 18, 19, 20, 21};

    private List<Long> resolveMeterIdsForZone(Long zoneId) {
        QueryWrapper<Meter> wrapper = new QueryWrapper<>();
        if (zoneId != null) {
            wrapper.eq("zone_id", zoneId);
        }
        List<Meter> meters = meterMapper.selectList(wrapper);
        return meters.stream().map(Meter::getId).collect(Collectors.toList());
    }

    private double querySumUsage(LocalDateTime start, LocalDateTime end, Long zoneId) {
        List<Long> meterIds = resolveMeterIdsForZone(zoneId);
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

    @Override
    public Map<String, Object> getOverview() {
        Map<String, Object> overview = new HashMap<>();

        LocalDate today = LocalDate.now();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime todayEnd = todayStart.plusDays(1);
        LocalDateTime yesterdayStart = todayStart.minusDays(1);
        LocalDateTime yesterdayEnd = todayStart;
        LocalDateTime monthStart = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime lastMonthStart = monthStart.minusMonths(1);
        LocalDateTime lastMonthEnd = monthStart;

        double todayUsage = querySumUsage(todayStart, todayEnd, null);
        double yesterdayUsage = querySumUsage(yesterdayStart, yesterdayEnd, null);
        double monthUsage = querySumUsage(monthStart, todayEnd, null);
        double lastMonthUsage = querySumUsage(lastMonthStart, lastMonthEnd, null);

        double peakUsage = 0.0;
        for (int hour : PEAK_HOURS) {
            LocalDateTime hStart = todayStart.withHour(hour);
            LocalDateTime hEnd = hStart.plusHours(1);
            if (hStart.isAfter(LocalDateTime.now())) continue;
            peakUsage += querySumUsage(hStart, hEnd, null);
        }

        double peakRatio = todayUsage > 0 ? Math.round((peakUsage / todayUsage) * 1000.0) / 1000.0 : 0.0;

        overview.put("todayUsage", Math.round(todayUsage * 10.0) / 10.0);
        overview.put("monthUsage", Math.round(monthUsage * 10.0) / 10.0);
        overview.put("yesterdayUsage", Math.round(yesterdayUsage * 10.0) / 10.0);
        overview.put("lastMonthUsage", Math.round(lastMonthUsage * 10.0) / 10.0);
        overview.put("peakUsage", Math.round(peakUsage * 10.0) / 10.0);
        overview.put("peakRatio", peakRatio);

        return overview;
    }

    @Override
    public List<Map<String, Object>> getCurve(String period, Long zoneId) {
        List<Map<String, Object>> points = new ArrayList<>();
        List<Long> meterIds = resolveMeterIdsForZone(zoneId);
        if (meterIds.isEmpty()) {
            return points;
        }

        LocalDateTime rangeStart;
        LocalDateTime rangeEnd = LocalDateTime.now();

        if ("day".equals(period) || "today".equals(period)) {
            rangeStart = LocalDate.now().atStartOfDay();
        } else if ("yesterday".equals(period)) {
            rangeStart = LocalDate.now().minusDays(1).atStartOfDay();
            rangeEnd = LocalDate.now().atStartOfDay();
        } else if ("week".equals(period)) {
            rangeStart = LocalDate.now().minusDays(6).atStartOfDay();
        } else if ("month".equals(period)) {
            rangeStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        } else {
            rangeStart = LocalDate.now().atStartOfDay();
        }

        QueryWrapper<EnergyData> checkWrapper = new QueryWrapper<>();
        checkWrapper.eq("data_type", ENERGY_TYPE)
                .in("meter_id", meterIds)
                .ge("recorded_at", rangeStart)
                .lt("recorded_at", rangeEnd);
        Long count = energyDataMapper.selectCount(checkWrapper);
        if (count == null || count == 0) {
            return points;
        }

        if ("day".equals(period) || "today".equals(period)) {
            LocalDate today = LocalDate.now();
            int currentHour = LocalDateTime.now().getHour();
            for (int h = 0; h <= currentHour; h++) {
                LocalDateTime start = today.atTime(h, 0, 0);
                LocalDateTime end = start.plusHours(1);
                boolean isPeak = isPeakHour(h);
                double val = querySumUsage(start, end, zoneId);
                Map<String, Object> point = new HashMap<>();
                point.put("time", String.format("%02d:00", h));
                point.put("value", Math.round(val * 10.0) / 10.0);
                point.put("isPeak", isPeak);
                points.add(point);
            }
        } else if ("yesterday".equals(period)) {
            LocalDate yesterday = LocalDate.now().minusDays(1);
            for (int h = 0; h <= 23; h++) {
                LocalDateTime start = yesterday.atTime(h, 0, 0);
                LocalDateTime end = start.plusHours(1);
                boolean isPeak = isPeakHour(h);
                double val = querySumUsage(start, end, zoneId);
                Map<String, Object> point = new HashMap<>();
                point.put("time", String.format("%02d:00", h));
                point.put("value", Math.round(val * 10.0) / 10.0);
                point.put("isPeak", isPeak);
                points.add(point);
            }
        } else if ("week".equals(period)) {
            LocalDate today = LocalDate.now();
            for (int d = 6; d >= 0; d--) {
                LocalDate date = today.minusDays(d);
                double val = querySumUsage(date.atStartOfDay(), date.plusDays(1).atStartOfDay(), zoneId);
                int dayOfWeek = date.getDayOfWeek().getValue();
                Map<String, Object> point = new HashMap<>();
                point.put("time", date.getMonthValue() + "/" + date.getDayOfMonth());
                point.put("value", Math.round(val * 10.0) / 10.0);
                point.put("isPeak", dayOfWeek != 6 && dayOfWeek != 7);
                points.add(point);
            }
        } else if ("month".equals(period)) {
            LocalDate today = LocalDate.now();
            int daysInMonth = today.lengthOfMonth();
            for (int d = 1; d <= daysInMonth; d++) {
                LocalDate date = today.withDayOfMonth(d);
                if (date.isAfter(today)) break;
                double val = querySumUsage(date.atStartOfDay(), date.plusDays(1).atStartOfDay(), zoneId);
                Map<String, Object> point = new HashMap<>();
                point.put("time", d + "日");
                point.put("value", Math.round(val * 10.0) / 10.0);
                int dayOfWeek = date.getDayOfWeek().getValue();
                point.put("isPeak", dayOfWeek != 6 && dayOfWeek != 7);
                points.add(point);
            }
        }

        return points;
    }

    private boolean isPeakHour(int h) {
        return (h >= 8 && h <= 11) || (h >= 17 && h <= 21);
    }

    @Override
    public List<Map<String, Object>> getZoneComparison() {
        List<Zone> zones = zoneMapper.selectList(null);
        List<Map<String, Object>> result = new ArrayList<>();

        Map<Long, Double> zoneUsages = new HashMap<>();
        double total = 0.0;
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime nowEnd = LocalDateTime.now();

        for (Zone zone : zones) {
            double usage = querySumUsage(monthStart, nowEnd, zone.getId());
            zoneUsages.put(zone.getId(), usage);
            total += usage;
        }

        for (Zone zone : zones) {
            double usage = zoneUsages.getOrDefault(zone.getId(), 0.0);
            double percentage = total > 0 ? Math.round((usage / total) * 1000.0) / 10.0 : 0.0;
            Map<String, Object> item = new HashMap<>();
            item.put("zoneId", zone.getId());
            item.put("zoneName", zone.getName());
            item.put("usage", Math.round(usage * 10.0) / 10.0);
            item.put("percentage", percentage);
            result.add(item);
        }

        return result;
    }
}
