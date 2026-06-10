package com.energy.dashboard.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.energy.dashboard.common.PageResult;
import com.energy.dashboard.entity.Meter;
import com.energy.dashboard.entity.SyncRetryLog;
import com.energy.dashboard.entity.SyncTask;
import com.energy.dashboard.mapper.MeterMapper;
import com.energy.dashboard.mapper.SyncRetryLogMapper;
import com.energy.dashboard.mapper.SyncTaskMapper;
import com.energy.dashboard.service.SyncService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SyncServiceImpl implements SyncService {

    @Autowired
    private SyncTaskMapper syncTaskMapper;

    @Autowired
    private SyncRetryLogMapper syncRetryLogMapper;

    @Autowired
    private MeterMapper meterMapper;

    private int toInt(Object val, int def) {
        if (val == null) return def;
        if (val instanceof Number) return ((Number) val).intValue();
        if (val instanceof String) {
            try { return Integer.parseInt((String) val); } catch (Exception e) { return def; }
        }
        return def;
    }

    private List<Map<String, Object>> getRetryResultsForTask(Long taskId) {
        QueryWrapper<SyncRetryLog> wrapper = new QueryWrapper<>();
        wrapper.eq("sync_task_id", taskId);
        wrapper.orderByAsc("retry_at");
        List<SyncRetryLog> logs = syncRetryLogMapper.selectList(wrapper);
        List<Map<String, Object>> results = new ArrayList<>();
        for (SyncRetryLog log : logs) {
            Map<String, Object> item = new HashMap<>();
            item.put("retryAt", log.getRetryAt());
            item.put("success", log.getSuccess());
            item.put("message", log.getMessage());
            results.add(item);
        }
        return results;
    }

    private Map<String, Object> enrichTask(SyncTask task) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", task.getId());
        map.put("type", task.getType());
        map.put("meterId", task.getMeterId());
        map.put("status", task.getStatus());
        map.put("triggeredAt", task.getTriggeredAt());
        map.put("completedAt", task.getCompletedAt());
        map.put("duration", task.getDuration());
        map.put("failReason", task.getFailReason());
        map.put("friendlyFailReason", task.getFriendlyFailReason());
        map.put("failCategory", task.getFailCategory());
        map.put("retryCount", task.getRetryCount() != null ? task.getRetryCount() : 0);
        map.put("createdAt", task.getCreatedAt());

        String meterNo = "";
        if (task.getMeterId() != null) {
            Meter meter = meterMapper.selectById(task.getMeterId());
            if (meter != null && meter.getMeterNo() != null) {
                meterNo = meter.getMeterNo();
            }
        }
        map.put("meterNo", meterNo);
        map.put("retryResults", getRetryResultsForTask(task.getId()));
        return map;
    }

    @Override
    public PageResult<Map<String, Object>> getTasks(Map<String, Object> params) {
        int page = toInt(params.get("page"), 1);
        int pageSize = toInt(params.get("pageSize"), 10);

        QueryWrapper<SyncTask> wrapper = new QueryWrapper<>();
        if (params.containsKey("status")) {
            wrapper.eq("status", params.get("status"));
        }
        if (params.containsKey("type")) {
            wrapper.eq("type", params.get("type"));
        }
        if (params.containsKey("meterNo") && params.get("meterNo") != null && !params.get("meterNo").toString().trim().isEmpty()) {
            String meterNoFilter = params.get("meterNo").toString().trim();
            QueryWrapper<Meter> meterWrapper = new QueryWrapper<>();
            meterWrapper.like("meter_no", meterNoFilter);
            List<Meter> meters = meterMapper.selectList(meterWrapper);
            List<Long> meterIds = meters.stream().map(Meter::getId).collect(Collectors.toList());
            if (meterIds.isEmpty()) {
                return new PageResult<>(0, new ArrayList<>());
            }
            wrapper.in("meter_id", meterIds);
        }
        wrapper.orderByDesc("triggered_at");

        Page<SyncTask> result = syncTaskMapper.selectPage(new Page<>(page, pageSize), wrapper);
        List<Map<String, Object>> enrichedList = new ArrayList<>();
        for (SyncTask task : result.getRecords()) {
            enrichedList.add(enrichTask(task));
        }
        return new PageResult<>(result.getTotal(), enrichedList);
    }

    @Override
    public Map<String, Object> getTaskById(Long id) {
        SyncTask task = syncTaskMapper.selectById(id);
        if (task == null) return null;
        return enrichTask(task);
    }

    @Override
    public Map<String, Object> retry(Long id) {
        SyncTask task = syncTaskMapper.selectById(id);

        task.setStatus("running");
        task.setRetryCount(task.getRetryCount() != null ? task.getRetryCount() + 1 : 1);
        task.setFailReason(null);
        task.setFriendlyFailReason(null);
        task.setFailCategory(null);
        syncTaskMapper.updateById(task);

        SyncRetryLog retryLog = new SyncRetryLog();
        retryLog.setSyncTaskId(id);
        retryLog.setRetryAt(LocalDateTime.now());
        retryLog.setSuccess(true);
        retryLog.setMessage("retry triggered");
        syncRetryLogMapper.insert(retryLog);

        task.setStatus("success");
        task.setCompletedAt(LocalDateTime.now());
        task.setDuration(15);
        syncTaskMapper.updateById(task);

        SyncTask updated = syncTaskMapper.selectById(id);
        return enrichTask(updated);
    }
}
