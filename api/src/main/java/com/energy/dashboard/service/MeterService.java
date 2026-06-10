package com.energy.dashboard.service;

import com.energy.dashboard.common.PageResult;
import com.energy.dashboard.entity.Meter;

import java.util.Map;

public interface MeterService {

    PageResult<Map<String, Object>> getList(Map<String, Object> params);

    Map<String, Object> getById(Long id);

    Meter create(Meter meter);

    Meter update(Long id, Meter meter);
}
