package com.energy.dashboard.service;

import com.energy.dashboard.common.PageResult;
import com.energy.dashboard.entity.Subsidy;

import java.util.Map;

public interface SubsidyService {

    PageResult<Subsidy> getList(Map<String, Object> params);

    Subsidy getById(Long id);

    Subsidy create(Subsidy subsidy);

    Subsidy approve(Long id, Map<String, Object> data);
}
