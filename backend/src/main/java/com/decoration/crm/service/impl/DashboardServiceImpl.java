package com.decoration.crm.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.decoration.crm.entity.FunnelStage;
import com.decoration.crm.entity.LeadCustomer;
import com.decoration.crm.mapper.FunnelStageMapper;
import com.decoration.crm.mapper.LeadCustomerMapper;
import com.decoration.crm.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardServiceImpl implements DashboardService {

    @Autowired
    private FunnelStageMapper funnelStageMapper;

    @Autowired
    private LeadCustomerMapper leadCustomerMapper;

    @Override
    public List<FunnelStage> getFunnelStages() {
        LambdaQueryWrapper<FunnelStage> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByAsc(FunnelStage::getSortOrder);
        return funnelStageMapper.selectList(wrapper);
    }

    @Override
    public List<Map<String, Object>> getFunnelData() {
        List<FunnelStage> stages = getFunnelStages();
        List<Map<String, Object>> data = new ArrayList<>();

        for (FunnelStage stage : stages) {
            LambdaQueryWrapper<LeadCustomer> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(LeadCustomer::getStatus, stage.getCode());
            Long count = leadCustomerMapper.selectCount(wrapper);

            Map<String, Object> item = new HashMap<>();
            item.put("stageId", stage.getId());
            item.put("stageName", stage.getName());
            item.put("stageCode", stage.getCode());
            item.put("count", count);
            item.put("color", stage.getColor());
            data.add(item);
        }

        return data;
    }

    @Override
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();

        LambdaQueryWrapper<LeadCustomer> totalWrapper = new LambdaQueryWrapper<>();
        Long totalLeads = leadCustomerMapper.selectCount(totalWrapper);
        stats.put("totalLeads", totalLeads);

        LambdaQueryWrapper<LeadCustomer> newWrapper = new LambdaQueryWrapper<>();
        newWrapper.eq(LeadCustomer::getStatus, "NEW");
        Long newLeads = leadCustomerMapper.selectCount(newWrapper);
        stats.put("newLeads", newLeads);

        LambdaQueryWrapper<LeadCustomer> dealWrapper = new LambdaQueryWrapper<>();
        dealWrapper.eq(LeadCustomer::getStatus, "DEAL");
        Long dealLeads = leadCustomerMapper.selectCount(dealWrapper);
        stats.put("dealLeads", dealLeads);

        LambdaQueryWrapper<LeadCustomer> lostWrapper = new LambdaQueryWrapper<>();
        lostWrapper.eq(LeadCustomer::getStatus, "LOST");
        Long lostLeads = leadCustomerMapper.selectCount(lostWrapper);
        stats.put("lostLeads", lostLeads);

        LambdaQueryWrapper<LeadCustomer> seaWrapper = new LambdaQueryWrapper<>();
        seaWrapper.eq(LeadCustomer::getPublicSeaStatus, "IN_SEA");
        Long publicSeaLeads = leadCustomerMapper.selectCount(seaWrapper);
        stats.put("publicSeaLeads", publicSeaLeads);

        double conversionRate = totalLeads > 0 ? (dealLeads * 100.0 / totalLeads) : 0;
        stats.put("conversionRate", String.format("%.2f", conversionRate));

        return stats;
    }
}
