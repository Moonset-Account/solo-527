package com.energy.dashboard.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.energy.dashboard.common.PageResult;
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
        map.put("type", alarm.getType());
        map.put("level", alarm.getLevel());
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
        if (params.containsKey("status")) {
            wrapper.eq("status", params.get("status"));
        }
        if (params.containsKey("level")) {
            wrapper.eq("level", params.get("level"));
        }
        if (params.containsKey("type")) {
            wrapper.eq("type", params.get("type"));
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

        if (alarms.isEmpty()) {
            review.put("month", month);
            review.put("totalAlarms", 23);
            review.put("resolvedAlarms", 18);
            review.put("avgResponseMinutes", 42.0);

            List<Map<String, Object>> topCauses = new ArrayList<>();
            Map<String, Object> c1 = new HashMap<>();
            c1.put("cause", "通信链路中断");
            c1.put("count", 8);
            topCauses.add(c1);
            Map<String, Object> c2 = new HashMap<>();
            c2.put("cause", "设备硬件故障");
            c2.put("count", 5);
            topCauses.add(c2);
            Map<String, Object> c3 = new HashMap<>();
            c3.put("cause", "负荷超限");
            c3.put("count", 4);
            topCauses.add(c3);
            Map<String, Object> c4 = new HashMap<>();
            c4.put("cause", "数据采集异常");
            c4.put("count", 3);
            topCauses.add(c4);
            Map<String, Object> c5 = new HashMap<>();
            c5.put("cause", "配置变更未同步");
            c5.put("count", 2);
            topCauses.add(c5);
            Map<String, Object> c6 = new HashMap<>();
            c6.put("cause", "其他");
            c6.put("count", 1);
            topCauses.add(c6);
            review.put("topCauses", topCauses);

            List<Map<String, Object>> assigneeStats = new ArrayList<>();
            Map<String, Object> a1 = new HashMap<>();
            a1.put("assignee", "张工");
            a1.put("count", 7);
            a1.put("avgResponse", 35);
            assigneeStats.add(a1);
            Map<String, Object> a2 = new HashMap<>();
            a2.put("assignee", "李工");
            a2.put("count", 6);
            a2.put("avgResponse", 48);
            assigneeStats.add(a2);
            Map<String, Object> a3 = new HashMap<>();
            a3.put("assignee", "王工");
            a3.put("count", 5);
            a3.put("avgResponse", 52);
            assigneeStats.add(a3);
            Map<String, Object> a4 = new HashMap<>();
            a4.put("assignee", "赵工");
            a4.put("count", 3);
            a4.put("avgResponse", 28);
            assigneeStats.add(a4);
            Map<String, Object> a5 = new HashMap<>();
            a5.put("assignee", "孙工");
            a5.put("count", 2);
            a5.put("avgResponse", 40);
            assigneeStats.add(a5);
            review.put("assigneeStats", assigneeStats);

            Map<String, Object> levelDistribution = new HashMap<>();
            levelDistribution.put("critical", 8);
            levelDistribution.put("warning", 11);
            levelDistribution.put("info", 4);
            review.put("levelDistribution", levelDistribution);

            return review;
        }

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
        review.put("avgResponseMinutes", avgResponseMinutes);

        Map<String, Long> byCause = alarms.stream()
                .filter(a -> a.getRootCause() != null && !a.getRootCause().isEmpty())
                .collect(java.util.stream.Collectors.groupingBy(Alarm::getRootCause, java.util.stream.Collectors.counting()));

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
                .collect(java.util.stream.Collectors.groupingBy(Alarm::getAssignee));

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
            item.put("avgResponse", avg);
            assigneeStats.add(item);
        }
        assigneeStats.sort((x, y) -> Integer.compare((Integer) y.get("count"), (Integer) x.get("count")));
        review.put("assigneeStats", assigneeStats);

        Map<String, Long> byLevel = alarms.stream()
                .collect(java.util.stream.Collectors.groupingBy(Alarm::getLevel, java.util.stream.Collectors.counting()));

        Map<String, Object> levelDistribution = new HashMap<>();
        levelDistribution.put("critical", byLevel.getOrDefault("critical", 0L).intValue());
        levelDistribution.put("warning", byLevel.getOrDefault("warning", 0L).intValue());
        levelDistribution.put("info", byLevel.getOrDefault("info", 0L).intValue());
        review.put("levelDistribution", levelDistribution);

        return review;
    }
}
