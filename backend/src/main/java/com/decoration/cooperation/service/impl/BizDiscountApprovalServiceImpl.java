package com.decoration.cooperation.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.decoration.cooperation.common.PageQuery;
import com.decoration.cooperation.common.PageResult;
import com.decoration.cooperation.dto.ApprovalActionDTO;
import com.decoration.cooperation.dto.DiscountApprovalCreateDTO;
import com.decoration.cooperation.entity.BizApprovalRecord;
import com.decoration.cooperation.entity.BizContract;
import com.decoration.cooperation.entity.BizDiscountApproval;
import com.decoration.cooperation.entity.BizLead;
import com.decoration.cooperation.entity.SysUser;
import com.decoration.cooperation.exception.BusinessException;
import com.decoration.cooperation.mapper.BizApprovalRecordMapper;
import com.decoration.cooperation.mapper.BizContractMapper;
import com.decoration.cooperation.mapper.BizDiscountApprovalMapper;
import com.decoration.cooperation.mapper.BizLeadMapper;
import com.decoration.cooperation.mapper.SysUserMapper;
import com.decoration.cooperation.service.BizDiscountApprovalService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BizDiscountApprovalServiceImpl extends ServiceImpl<BizDiscountApprovalMapper, BizDiscountApproval> implements BizDiscountApprovalService {

    private final BizContractMapper bizContractMapper;
    private final BizLeadMapper bizLeadMapper;
    private final SysUserMapper sysUserMapper;
    private final BizApprovalRecordMapper bizApprovalRecordMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BizDiscountApproval createApproval(DiscountApprovalCreateDTO dto) {
        BizContract contract = bizContractMapper.selectById(dto.getContractId());
        if (contract == null) {
            throw new BusinessException("合同不存在");
        }

        BizDiscountApproval approval = new BizDiscountApproval();
        approval.setApprovalNo(generateApprovalNo());
        approval.setContractId(dto.getContractId());
        approval.setLeadId(contract.getLeadId());
        approval.setOriginalPrice(dto.getOriginalPrice());
        approval.setRequestDiscountRate(dto.getRequestDiscountRate());
        approval.setRequestDiscountAmount(dto.getRequestDiscountAmount() != null ? dto.getRequestDiscountAmount() :
                dto.getOriginalPrice().multiply(BigDecimal.ONE.subtract(dto.getRequestDiscountRate())));
        approval.setRequestFinalPrice(dto.getRequestFinalPrice() != null ? dto.getRequestFinalPrice() :
                dto.getOriginalPrice().subtract(approval.getRequestDiscountAmount()));
        approval.setReason(dto.getReason());
        approval.setApprovalLevel(1);
        approval.setStatus("DRAFT");
        approval.setRemark(dto.getRemark());
        save(approval);
        return approval;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void submitApproval(Long id) {
        BizDiscountApproval approval = getById(id);
        if (approval == null) {
            throw new BusinessException("审批不存在");
        }
        if (!"DRAFT".equals(approval.getStatus())) {
            throw new BusinessException("只有草稿状态可以提交");
        }
        approval.setStatus("PENDING");
        approval.setSubmitTime(LocalDateTime.now());
        updateById(approval);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void approve(ApprovalActionDTO dto) {
        BizDiscountApproval approval = getById(dto.getApprovalId());
        if (approval == null) {
            throw new BusinessException("审批不存在");
        }
        if (!"PENDING".equals(approval.getStatus())) {
            throw new BusinessException("只有待审批状态可以审批");
        }

        approval.setStatus("APPROVED");
        approval.setApproveTime(LocalDateTime.now());
        updateById(approval);

        BizApprovalRecord record = new BizApprovalRecord();
        record.setApprovalId(approval.getId());
        record.setApprovalType("DISCOUNT");
        record.setApprovalAction("APPROVE");
        record.setApprovalLevel(approval.getApprovalLevel());
        record.setOpinion(dto.getOpinion());
        record.setProcessDuration(dto.getProcessDuration());
        record.setCreateTime(LocalDateTime.now());
        bizApprovalRecordMapper.insert(record);

        BizContract contract = bizContractMapper.selectById(approval.getContractId());
        if (contract != null) {
            contract.setDiscountRate(approval.getRequestDiscountRate());
            contract.setDiscountAmount(approval.getRequestDiscountAmount());
            contract.setFinalPrice(approval.getRequestFinalPrice());
            bizContractMapper.updateById(contract);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void reject(ApprovalActionDTO dto) {
        BizDiscountApproval approval = getById(dto.getApprovalId());
        if (approval == null) {
            throw new BusinessException("审批不存在");
        }
        if (!"PENDING".equals(approval.getStatus())) {
            throw new BusinessException("只有待审批状态可以审批");
        }

        approval.setStatus("REJECTED");
        approval.setApproveTime(LocalDateTime.now());
        updateById(approval);

        BizApprovalRecord record = new BizApprovalRecord();
        record.setApprovalId(approval.getId());
        record.setApprovalType("DISCOUNT");
        record.setApprovalAction("REJECT");
        record.setApprovalLevel(approval.getApprovalLevel());
        record.setOpinion(dto.getOpinion());
        record.setProcessDuration(dto.getProcessDuration());
        record.setCreateTime(LocalDateTime.now());
        bizApprovalRecordMapper.insert(record);
    }

    @Override
    public PageResult<BizDiscountApproval> listApprovals(PageQuery pageQuery) {
        Page<BizDiscountApproval> page = new Page<>(pageQuery.getCurrent(), pageQuery.getSize());
        LambdaQueryWrapper<BizDiscountApproval> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(pageQuery.getKeyword())) {
            wrapper.like(BizDiscountApproval::getApprovalNo, pageQuery.getKeyword());
        }
        if (StringUtils.hasText(pageQuery.getStatus())) {
            wrapper.eq(BizDiscountApproval::getStatus, pageQuery.getStatus());
        }
        wrapper.orderByDesc(BizDiscountApproval::getCreateTime);
        Page<BizDiscountApproval> result = page(page, wrapper);
        return PageResult.of(result);
    }

    @Override
    public Map<String, Object> getApprovalDetail(Long id) {
        BizDiscountApproval approval = getById(id);
        if (approval == null) {
            throw new BusinessException("审批不存在");
        }
        Map<String, Object> detail = new HashMap<>();
        detail.put("approval", approval);

        if (approval.getContractId() != null) {
            BizContract contract = bizContractMapper.selectById(approval.getContractId());
            detail.put("contract", contract);
            if (contract != null && contract.getLeadId() != null) {
                BizLead lead = bizLeadMapper.selectById(contract.getLeadId());
                detail.put("lead", lead);
            }
        }

        if (approval.getApplicantId() != null) {
            SysUser applicant = sysUserMapper.selectById(approval.getApplicantId());
            detail.put("applicant", applicant);
        }

        if (approval.getCurrentApproverId() != null) {
            SysUser approver = sysUserMapper.selectById(approval.getCurrentApproverId());
            detail.put("currentApprover", approver);
        }

        LambdaQueryWrapper<BizApprovalRecord> recordWrapper = new LambdaQueryWrapper<>();
        recordWrapper.eq(BizApprovalRecord::getApprovalId, id);
        recordWrapper.eq(BizApprovalRecord::getApprovalType, "DISCOUNT");
        recordWrapper.orderByAsc(BizApprovalRecord::getCreateTime);
        List<BizApprovalRecord> records = bizApprovalRecordMapper.selectList(recordWrapper);
        detail.put("approvalRecords", records);

        return detail;
    }

    private String generateApprovalNo() {
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String prefix = "ZK" + dateStr;
        LambdaQueryWrapper<BizDiscountApproval> wrapper = new LambdaQueryWrapper<>();
        wrapper.likeRight(BizDiscountApproval::getApprovalNo, prefix);
        wrapper.orderByDesc(BizDiscountApproval::getApprovalNo);
        wrapper.last("LIMIT 1");
        BizDiscountApproval last = getOne(wrapper);
        int seq = 1;
        if (last != null && last.getApprovalNo() != null) {
            String lastSeq = last.getApprovalNo().substring(prefix.length());
            try {
                seq = Integer.parseInt(lastSeq) + 1;
            } catch (NumberFormatException e) {
                seq = 1;
            }
        }
        return prefix + String.format("%03d", seq);
    }
}
