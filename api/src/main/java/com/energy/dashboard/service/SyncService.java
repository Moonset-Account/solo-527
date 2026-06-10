package com.energy.dashboard.service;

import com.energy.dashboard.common.PageResult;
import com.energy.dashboard.entity.SyncTask;

import java.util.Map;

public interface SyncService {

    PageResult<SyncTask> getTasks(Map<String, Object> params);

    SyncTask getTaskById(Long id);

    SyncTask retry(Long id);
}
