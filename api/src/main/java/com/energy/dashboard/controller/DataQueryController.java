package com.energy.dashboard.controller;

import com.energy.dashboard.common.Result;
import com.energy.dashboard.entity.EnergyData;
import com.energy.dashboard.mapper.EnergyDataMapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/data")
public class DataQueryController {

    @Autowired
    private EnergyDataMapper energyDataMapper;

    @PostMapping("/query")
    public Result<List<EnergyData>> query(@RequestBody Map<String, Object> params) {
        QueryWrapper<EnergyData> wrapper = new QueryWrapper<>();

        if (params.containsKey("meterId")) {
            wrapper.eq("meter_id", params.get("meterId"));
        }
        if (params.containsKey("dataType")) {
            wrapper.eq("data_type", params.get("dataType"));
        }
        if (params.containsKey("startTime")) {
            wrapper.ge("recorded_at", params.get("startTime"));
        }
        if (params.containsKey("endTime")) {
            wrapper.le("recorded_at", params.get("endTime"));
        }

        wrapper.orderByDesc("recorded_at");

        if (params.containsKey("limit")) {
            wrapper.last("LIMIT " + Integer.parseInt(params.get("limit").toString()));
        }

        return Result.success(energyDataMapper.selectList(wrapper));
    }

    @PostMapping("/export")
    public Result<List<EnergyData>> export(@RequestBody Map<String, Object> params) {
        QueryWrapper<EnergyData> wrapper = new QueryWrapper<>();

        if (params.containsKey("meterId")) {
            wrapper.eq("meter_id", params.get("meterId"));
        }
        if (params.containsKey("dataType")) {
            wrapper.eq("data_type", params.get("dataType"));
        }
        if (params.containsKey("startTime")) {
            wrapper.ge("recorded_at", params.get("startTime"));
        }
        if (params.containsKey("endTime")) {
            wrapper.le("recorded_at", params.get("endTime"));
        }

        wrapper.orderByAsc("recorded_at");

        return Result.success(energyDataMapper.selectList(wrapper));
    }
}
