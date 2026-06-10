package com.energy.dashboard.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.energy.dashboard.common.PageResult;
import com.energy.dashboard.entity.SyncRetryLog;
import com.energy.dashboard.entity.SyncTask;
import com.energy.dashboard.mapper.SyncRetryLogMapper;
import com.energy.dashboard.mapper.SyncTaskMapper;
import com.energy.dashboard.service.SyncService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class SyncServiceImpl implements SyncService {

    @Autowired
    private SyncTaskMapper syncTaskMapper;

    @Autowired
    private SyncRetryLogMapper syncRetryLogMapper;

    @Override
    public PageResult<SyncTask> getTasks(Map<String, Object> params) {
        int page = params.containsKey("page") ? (int) params.get("page") : 1;
        int pageSize = params.containsKey("pageSize") ? (int) params.get("pageSize") : 10;

        QueryWrapper<SyncTask> wrapper = new QueryWrapper<>();
        if (params.containsKey("status")) {
            wrapper.eq("status", params.get("status"));
        }
        if (params.containsKey("type")) {
            wrapper.eq("type", params.get("type"));
        }
        wrapper.orderByDesc("triggered_at");

        Page<SyncTask> result = syncTaskMapper.selectPage(new Page<>(page, pageSize), wrapper);
        return new PageResult<>(result.getTotal(), result.getRecords());
    }

    @Override
    public SyncTask getTaskById(Long id) {
        return syncTaskMapper.selectById(id);
    }

    @Override
    public SyncTask retry(Long id) {
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

        task.setStatus("completed");
        task.setCompletedAt(LocalDateTime.now());
        syncTaskMapper.updateById(task);

        return syncTaskMapper.selectById(id);
    }
}
