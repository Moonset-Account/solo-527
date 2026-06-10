package com.energy.dashboard.service;

import com.energy.dashboard.common.PageResult;
import com.energy.dashboard.entity.Alarm;

import java.util.Map;

public interface AlarmService {

    PageResult<Map<String, Object>> getList(Map<String, Object> params);

    Map<String, Object> getById(Long id);

    Alarm confirm(Long id);

    Alarm resolve(Long id, Map<String, Object> data);

    Map<String, Object> getReview(String month);
}
