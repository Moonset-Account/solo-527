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
import com.decoration.cooperation.service.BizContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BizContractServiceImpl extends ServiceImpl<BizContractMapper, BizContract> implements BizContractService {

    private final BizLeadMapper bizLeadMapper;
    private final BizCustomerMapper bizCustomerMapper;
    private final SysUserMapper sysUserMapper;
    private final BizPaymentPlanMapper bizPaymentPlanMapper;
    private final BizPaymentRecordMapper bizPaymentRecordMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BizContract createContract(BizContract contract) {
        contract.setContractNo(generateContractNo());
        if (contract.getStatus() == null) {
            contract.setStatus("DRAFT");
        }
        save(contract);
        return contract;
    }

    @Override
    public BizContract getById(Long id) {
        return super.getById(id);
    }

    @Override
    public PageResult<BizContract> listContracts(PageQuery pageQuery) {
        Page<BizContract> page = new Page<>(pageQuery.getCurrent(), pageQuery.getSize());
        LambdaQueryWrapper<BizContract> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(pageQuery.getKeyword())) {
            wrapper.and(w -> w.like(BizContract::getContractName, pageQuery.getKeyword())
                    .or().like(BizContract::getContractNo, pageQuery.getKeyword()));
        }
        if (StringUtils.hasText(pageQuery.getStatus())) {
            wrapper.eq(BizContract::getStatus, pageQuery.getStatus());
        }
        if (pageQuery.getOwnerId() != null) {
            wrapper.eq(BizContract::getOwnerId, pageQuery.getOwnerId());
        }
        wrapper.orderByDesc(BizContract::getCreateTime);
        Page<BizContract> result = page(page, wrapper);
        return PageResult.of(result);
    }

    @Override
    public void updateStatus(Long id, String status, String remark) {
        BizContract contract = getById(id);
        if (contract == null) {
            throw new BusinessException("合同不存在");
        }
        contract.setStatus(status);
        if (StringUtils.hasText(remark)) {
            contract.setRemark(remark);
        }
        if ("SIGNED".equals(status) || "EFFECTIVE".equals(status)) {
            contract.setApprovalTime(LocalDateTime.now());
        }
        updateById(contract);
    }

    @Override
    public Map<String, Object> getContractDetail(Long id) {
        BizContract contract = getById(id);
        if (contract == null) {
            throw new BusinessException("合同不存在");
        }
        Map<String, Object> detail = new HashMap<>();
        detail.put("contract", contract);

        if (contract.getLeadId() != null) {
            BizLead lead = bizLeadMapper.selectById(contract.getLeadId());
            detail.put("lead", lead);
        }

        if (contract.getCustomerId() != null) {
            BizCustomer customer = bizCustomerMapper.selectById(contract.getCustomerId());
            detail.put("customer", customer);
        }

        if (contract.getOwnerId() != null) {
            SysUser owner = sysUserMapper.selectById(contract.getOwnerId());
            detail.put("owner", owner);
        }

        LambdaQueryWrapper<BizPaymentPlan> planWrapper = new LambdaQueryWrapper<>();
        planWrapper.eq(BizPaymentPlan::getContractId, id);
        planWrapper.orderByAsc(BizPaymentPlan::getPeriodNo);
        List<BizPaymentPlan> plans = bizPaymentPlanMapper.selectList(planWrapper);
        detail.put("paymentPlans", plans);

        LambdaQueryWrapper<BizPaymentRecord> recordWrapper = new LambdaQueryWrapper<>();
        recordWrapper.eq(BizPaymentRecord::getContractId, id);
        recordWrapper.orderByDesc(BizPaymentRecord::getCreateTime);
        List<BizPaymentRecord> records = bizPaymentRecordMapper.selectList(recordWrapper);
        detail.put("paymentRecords", records);

        return detail;
    }

    private String generateContractNo() {
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String prefix = "HT" + dateStr;
        LambdaQueryWrapper<BizContract> wrapper = new LambdaQueryWrapper<>();
        wrapper.likeRight(BizContract::getContractNo, prefix);
        wrapper.orderByDesc(BizContract::getContractNo);
        wrapper.last("LIMIT 1");
        BizContract last = getOne(wrapper);
        int seq = 1;
        if (last != null && last.getContractNo() != null) {
            String lastSeq = last.getContractNo().substring(prefix.length());
            try {
                seq = Integer.parseInt(lastSeq) + 1;
            } catch (NumberFormatException e) {
                seq = 1;
            }
        }
        return prefix + String.format("%03d", seq);
    }
}
