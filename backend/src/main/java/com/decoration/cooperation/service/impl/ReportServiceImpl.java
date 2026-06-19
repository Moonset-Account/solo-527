package com.decoration.cooperation.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.decoration.cooperation.entity.BizContract;
import com.decoration.cooperation.entity.BizLead;
import com.decoration.cooperation.entity.BizPaymentRecord;
import com.decoration.cooperation.entity.BizTodoTask;
import com.decoration.cooperation.entity.SysUser;
import com.decoration.cooperation.mapper.BizContractMapper;
import com.decoration.cooperation.mapper.BizLeadMapper;
import com.decoration.cooperation.mapper.BizPaymentRecordMapper;
import com.decoration.cooperation.mapper.BizTodoTaskMapper;
import com.decoration.cooperation.mapper.SysUserMapper;
import com.decoration.cooperation.service.ReportService;
import com.decoration.cooperation.vo.DealPredictionVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final BizLeadMapper bizLeadMapper;
    private final BizContractMapper bizContractMapper;
    private final BizPaymentRecordMapper bizPaymentRecordMapper;
    private final BizTodoTaskMapper bizTodoTaskMapper;
    private final SysUserMapper sysUserMapper;

    @Override
    public DealPredictionVO getDealPrediction() {
        DealPredictionVO vo = new DealPredictionVO();

        LambdaQueryWrapper<BizLead> leadWrapper = new LambdaQueryWrapper<>();
        Long totalLeads = bizLeadMapper.selectCount(leadWrapper);
        vo.setTotalLeads(totalLeads);

        LambdaQueryWrapper<BizContract> contractWrapper = new LambdaQueryWrapper<>();
        contractWrapper.in(BizContract::getStatus, "SIGNED", "EFFECTIVE", "COMPLETED");
        Long totalDeals = bizContractMapper.selectCount(contractWrapper);
        vo.setTotalDeals(totalDeals);

        List<BizContract> signedContracts = bizContractMapper.selectList(contractWrapper);
        BigDecimal totalDealAmount = BigDecimal.ZERO;
        for (BizContract contract : signedContracts) {
            if (contract.getFinalPrice() != null) {
                totalDealAmount = totalDealAmount.add(contract.getFinalPrice());
            } else if (contract.getOriginalPrice() != null) {
                totalDealAmount = totalDealAmount.add(contract.getOriginalPrice());
            }
        }
        vo.setTotalDealAmount(totalDealAmount);

        if (totalLeads > 0) {
            BigDecimal overallDealRate = new BigDecimal(totalDeals)
                    .divide(new BigDecimal(totalLeads), 4, BigDecimal.ROUND_HALF_UP)
                    .multiply(new BigDecimal("100"));
            vo.setOverallDealRate(overallDealRate);
        } else {
            vo.setOverallDealRate(BigDecimal.ZERO);
        }

        LocalDate now = LocalDate.now();
        LocalDate monthStart = now.withDayOfMonth(1);
        LocalDate monthEnd = now.withDayOfMonth(now.lengthOfMonth());
        LocalDate quarterStart = now.withMonth(((now.getMonthValue() - 1) / 3) * 3 + 1).withDayOfMonth(1);
        LocalDate quarterEnd = quarterStart.plusMonths(3).minusDays(1);

        BigDecimal predictedMonthAmount = predictAmount(monthStart, monthEnd);
        vo.setPredictedMonthAmount(predictedMonthAmount);

        BigDecimal predictedQuarterAmount = predictAmount(quarterStart, quarterEnd);
        vo.setPredictedQuarterAmount(predictedQuarterAmount);

        List<Map<String, Object>> byStage = new ArrayList<>();
        String[] stages = {"INITIAL", "FOLLOWING", "QUOTING", "NEGOTIATING", "SIGNED"};
        String[] stageNames = {"初步接触", "跟进中", "报价中", "洽谈中", "已签约"};
        for (int i = 0; i < stages.length; i++) {
            Map<String, Object> stageMap = new HashMap<>();
            LambdaQueryWrapper<BizLead> stageWrapper = new LambdaQueryWrapper<>();
            stageWrapper.eq(BizLead::getFollowStage, stages[i]);
            Long count = bizLeadMapper.selectCount(stageWrapper);
            stageMap.put("stage", stages[i]);
            stageMap.put("stageName", stageNames[i]);
            stageMap.put("count", count);
            byStage.add(stageMap);
        }
        vo.setByStage(byStage);

        List<Map<String, Object>> byOwner = new ArrayList<>();
        List<SysUser> users = sysUserMapper.selectList(null);
        for (SysUser user : users) {
            Map<String, Object> ownerMap = new HashMap<>();
            LambdaQueryWrapper<BizLead> ownerWrapper = new LambdaQueryWrapper<>();
            ownerWrapper.eq(BizLead::getOwnerId, user.getId());
            Long leadCount = bizLeadMapper.selectCount(ownerWrapper);

            LambdaQueryWrapper<BizContract> ownerContractWrapper = new LambdaQueryWrapper<>();
            ownerContractWrapper.eq(BizContract::getOwnerId, user.getId());
            ownerContractWrapper.in(BizContract::getStatus, "SIGNED", "EFFECTIVE", "COMPLETED");
            List<BizContract> ownerContracts = bizContractMapper.selectList(ownerContractWrapper);
            BigDecimal ownerAmount = BigDecimal.ZERO;
            for (BizContract c : ownerContracts) {
                if (c.getFinalPrice() != null) {
                    ownerAmount = ownerAmount.add(c.getFinalPrice());
                } else if (c.getOriginalPrice() != null) {
                    ownerAmount = ownerAmount.add(c.getOriginalPrice());
                }
            }

            ownerMap.put("ownerId", user.getId());
            ownerMap.put("ownerName", user.getRealName());
            ownerMap.put("leadCount", leadCount);
            ownerMap.put("dealCount", (long) ownerContracts.size());
            ownerMap.put("dealAmount", ownerAmount);
            byOwner.add(ownerMap);
        }
        vo.setByOwner(byOwner);

        List<Map<String, Object>> bySource = new ArrayList<>();
        List<Map<String, Object>> leadStats = bizLeadMapper.selectLeadStatistics();
        vo.setBySource(leadStats != null ? leadStats : new ArrayList<>());

        List<Map<String, Object>> monthlyTrend = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDate month = now.minusMonths(i).withDayOfMonth(1);
            LocalDate monthEndDate = month.withDayOfMonth(month.lengthOfMonth());
            Map<String, Object> trendMap = new HashMap<>();

            LambdaQueryWrapper<BizLead> monthLeadWrapper = new LambdaQueryWrapper<>();
            monthLeadWrapper.ge(BizLead::getCreateTime, month.atStartOfDay());
            monthLeadWrapper.le(BizLead::getCreateTime, monthEndDate.atTime(23, 59, 59));
            Long monthLeads = bizLeadMapper.selectCount(monthLeadWrapper);

            LambdaQueryWrapper<BizContract> monthContractWrapper = new LambdaQueryWrapper<>();
            monthContractWrapper.ge(BizContract::getSignDate, month);
            monthContractWrapper.le(BizContract::getSignDate, monthEndDate);
            monthContractWrapper.in(BizContract::getStatus, "SIGNED", "EFFECTIVE", "COMPLETED");
            List<BizContract> monthContracts = bizContractMapper.selectList(monthContractWrapper);
            BigDecimal monthAmount = BigDecimal.ZERO;
            for (BizContract c : monthContracts) {
                if (c.getFinalPrice() != null) {
                    monthAmount = monthAmount.add(c.getFinalPrice());
                } else if (c.getOriginalPrice() != null) {
                    monthAmount = monthAmount.add(c.getOriginalPrice());
                }
            }

            trendMap.put("month", month.format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM")));
            trendMap.put("leadCount", monthLeads);
            trendMap.put("dealCount", (long) monthContracts.size());
            trendMap.put("dealAmount", monthAmount);
            monthlyTrend.add(trendMap);
        }
        vo.setMonthlyTrend(monthlyTrend);

        return vo;
    }

    @Override
    public Map<String, Object> getDashboardStatistics() {
        Map<String, Object> stats = new HashMap<>();

        LambdaQueryWrapper<BizLead> todayLeadWrapper = new LambdaQueryWrapper<>();
        LocalDate today = LocalDate.now();
        todayLeadWrapper.ge(BizLead::getCreateTime, today.atStartOfDay());
        todayLeadWrapper.le(BizLead::getCreateTime, today.atTime(23, 59, 59));
        Long todayLeads = bizLeadMapper.selectCount(todayLeadWrapper);
        stats.put("todayLeads", todayLeads);

        LambdaQueryWrapper<BizLead> monthLeadWrapper = new LambdaQueryWrapper<>();
        LocalDate monthStart = today.withDayOfMonth(1);
        monthLeadWrapper.ge(BizLead::getCreateTime, monthStart.atStartOfDay());
        Long monthLeads = bizLeadMapper.selectCount(monthLeadWrapper);
        stats.put("monthLeads", monthLeads);

        LambdaQueryWrapper<BizContract> monthContractWrapper = new LambdaQueryWrapper<>();
        monthContractWrapper.ge(BizContract::getSignDate, monthStart);
        monthContractWrapper.in(BizContract::getStatus, "SIGNED", "EFFECTIVE", "COMPLETED");
        List<BizContract> monthContracts = bizContractMapper.selectList(monthContractWrapper);
        stats.put("monthDeals", (long) monthContracts.size());

        BigDecimal monthDealAmount = BigDecimal.ZERO;
        for (BizContract c : monthContracts) {
            if (c.getFinalPrice() != null) {
                monthDealAmount = monthDealAmount.add(c.getFinalPrice());
            } else if (c.getOriginalPrice() != null) {
                monthDealAmount = monthDealAmount.add(c.getOriginalPrice());
            }
        }
        stats.put("monthDealAmount", monthDealAmount);

        LambdaQueryWrapper<BizPaymentRecord> monthPaymentWrapper = new LambdaQueryWrapper<>();
        monthPaymentWrapper.ge(BizPaymentRecord::getPaymentDate, monthStart);
        List<BizPaymentRecord> monthPayments = bizPaymentRecordMapper.selectList(monthPaymentWrapper);
        BigDecimal monthPaymentAmount = BigDecimal.ZERO;
        for (BizPaymentRecord p : monthPayments) {
            if (p.getAmount() != null) {
                monthPaymentAmount = monthPaymentAmount.add(p.getAmount());
            }
        }
        stats.put("monthPaymentAmount", monthPaymentAmount);

        LambdaQueryWrapper<BizTodoTask> pendingTodoWrapper = new LambdaQueryWrapper<>();
        pendingTodoWrapper.eq(BizTodoTask::getStatus, "PENDING");
        pendingTodoWrapper.or(w -> w.eq(BizTodoTask::getStatus, "IN_PROGRESS"));
        Long pendingTodos = bizTodoTaskMapper.selectCount(pendingTodoWrapper);
        stats.put("pendingTodos", pendingTodos);

        LambdaQueryWrapper<BizLead> conflictWrapper = new LambdaQueryWrapper<>();
        conflictWrapper.eq(BizLead::getConflictFlag, 1);
        Long conflictLeads = bizLeadMapper.selectCount(conflictWrapper);
        stats.put("conflictLeads", conflictLeads);

        LambdaQueryWrapper<BizLead> followWrapper = new LambdaQueryWrapper<>();
        followWrapper.le(BizLead::getNextFollowTime, LocalDateTime.now().plusDays(1));
        followWrapper.ne(BizLead::getStatus, "CLOSED");
        followWrapper.ne(BizLead::getStatus, "SIGNED");
        Long needFollowLeads = bizLeadMapper.selectCount(followWrapper);
        stats.put("needFollowLeads", needFollowLeads);

        return stats;
    }

    private BigDecimal predictAmount(LocalDate startDate, LocalDate endDate) {
        BigDecimal predicted = BigDecimal.ZERO;
        LambdaQueryWrapper<BizLead> wrapper = new LambdaQueryWrapper<>();
        wrapper.ge(BizLead::getPredictDealDate, startDate);
        wrapper.le(BizLead::getPredictDealDate, endDate);
        wrapper.ne(BizLead::getStatus, "CLOSED");
        List<BizLead> leads = bizLeadMapper.selectList(wrapper);
        for (BizLead lead : leads) {
            if (lead.getBudgetMax() != null && lead.getPredictDealRate() != null) {
                BigDecimal rate = new BigDecimal(lead.getPredictDealRate()).divide(new BigDecimal("100"), 4, BigDecimal.ROUND_HALF_UP);
                predicted = predicted.add(lead.getBudgetMax().multiply(rate));
            } else if (lead.getBudgetMin() != null && lead.getPredictDealRate() != null) {
                BigDecimal rate = new BigDecimal(lead.getPredictDealRate()).divide(new BigDecimal("100"), 4, BigDecimal.ROUND_HALF_UP);
                predicted = predicted.add(lead.getBudgetMin().multiply(rate));
            }
        }
        return predicted;
    }
}
