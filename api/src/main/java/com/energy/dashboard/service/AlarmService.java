package com.energy.dashboard.service;

import com.energy.dashboard.common.PageResult;
import com.energy.dashboard.entity.Alarm;

import java.util.Map;

public interface AlarmService {

    PageResult<Alarm> getList(Map<String, Object> params);

    Alarm getById(Long id);

    Alarm confirm(Long id);

    Alarm resolve(Long id, Map<String, Object> data);

    Map<String, Object> getReview(String month);
}
