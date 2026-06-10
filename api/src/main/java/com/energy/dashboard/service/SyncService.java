package com.energy.dashboard.service;

import com.energy.dashboard.common.PageResult;

import java.util.Map;

public interface SyncService {

    PageResult<Map<String, Object>> getTasks(Map<String, Object> params);

    Map<String, Object> getTaskById(Long id);

    Map<String, Object> retry(Long id);
}
