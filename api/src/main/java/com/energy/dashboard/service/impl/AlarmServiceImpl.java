package com.energy.dashboard.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.energy.dashboard.common.PageResult;
import com.energy.dashboard.entity.Alarm;
import com.energy.dashboard.mapper.AlarmMapper;
import com.energy.dashboard.service.AlarmService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AlarmServiceImpl implements AlarmService {

    @Autowired
    private AlarmMapper alarmMapper;

    @Override
    public PageResult<Alarm> getList(Map<String, Object> params) {
        int page = params.containsKey("page") ? (int) params.get("page") : 1;
        int pageSize = params.containsKey("pageSize") ? (int) params.get("pageSize") : 10;

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
        wrapper.orderByDesc("occurred_at");

        Page<Alarm> result = alarmMapper.selectPage(new Page<>(page, pageSize), wrapper);
        return new PageResult<>(result.getTotal(), result.getRecords());
    }

    @Override
    public Alarm getById(Long id) {
        return alarmMapper.selectById(id);
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
        return alarm;
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
        return alarm;
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
        long pendingCount = alarms.stream().filter(a -> "pending".equals(a.getStatus())).count();
        long confirmedCount = alarms.stream().filter(a -> "confirmed".equals(a.getStatus())).count();
        long resolvedCount = alarms.stream().filter(a -> "resolved".equals(a.getStatus())).count();

        double avgResponseMinutes = alarms.stream()
                .filter(a -> a.getResponseDuration() != null)
                .mapToLong(Alarm::getResponseDuration)
                .average()
                .orElse(0.0);

        Map<String, Long> byLevel = alarms.stream()
                .collect(java.util.stream.Collectors.groupingBy(Alarm::getLevel, java.util.stream.Collectors.counting()));

        Map<String, Long> byType = alarms.stream()
                .collect(java.util.stream.Collectors.groupingBy(Alarm::getType, java.util.stream.Collectors.counting()));

        review.put("totalCount", totalCount);
        review.put("pendingCount", pendingCount);
        review.put("confirmedCount", confirmedCount);
        review.put("resolvedCount", resolvedCount);
        review.put("avgResponseMinutes", avgResponseMinutes);
        review.put("byLevel", byLevel);
        review.put("byType", byType);

        return review;
    }
}
