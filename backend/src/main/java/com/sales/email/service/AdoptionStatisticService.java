package com.sales.email.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sales.email.dto.AdoptionStatQueryDTO;
import com.sales.email.dto.EmailReviewDTO;
import com.sales.email.entity.AdoptionStatistic;
import com.sales.email.entity.EmailDraft;
import com.sales.email.mapper.AdoptionStatisticMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdoptionStatisticService {

    private final AdoptionStatisticMapper statisticMapper;

    public void recordAiGenerated(EmailDraft draft) {
        try {
            LocalDate today = LocalDate.now();
            List<String> riskReasons = parseRiskReasons(draft.getRiskHitReasons());
            if (riskReasons.isEmpty()) {
                riskReasons.add("无风险命中");
            }
            for (String reason : riskReasons) {
                incrementGenerated(today, draft.getSupervisorId(), draft.getSupervisorName(),
                        draft.getAgentId(), draft.getAgentName(), reason);
            }
        } catch (Exception e) {
            log.error("记录AI生成统计失败", e);
        }
    }

    private void incrementGenerated(LocalDate statDate, Long supervisorId, String supervisorName,
                                     Long agentId, String agentName, String riskReason) {
        LambdaQueryWrapper<AdoptionStatistic> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AdoptionStatistic::getStatDate, statDate);
        wrapper.eq(supervisorId != null, AdoptionStatistic::getSupervisorId, supervisorId);
        wrapper.eq(agentId != null, AdoptionStatistic::getAgentId, agentId);
        wrapper.eq(AdoptionStatistic::getRiskHitReason, riskReason);
        AdoptionStatistic stat = statisticMapper.selectOne(wrapper);

        if (stat == null) {
            stat = new AdoptionStatistic();
            stat.setStatDate(statDate);
            stat.setSupervisorId(supervisorId);
            stat.setSupervisorName(supervisorName);
            stat.setAgentId(agentId);
            stat.setAgentName(agentName);
            stat.setRiskHitReason(riskReason);
            stat.setTotalGenerated(1);
            stat.setAdoptedCount(0);
            stat.setPartialAdoptedCount(0);
            stat.setRejectedCount(0);
            stat.setAdoptionRate(BigDecimal.ZERO);
            statisticMapper.insert(stat);
        } else {
            stat.setTotalGenerated(stat.getTotalGenerated() + 1);
            recalculateRate(stat);
            statisticMapper.updateById(stat);
        }
    }

    public void recordAdoption(EmailDraft draft, EmailReviewDTO reviewDTO) {
        try {
            LocalDate today = LocalDate.now();
            List<String> riskReasons = parseRiskReasons(draft.getRiskHitReasons());

            if (riskReasons.isEmpty()) {
                riskReasons.add("无风险命中");
            }

            for (String reason : riskReasons) {
                updateStatistic(today, draft.getSupervisorId(), draft.getSupervisorName(),
                        draft.getAgentId(), draft.getAgentName(), reason, reviewDTO.getReviewResult());
            }
        } catch (Exception e) {
            log.error("记录采纳率统计失败", e);
        }
    }

    private void updateStatistic(LocalDate statDate, Long supervisorId, String supervisorName,
                                  Long agentId, String agentName, String riskReason, String reviewResult) {
        LambdaQueryWrapper<AdoptionStatistic> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AdoptionStatistic::getStatDate, statDate);
        wrapper.eq(supervisorId != null, AdoptionStatistic::getSupervisorId, supervisorId);
        wrapper.eq(agentId != null, AdoptionStatistic::getAgentId, agentId);
        wrapper.eq(AdoptionStatistic::getRiskHitReason, riskReason);
        AdoptionStatistic stat = statisticMapper.selectOne(wrapper);

        if (stat == null) {
            stat = new AdoptionStatistic();
            stat.setStatDate(statDate);
            stat.setSupervisorId(supervisorId);
            stat.setSupervisorName(supervisorName);
            stat.setAgentId(agentId);
            stat.setAgentName(agentName);
            stat.setRiskHitReason(riskReason);
            stat.setTotalGenerated(1);
            stat.setAdoptedCount("PASS".equals(reviewResult) ? 1 : 0);
            stat.setPartialAdoptedCount("MODIFY".equals(reviewResult) ? 1 : 0);
            stat.setRejectedCount("REJECT".equals(reviewResult) ? 1 : 0);
        } else {
            if ("PASS".equals(reviewResult)) {
                stat.setAdoptedCount(stat.getAdoptedCount() + 1);
            } else if ("MODIFY".equals(reviewResult)) {
                stat.setPartialAdoptedCount(stat.getPartialAdoptedCount() + 1);
            } else if ("REJECT".equals(reviewResult)) {
                stat.setRejectedCount(stat.getRejectedCount() + 1);
            }
        }

        recalculateRate(stat);

        if (stat.getId() == null) {
            statisticMapper.insert(stat);
        } else {
            statisticMapper.updateById(stat);
        }
    }

    private void recalculateRate(AdoptionStatistic stat) {
        int total = stat.getTotalGenerated();
        int adopted = stat.getAdoptedCount();
        if (total > 0) {
            BigDecimal rate = new BigDecimal(adopted)
                    .divide(new BigDecimal(total), 4, RoundingMode.HALF_UP);
            stat.setAdoptionRate(rate);
        } else {
            stat.setAdoptionRate(BigDecimal.ZERO);
        }
    }

    public List<AdoptionStatistic> queryStatistics(AdoptionStatQueryDTO query) {
        LambdaQueryWrapper<AdoptionStatistic> wrapper = new LambdaQueryWrapper<>();

        if (query.getStartDate() != null) {
            wrapper.ge(AdoptionStatistic::getStatDate, query.getStartDate());
        }
        if (query.getEndDate() != null) {
            wrapper.le(AdoptionStatistic::getStatDate, query.getEndDate());
        }
        if (query.getSupervisorId() != null) {
            wrapper.eq(AdoptionStatistic::getSupervisorId, query.getSupervisorId());
        }
        if (query.getAgentId() != null) {
            wrapper.eq(AdoptionStatistic::getAgentId, query.getAgentId());
        }
        if (query.getRiskHitReason() != null && !query.getRiskHitReason().isEmpty()) {
            wrapper.like(AdoptionStatistic::getRiskHitReason, query.getRiskHitReason());
        }
        wrapper.orderByDesc(AdoptionStatistic::getStatDate);

        List<AdoptionStatistic> records = statisticMapper.selectList(wrapper);

        if (query.getGroupBy() != null) {
            return aggregateStatistics(records, query.getGroupBy());
        }

        return records;
    }

    public Map<String, Object> getSummaryStatistics(AdoptionStatQueryDTO query) {
        List<AdoptionStatistic> records = queryStatistics(query);

        int totalGenerated = 0;
        int adoptedCount = 0;
        int partialAdopted = 0;
        int rejectedCount = 0;

        for (AdoptionStatistic stat : records) {
            totalGenerated += stat.getTotalGenerated();
            adoptedCount += stat.getAdoptedCount();
            partialAdopted += stat.getPartialAdoptedCount();
            rejectedCount += stat.getRejectedCount();
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalGenerated", totalGenerated);
        result.put("adoptedCount", adoptedCount);
        result.put("partialAdoptedCount", partialAdopted);
        result.put("rejectedCount", rejectedCount);

        BigDecimal adoptionRate = BigDecimal.ZERO;
        if (totalGenerated > 0) {
            adoptionRate = new BigDecimal(adoptedCount)
                    .divide(new BigDecimal(totalGenerated), 4, RoundingMode.HALF_UP);
        }
        result.put("adoptionRate", adoptionRate);
        result.put("partialAdoptionRate", totalGenerated > 0 ?
                new BigDecimal(partialAdopted).divide(new BigDecimal(totalGenerated), 4, RoundingMode.HALF_UP) : BigDecimal.ZERO);
        result.put("rejectionRate", totalGenerated > 0 ?
                new BigDecimal(rejectedCount).divide(new BigDecimal(totalGenerated), 4, RoundingMode.HALF_UP) : BigDecimal.ZERO);

        return result;
    }

    private List<AdoptionStatistic> aggregateStatistics(List<AdoptionStatistic> records, String groupBy) {
        Map<String, AdoptionStatistic> grouped = new HashMap<>();

        for (AdoptionStatistic stat : records) {
            String key = buildGroupKey(stat, groupBy);
            AdoptionStatistic existing = grouped.get(key);
            if (existing == null) {
                existing = copyStatForGroup(stat, groupBy);
                grouped.put(key, existing);
            } else {
                existing.setTotalGenerated(existing.getTotalGenerated() + stat.getTotalGenerated());
                existing.setAdoptedCount(existing.getAdoptedCount() + stat.getAdoptedCount());
                existing.setPartialAdoptedCount(existing.getPartialAdoptedCount() + stat.getPartialAdoptedCount());
                existing.setRejectedCount(existing.getRejectedCount() + stat.getRejectedCount());
            }
        }

        List<AdoptionStatistic> result = new ArrayList<>(grouped.values());
        for (AdoptionStatistic stat : result) {
            if (stat.getTotalGenerated() > 0) {
                BigDecimal rate = new BigDecimal(stat.getAdoptedCount())
                        .divide(new BigDecimal(stat.getTotalGenerated()), 4, RoundingMode.HALF_UP);
                stat.setAdoptionRate(rate);
            }
        }
        return result;
    }

    private String buildGroupKey(AdoptionStatistic stat, String groupBy) {
        switch (groupBy) {
            case "supervisor":
                return "SUP_" + (stat.getSupervisorId() != null ? stat.getSupervisorId() : "none");
            case "agent":
                return "AGENT_" + (stat.getAgentId() != null ? stat.getAgentId() : "none");
            case "date":
                return "DATE_" + stat.getStatDate();
            case "risk":
                return "RISK_" + stat.getRiskHitReason();
            default:
                return "ALL";
        }
    }

    private AdoptionStatistic copyStatForGroup(AdoptionStatistic source, String groupBy) {
        AdoptionStatistic target = new AdoptionStatistic();
        target.setStatDate(source.getStatDate());
        target.setRiskHitReason(source.getRiskHitReason());

        switch (groupBy) {
            case "supervisor":
                target.setSupervisorId(source.getSupervisorId());
                target.setSupervisorName(source.getSupervisorName());
                break;
            case "agent":
                target.setAgentId(source.getAgentId());
                target.setAgentName(source.getAgentName());
                target.setSupervisorId(source.getSupervisorId());
                target.setSupervisorName(source.getSupervisorName());
                break;
            case "date":
                target.setStatDate(source.getStatDate());
                break;
            case "risk":
                target.setRiskHitReason(source.getRiskHitReason());
                break;
        }

        target.setTotalGenerated(source.getTotalGenerated());
        target.setAdoptedCount(source.getAdoptedCount());
        target.setPartialAdoptedCount(source.getPartialAdoptedCount());
        target.setRejectedCount(source.getRejectedCount());
        return target;
    }

    private List<String> parseRiskReasons(String riskHitReasons) {
        List<String> result = new ArrayList<>();
        if (riskHitReasons == null || riskHitReasons.isEmpty() || "[]".equals(riskHitReasons)) {
            return result;
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            List<String> list = mapper.readValue(riskHitReasons,
                    mapper.getTypeFactory().constructCollectionType(List.class, String.class));
            if (list != null) {
                result.addAll(list);
            }
        } catch (Exception e) {
            log.warn("解析风险原因失败: {}", riskHitReasons);
        }
        return result;
    }
}
