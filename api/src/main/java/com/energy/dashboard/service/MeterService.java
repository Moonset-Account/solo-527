package com.energy.dashboard.service;

import com.energy.dashboard.common.PageResult;
import com.energy.dashboard.entity.Meter;

import java.util.Map;

public interface MeterService {

    PageResult<Meter> getList(Map<String, Object> params);

    Meter getById(Long id);

    Meter create(Meter meter);

    Meter update(Long id, Meter meter);
}
