package com.energy.dashboard.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.energy.dashboard.common.PageResult;
import com.energy.dashboard.entity.Subsidy;
import com.energy.dashboard.mapper.SubsidyMapper;
import com.energy.dashboard.service.SubsidyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class SubsidyServiceImpl implements SubsidyService {

    @Autowired
    private SubsidyMapper subsidyMapper;

    @Override
    public PageResult<Subsidy> getList(Map<String, Object> params) {
        int page = params.containsKey("page") ? (int) params.get("page") : 1;
        int pageSize = params.containsKey("pageSize") ? (int) params.get("pageSize") : 10;

        QueryWrapper<Subsidy> wrapper = new QueryWrapper<>();
        if (params.containsKey("status")) {
            wrapper.eq("status", params.get("status"));
        }
        if (params.containsKey("type")) {
            wrapper.eq("type", params.get("type"));
        }
        wrapper.orderByDesc("created_at");

        Page<Subsidy> result = subsidyMapper.selectPage(new Page<>(page, pageSize), wrapper);
        return new PageResult<>(result.getTotal(), result.getRecords());
    }

    @Override
    public Subsidy getById(Long id) {
        return subsidyMapper.selectById(id);
    }

    @Override
    public Subsidy create(Subsidy subsidy) {
        subsidy.setCreatedAt(LocalDateTime.now());
        subsidy.setStatus("pending");
        subsidyMapper.insert(subsidy);
        return subsidy;
    }

    @Override
    public Subsidy approve(Long id, Map<String, Object> data) {
        Subsidy subsidy = subsidyMapper.selectById(id);
        subsidy.setStatus("approved");
        subsidy.setApprovedAt(LocalDateTime.now());
        if (data.containsKey("approvedBy")) {
            subsidy.setApprovedBy((String) data.get("approvedBy"));
        }
        subsidyMapper.updateById(subsidy);
        return subsidy;
    }
}
