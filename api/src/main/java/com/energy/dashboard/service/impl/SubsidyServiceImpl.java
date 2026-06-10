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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class SubsidyServiceImpl implements SubsidyService {

    @Autowired
    private SubsidyMapper subsidyMapper;

    private int toInt(Object val, int def) {
        if (val == null) return def;
        if (val instanceof Number) return ((Number) val).intValue();
        if (val instanceof String) {
            try { return Integer.parseInt((String) val); } catch (Exception e) { return def; }
        }
        return def;
    }

    private Map<String, Object> enrich(Subsidy s) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", s.getId());
        map.put("type", s.getType());
        map.put("amount", s.getAmount());
        map.put("sourceDocumentNo", s.getSourceDocumentNo());
        map.put("sourceDocumentUrl", s.getSourceDocumentNo() != null ? "/documents/" + s.getSourceDocumentNo() + ".pdf" : "");
        map.put("remark", s.getRemark());
        map.put("createdBy", s.getCreatedBy());
        map.put("createdAt", s.getCreatedAt());
        map.put("approvedBy", s.getApprovedBy());
        map.put("approvedAt", s.getApprovedAt());
        map.put("status", s.getStatus());
        return map;
    }

    @Override
    public PageResult<Map<String, Object>> getList(Map<String, Object> params) {
        int page = toInt(params.get("page"), 1);
        int pageSize = toInt(params.get("pageSize"), 10);

        QueryWrapper<Subsidy> wrapper = new QueryWrapper<>();
        if (params.containsKey("status")) {
            wrapper.eq("status", params.get("status"));
        }
        if (params.containsKey("type") && params.get("type") != null && !params.get("type").toString().trim().isEmpty()) {
            wrapper.like("type", params.get("type").toString().trim());
        }
        wrapper.orderByDesc("created_at");

        Page<Subsidy> result = subsidyMapper.selectPage(new Page<>(page, pageSize), wrapper);
        List<Map<String, Object>> enriched = new ArrayList<>();
        for (Subsidy s : result.getRecords()) {
            enriched.add(enrich(s));
        }
        return new PageResult<>(result.getTotal(), enriched);
    }

    @Override
    public Map<String, Object> getById(Long id) {
        Subsidy s = subsidyMapper.selectById(id);
        if (s == null) return null;
        return enrich(s);
    }

    @Override
    public Subsidy create(Subsidy subsidy) {
        subsidy.setCreatedAt(LocalDateTime.now());
        if (subsidy.getStatus() == null || subsidy.getStatus().isEmpty()) {
            subsidy.setStatus("pending");
        }
        subsidyMapper.insert(subsidy);
        return subsidy;
    }

    @Override
    public Map<String, Object> approve(Long id, Map<String, Object> data) {
        Subsidy s = subsidyMapper.selectById(id);
        Boolean approved = data.containsKey("approved") ? (Boolean) data.get("approved") : true;
        s.setStatus(approved ? "approved" : "rejected");
        s.setApprovedAt(LocalDateTime.now());
        if (data.containsKey("approvedBy")) {
            s.setApprovedBy((String) data.get("approvedBy"));
        }
        if (data.containsKey("remark")) {
            s.setRemark((String) data.get("remark"));
        }
        subsidyMapper.updateById(s);
        return enrich(subsidyMapper.selectById(id));
    }
}
