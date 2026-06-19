package com.decoration.cooperation.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.decoration.cooperation.common.PageQuery;
import com.decoration.cooperation.common.PageResult;
import com.decoration.cooperation.entity.BizContract;
import com.decoration.cooperation.entity.BizCustomer;
import com.decoration.cooperation.entity.BizLead;
import com.decoration.cooperation.entity.BizPaymentPlan;
import com.decoration.cooperation.entity.BizPaymentRecord;
import com.decoration.cooperation.entity.SysUser;
import com.decoration.cooperation.exception.BusinessException;
import com.decoration.cooperation.mapper.BizContractMapper;
import com.decoration.cooperation.mapper.BizCustomerMapper;
import com.decoration.cooperation.mapper.BizLeadMapper;
import com.decoration.cooperation.mapper.BizPaymentPlanMapper;
import com.decoration.cooperation.mapper.BizPaymentRecordMapper;
import com.decoration.cooperation.mapper.SysUserMapper;
import com.decoration.cooperation.service.BizPaymentPlanService;
import com.decoration.cooperation.vo.PaymentProgressVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BizPaymentPlanServiceImpl extends ServiceImpl<BizPaymentPlanMapper, BizPaymentPlan> implements BizPaymentPlanService {

    private final BizPaymentRecordMapper bizPaymentRecordMapper;
    private final BizContractMapper bizContractMapper;
    private final BizLeadMapper bizLeadMapper;
    private final BizCustomerMapper bizCustomerMapper;
    private final SysUserMapper sysUserMapper;

    @Override
    public PageResult<?> getPaymentProgressReport(PageQuery pageQuery) {
        List<Map<String, Object>> records = baseMapper.selectPaymentProgressReport(
                pageQuery.getStartDate(),
                pageQuery.getEndDate(),
                pageQuery.getOwnerId()
        );
        PageResult<Map<String, Object>> result = new PageResult<>();
        result.setRecords(records);
        result.setTotal((long) records.size());
        result.setCurrent(pageQuery.getCurrent());
        result.setSize(pageQuery.getSize());
        result.setPages(records.isEmpty() ? 0L : 1L);
        return result;
    }

    @Override
    public PaymentProgressVO getPaymentProgressDetail(Long contractId) {
        BizContract contract = bizContractMapper.selectById(contractId);
        if (contract == null) {
            throw new BusinessException("合同不存在");
        }

        PaymentProgressVO vo = new PaymentProgressVO();
        vo.setContractId(contract.getId());
        vo.setContractNo(contract.getContractNo());
        vo.setContractName(contract.getContractName());
        vo.setLeadId(contract.getLeadId());
        vo.setOwnerId(contract.getOwnerId());
        vo.setContractAmount(contract.getFinalPrice() != null ? contract.getFinalPrice() : contract.getOriginalPrice());

        if (contract.getLeadId() != null) {
            BizLead lead = bizLeadMapper.selectById(contract.getLeadId());
            if (lead != null) {
                vo.setLeadNo(lead.getLeadNo());
                vo.setProjectName(lead.getProjectName());
            }
        }

        if (contract.getCustomerId() != null) {
            BizCustomer customer = bizCustomerMapper.selectById(contract.getCustomerId());
            if (customer != null) {
                vo.setCustomerId(customer.getId());
                vo.setCustomerName(customer.getCustomerName());
                vo.setCustomerPhone(customer.getPhone());
            }
        }

        if (contract.getOwnerId() != null) {
            SysUser owner = sysUserMapper.selectById(contract.getOwnerId());
            if (owner != null) {
                vo.setOwnerName(owner.getRealName());
            }
        }

        LambdaQueryWrapper<BizPaymentPlan> planWrapper = new LambdaQueryWrapper<>();
        planWrapper.eq(BizPaymentPlan::getContractId, contractId);
        planWrapper.orderByAsc(BizPaymentPlan::getPeriodNo);
        List<BizPaymentPlan> plans = list(planWrapper);
        vo.setPlans(plans);

        BigDecimal totalPlanAmount = BigDecimal.ZERO;
        BigDecimal totalActualAmount = BigDecimal.ZERO;
        for (BizPaymentPlan plan : plans) {
            if (plan.getPlanAmount() != null) {
                totalPlanAmount = totalPlanAmount.add(plan.getPlanAmount());
            }
            if (plan.getActualAmount() != null) {
                totalActualAmount = totalActualAmount.add(plan.getActualAmount());
            }
        }
        vo.setTotalPlanAmount(totalPlanAmount);
        vo.setTotalActualAmount(totalActualAmount);

        if (totalPlanAmount.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal progress = totalActualAmount.divide(totalPlanAmount, 4, BigDecimal.ROUND_HALF_UP)
                    .multiply(new BigDecimal("100"));
            vo.setPaymentProgress(progress);
        } else {
            vo.setPaymentProgress(BigDecimal.ZERO);
        }

        LambdaQueryWrapper<BizPaymentRecord> recordWrapper = new LambdaQueryWrapper<>();
        recordWrapper.eq(BizPaymentRecord::getContractId, contractId);
        recordWrapper.orderByDesc(BizPaymentRecord::getPaymentDate);
        List<BizPaymentRecord> records = bizPaymentRecordMapper.selectList(recordWrapper);
        vo.setRecords(records);

        if (contract.getSignDate() != null) {
            long days = java.time.temporal.ChronoUnit.DAYS.between(contract.getSignDate(), LocalDate.now());
            vo.setProcessDuration(days);
        }

        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BizPaymentRecord recordPayment(BizPaymentRecord record) {
        bizPaymentRecordMapper.insert(record);

        if (record.getPaymentPlanId() != null) {
            BizPaymentPlan plan = getById(record.getPaymentPlanId());
            if (plan != null) {
                BigDecimal actualAmount = plan.getActualAmount() != null ? plan.getActualAmount() : BigDecimal.ZERO;
                actualAmount = actualAmount.add(record.getAmount());
                plan.setActualAmount(actualAmount);
                plan.setActualDate(record.getPaymentDate());
                if (plan.getPlanAmount() != null && actualAmount.compareTo(plan.getPlanAmount()) >= 0) {
                    plan.setStatus("PAID");
                } else {
                    plan.setStatus("PARTIAL");
                }
                updateById(plan);
            }
        }

        return record;
    }
}
