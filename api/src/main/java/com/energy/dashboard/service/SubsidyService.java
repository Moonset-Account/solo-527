package com.energy.dashboard.service;

import com.energy.dashboard.common.PageResult;
import com.energy.dashboard.entity.Subsidy;

import java.util.Map;

public interface SubsidyService {

    PageResult<Map<String, Object>> getList(Map<String, Object> params);

    Map<String, Object> getById(Long id);

    Subsidy create(Subsidy subsidy);

    Map<String, Object> approve(Long id, Map<String, Object> data);
}
