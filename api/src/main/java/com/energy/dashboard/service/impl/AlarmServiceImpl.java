package com.energy.dashboard.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.energy.dashboard.common.PageResult;
import com.energy.dashboard.config.EnumMapping;
import com.energy.dashboard.entity.Alarm;
import com.energy.dashboard.entity.Meter;
import com.energy.dashboard.entity.Zone;
import com.energy.dashboard.mapper.AlarmMapper;
import com.energy.dashboard.mapper.MeterMapper;
import com.energy.dashboard.mapper.ZoneMapper;
import com.energy.dashboard.service.AlarmService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AlarmServiceImpl implements AlarmService {

    @Autowired
    private AlarmMapper alarmMapper;

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

    private Map<String, Object> enrichAlarm(Alarm alarm) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", alarm.getId());
        map.put("type", EnumMapping.mapAlarmType(alarm.getType()));
        map.put("level", EnumMapping.mapAlarmLevel(alarm.getLevel()));
        map.put("meterId", alarm.getMeterId());
        map.put("message", alarm.getMessage());
        map.put("status", alarm.getStatus());
        map.put("assignee", alarm.getAssignee());
        map.put("occurredAt", alarm.getOccurredAt());
        map.put("confirmedAt", alarm.getConfirmedAt());
        map.put("resolvedAt", alarm.getResolvedAt());
        map.put("responseDuration", alarm.getResponseDuration());
        map.put("rootCause", alarm.getRootCause());
        map.put("sourceDocumentNo", alarm.getSourceDocumentNo());
        map.put("remark", alarm.getRemark());
        map.put("createdAt", alarm.getCreatedAt());

        String meterNo = "";
        String zoneName = "";
        if (alarm.getMeterId() != null) {
            Meter meter = meterMapper.selectById(alarm.getMeterId());
            if (meter != null) {
                meterNo = meter.getMeterNo() != null ? meter.getMeterNo() : "";
                if (meter.getZoneId() != null) {
                    Zone zone = zoneMapper.selectById(meter.getZoneId());
                    if (zone != null) {
                        zoneName = zone.getName() != null ? zone.getName() : "";
                    }
                }
            }
        }
        map.put("meterNo", meterNo);
        map.put("zoneName", zoneName);
        return map;
    }

    @Override
    public PageResult<Map<String, Object>> getList(Map<String, Object> params) {
        int page = toInt(params.get("page"), 1);
        int pageSize = toInt(params.get("pageSize"), 10);

        QueryWrapper<Alarm> wrapper = new QueryWrapper<>();
        if (params.containsKey("status") && params.get("status") != null && !params.get("status").toString().isEmpty()) {
            wrapper.eq("status", params.get("status"));
        }
        if (params.containsKey("level") && params.get("level") != null && !params.get("level").toString().isEmpty()) {
            String dbLevel = EnumMapping.reverseAlarmLevel(params.get("level").toString());
            if (dbLevel != null) {
                wrapper.eq("level", dbLevel);
            }
        }
        if (params.containsKey("type") && params.get("type") != null && !params.get("type").toString().isEmpty()) {
            String dbType = EnumMapping.reverseAlarmType(params.get("type").toString());
            if (dbType != null) {
                wrapper.eq("type", dbType);
            }
        }
        if (params.containsKey("startTime") && params.get("startTime") != null) {
            wrapper.ge("occurred_at", params.get("startTime"));
        }
        if (params.containsKey("endTime") && params.get("endTime") != null) {
            wrapper.le("occurred_at", params.get("endTime"));
        }
        wrapper.orderByDesc("occurred_at");

        Page<Alarm> result = alarmMapper.selectPage(new Page<>(page, pageSize), wrapper);
        List<Map<String, Object>> enrichedList = new ArrayList<>();
        for (Alarm alarm : result.getRecords()) {
            enrichedList.add(enrichAlarm(alarm));
        }
        return new PageResult<>(result.getTotal(), enrichedList);
    }

    @Override
    public Map<String, Object> getById(Long id) {
        Alarm alarm = alarmMapper.selectById(id);
        if (alarm == null) return null;
        return enrichAlarm(alarm);
    }

    @Override
    public Alarm confirm(Long id) {
        Alarm alarm = alarmMapper.selectById(id);
        alarm.setStatus("confirmed");
        alarm.setConfirmedAt(LocalDateTime.now());
        if (alarm.getOccurredAt() != null) {
            alarm.setResponseDuration(
                    java.time.Duration.between(alarm.getOccurredAt(), alarm.getConfirmedAt()).toMinutes()
            );
        }
        alarm.setUpdatedAt(LocalDateTime.now());
        alarmMapper.updateById(alarm);
        return alarmMapper.selectById(id);
    }

    @Override
    public Alarm resolve(Long id, Map<String, Object> data) {
        Alarm alarm = alarmMapper.selectById(id);
        alarm.setStatus("resolved");
        alarm.setResolvedAt(LocalDateTime.now());
        if (data.containsKey("rootCause")) {
            alarm.setRootCause((String) data.get("rootCause"));
        }
        if (data.containsKey("remark")) {
            alarm.setRemark((String) data.get("remark"));
        }
        alarm.setUpdatedAt(LocalDateTime.now());
        alarmMapper.updateById(alarm);
        return alarmMapper.selectById(id);
    }

    @Override
    public Map<String, Object> getReview(String month) {
        Map<String, Object> review = new HashMap<>();

        YearMonth yearMonth = YearMonth.parse(month, DateTimeFormatter.ofPattern("yyyy-MM"));
        LocalDateTime start = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime end = yearMonth.plusMonths(1).atDay(1).atStartOfDay();

        QueryWrapper<Alarm> wrapper = new QueryWrapper<>();
        wrapper.ge("occurred_at", start).lt("occurred_at", end);
        List<Alarm> alarms = alarmMapper.selectList(wrapper);

        long totalCount = alarms.size();
        long resolvedCount = alarms.stream().filter(a -> "resolved".equals(a.getStatus())).count();

        double avgResponseMinutes = alarms.stream()
                .filter(a -> a.getResponseDuration() != null)
                .mapToLong(Alarm::getResponseDuration)
                .average()
                .orElse(0.0);

        review.put("month", month);
        review.put("totalAlarms", (int) totalCount);
        review.put("resolvedAlarms", (int) resolvedCount);
        review.put("avgResponseMinutes", Math.round(avgResponseMinutes * 10.0) / 10.0);

        Map<String, Long> byCause = alarms.stream()
                .filter(a -> a.getRootCause() != null && !a.getRootCause().isEmpty())
                .collect(Collectors.groupingBy(Alarm::getRootCause, Collectors.counting()));

        List<Map<String, Object>> topCauses = new ArrayList<>();
        for (Map.Entry<String, Long> entry : byCause.entrySet()) {
            Map<String, Object> item = new HashMap<>();
            item.put("cause", entry.getKey());
            item.put("count", entry.getValue().intValue());
            topCauses.add(item);
        }
        topCauses.sort((x, y) -> Integer.compare((Integer) y.get("count"), (Integer) x.get("count")));
        review.put("topCauses", topCauses);

        Map<String, List<Alarm>> byAssignee = alarms.stream()
                .filter(a -> a.getAssignee() != null && !a.getAssignee().isEmpty())
                .collect(Collectors.groupingBy(Alarm::getAssignee));

        List<Map<String, Object>> assigneeStats = new ArrayList<>();
        for (Map.Entry<String, List<Alarm>> entry : byAssignee.entrySet()) {
            Map<String, Object> item = new HashMap<>();
            item.put("assignee", entry.getKey());
            item.put("count", entry.getValue().size());
            double avg = entry.getValue().stream()
                    .filter(a -> a.getResponseDuration() != null)
                    .mapToLong(Alarm::getResponseDuration)
                    .average()
                    .orElse(0.0);
            item.put("avgResponse", Math.round(avg * 10.0) / 10.0);
            assigneeStats.add(item);
        }
        assigneeStats.sort((x, y) -> Integer.compare((Integer) y.get("count"), (Integer) x.get("count")));
        review.put("assigneeStats", assigneeStats);

        Map<String, Long> byLevel = alarms.stream()
                .collect(Collectors.groupingBy(Alarm::getLevel, Collectors.counting()));

        Map<String, Object> levelDistribution = new HashMap<>();
        levelDistribution.put("critical", byLevel.getOrDefault("high", 0L).intValue());
        levelDistribution.put("warning", byLevel.getOrDefault("medium", 0L).intValue());
        levelDistribution.put("info", byLevel.getOrDefault("low", 0L).intValue());
        review.put("levelDistribution", levelDistribution);

        return review;
    }
}
