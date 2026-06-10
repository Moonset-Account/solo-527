package com.energy.dashboard.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.energy.dashboard.common.PageResult;
import com.energy.dashboard.entity.Meter;
import com.energy.dashboard.mapper.MeterMapper;
import com.energy.dashboard.service.MeterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class MeterServiceImpl implements MeterService {

    @Autowired
    private MeterMapper meterMapper;

    @Override
    public PageResult<Meter> getList(Map<String, Object> params) {
        int page = params.containsKey("page") ? (int) params.get("page") : 1;
        int pageSize = params.containsKey("pageSize") ? (int) params.get("pageSize") : 10;

        QueryWrapper<Meter> wrapper = new QueryWrapper<>();
        if (params.containsKey("zoneId")) {
            wrapper.eq("zone_id", params.get("zoneId"));
        }
        if (params.containsKey("status")) {
            wrapper.eq("status", params.get("status"));
        }
        if (params.containsKey("keyword")) {
            wrapper.like("meter_no", params.get("keyword"));
        }

        Page<Meter> result = meterMapper.selectPage(new Page<>(page, pageSize), wrapper);
        return new PageResult<>(result.getTotal(), result.getRecords());
    }

    @Override
    public Meter getById(Long id) {
        return meterMapper.selectById(id);
    }

    @Override
    public Meter create(Meter meter) {
        meter.setCreatedAt(LocalDateTime.now());
        meter.setUpdatedAt(LocalDateTime.now());
        meterMapper.insert(meter);
        return meter;
    }

    @Override
    public Meter update(Long id, Meter meter) {
        meter.setId(id);
        meter.setUpdatedAt(LocalDateTime.now());
        meterMapper.updateById(meter);
        return meterMapper.selectById(id);
    }
}
