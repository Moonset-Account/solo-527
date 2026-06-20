package com.property.workorder.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.property.workorder.common.PageResult;
import com.property.workorder.entity.ContractRisk;
import com.property.workorder.mapper.ContractRiskMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ContractRiskService {

    private final ContractRiskMapper riskMapper;

    public PageResult<ContractRisk> queryRisks(String title, String riskType, String level,
                                                 String status, Long personInCharge,
                                                 Integer current, Integer size) {
        Page<ContractRisk> page = new Page<>(current, size);
        LambdaQueryWrapper<ContractRisk> wrapper = new LambdaQueryWrapper<>();
        if (title != null && !title.isEmpty()) {
            wrapper.like(ContractRisk::getTitle, title);
        }
        if (riskType != null && !riskType.isEmpty()) {
            wrapper.eq(ContractRisk::getRiskType, riskType);
        }
        if (level != null && !level.isEmpty()) {
            wrapper.eq(ContractRisk::getLevel, level);
        }
        if (status != null && !status.isEmpty()) {
            wrapper.eq(ContractRisk::getStatus, status);
        }
        if (personInCharge != null) {
            wrapper.eq(ContractRisk::getPersonInCharge, personInCharge);
        }
        wrapper.orderByDesc(ContractRisk::getCreatedAt);
        return PageResult.of(riskMapper.selectPage(page, wrapper));
    }

    public ContractRisk getRiskDetail(Long id) {
        return riskMapper.selectById(id);
    }

    @Transactional(rollbackFor = Exception.class)
    public ContractRisk createRisk(ContractRisk risk) {
        risk.setRiskNo("CR" + System.currentTimeMillis());
        if (risk.getLevel() == null) {
            risk.setLevel("MEDIUM");
        }
        if (risk.getStatus() == null) {
            risk.setStatus("OPEN");
        }
        if (risk.getDiscoveredAt() == null) {
            risk.setDiscoveredAt(LocalDateTime.now());
        }
        riskMapper.insert(risk);
        return risk;
    }

    @Transactional(rollbackFor = Exception.class)
    public ContractRisk updateRiskStatus(Long id, String status, String mitigationMeasures) {
        ContractRisk risk = riskMapper.selectById(id);
        if (risk == null) {
            throw new RuntimeException("风险记录不存在");
        }
        risk.setStatus(status);
        if (mitigationMeasures != null) {
            risk.setMitigationMeasures(mitigationMeasures);
        }
        if ("CLOSED".equals(status) || "MITIGATED".equals(status)) {
            risk.setActualCloseDate(LocalDate.now());
        }
        riskMapper.updateById(risk);
        return risk;
    }
}
