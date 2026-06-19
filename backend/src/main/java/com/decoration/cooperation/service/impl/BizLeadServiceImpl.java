package com.decoration.cooperation.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.decoration.cooperation.common.PageQuery;
import com.decoration.cooperation.common.PageResult;
import com.decoration.cooperation.dto.LeadCreateDTO;
import com.decoration.cooperation.entity.BizConflictRecord;
import com.decoration.cooperation.entity.BizCustomer;
import com.decoration.cooperation.entity.BizDecorationRequirement;
import com.decoration.cooperation.entity.BizHouseMeasure;
import com.decoration.cooperation.entity.BizLead;
import com.decoration.cooperation.entity.SysUser;
import com.decoration.cooperation.exception.BusinessException;
import com.decoration.cooperation.mapper.BizConflictRecordMapper;
import com.decoration.cooperation.mapper.BizCustomerMapper;
import com.decoration.cooperation.mapper.BizDecorationRequirementMapper;
import com.decoration.cooperation.mapper.BizHouseMeasureMapper;
import com.decoration.cooperation.mapper.BizLeadMapper;
import com.decoration.cooperation.mapper.SysUserMapper;
import com.decoration.cooperation.service.BizFollowRecordService;
import com.decoration.cooperation.service.BizLeadService;
import com.decoration.cooperation.vo.LeadDetailVO;
import com.decoration.cooperation.vo.TimelineItemVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BizLeadServiceImpl extends ServiceImpl<BizLeadMapper, BizLead> implements BizLeadService {

    private final BizCustomerMapper bizCustomerMapper;
    private final BizDecorationRequirementMapper bizDecorationRequirementMapper;
    private final BizHouseMeasureMapper bizHouseMeasureMapper;
    private final BizConflictRecordMapper bizConflictRecordMapper;
    private final SysUserMapper sysUserMapper;
    private final BizFollowRecordService bizFollowRecordService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BizLead createLead(LeadCreateDTO dto) {
        BizCustomer customer = dto.getCustomer();
        if (customer != null) {
            bizCustomerMapper.insert(customer);
        }

        BizLead lead = new BizLead();
        lead.setLeadNo(generateLeadNo());
        lead.setCustomerId(customer != null ? customer.getId() : null);
        lead.setSource(dto.getSource());
        lead.setSourceDetail(dto.getSourceDetail());
        lead.setProjectName(dto.getProjectName());
        lead.setDecorationType(dto.getDecorationType());
        lead.setHouseArea(dto.getHouseArea());
        lead.setBudgetMin(dto.getBudgetMin());
        lead.setBudgetMax(dto.getBudgetMax());
        lead.setCity(dto.getCity());
        lead.setDistrict(dto.getDistrict());
        lead.setCommunity(dto.getCommunity());
        lead.setExpectStartDate(dto.getExpectStartDate());
        lead.setOwnerId(dto.getOwnerId());
        lead.setStatus("NEW");
        lead.setFollowStage("INITIAL");
        lead.setImportance(dto.getImportance() != null ? dto.getImportance() : 1);
        lead.setConflictFlag(0);
        lead.setPredictDealDate(dto.getPredictDealDate());
        lead.setPredictDealRate(dto.getPredictDealRate() != null ? dto.getPredictDealRate() : 10);
        lead.setRemark(dto.getRemark());
        lead.setAssignTime(LocalDateTime.now());
        save(lead);

        if (dto.getRequirement() != null) {
            BizDecorationRequirement requirement = dto.getRequirement();
            requirement.setLeadId(lead.getId());
            bizDecorationRequirementMapper.insert(requirement);
        }

        List<BizLead> conflicts = baseMapper.selectConflictLeads(
                customer != null ? customer.getPhone() : null,
                customer != null ? customer.getCustomerName() : null,
                dto.getCommunity(),
                lead.getId()
        );
        if (!conflicts.isEmpty()) {
            lead.setConflictFlag(1);
            String conflictIds = conflicts.stream().map(l -> String.valueOf(l.getId())).collect(Collectors.joining(","));
            lead.setConflictWithIds(conflictIds);
            updateById(lead);

            for (BizLead conflict : conflicts) {
                BizConflictRecord record = new BizConflictRecord();
                record.setLeadId1(lead.getId());
                record.setLeadId2(conflict.getId());
                record.setConflictType("AUTO_DETECT");
                record.setDetectTime(LocalDateTime.now());
                record.setStatus("PENDING");
                bizConflictRecordMapper.insert(record);

                if (conflict.getConflictFlag() == null || conflict.getConflictFlag() == 0) {
                    conflict.setConflictFlag(1);
                    String existingIds = conflict.getConflictWithIds() != null ? conflict.getConflictWithIds() + "," : "";
                    conflict.setConflictWithIds(existingIds + lead.getId());
                    updateById(conflict);
                }
            }
        }

        return lead;
    }

    @Override
    public LeadDetailVO getLeadDetail(Long id) {
        BizLead lead = getById(id);
        if (lead == null) {
            throw new BusinessException("线索不存在");
        }
        LeadDetailVO vo = new LeadDetailVO();
        vo.setId(lead.getId());
        vo.setLeadNo(lead.getLeadNo());
        vo.setSource(lead.getSource());
        vo.setSourceDetail(lead.getSourceDetail());
        vo.setProjectName(lead.getProjectName());
        vo.setDecorationType(lead.getDecorationType());
        vo.setHouseArea(lead.getHouseArea());
        vo.setBudgetMin(lead.getBudgetMin());
        vo.setBudgetMax(lead.getBudgetMax());
        vo.setCity(lead.getCity());
        vo.setDistrict(lead.getDistrict());
        vo.setCommunity(lead.getCommunity());
        vo.setExpectStartDate(lead.getExpectStartDate());
        vo.setOwnerId(lead.getOwnerId());
        vo.setStatus(lead.getStatus());
        vo.setFollowStage(lead.getFollowStage());
        vo.setImportance(lead.getImportance());
        vo.setConflictFlag(lead.getConflictFlag());
        vo.setConflictWithIds(lead.getConflictWithIds());
        vo.setPredictDealDate(lead.getPredictDealDate());
        vo.setPredictDealRate(lead.getPredictDealRate());
        vo.setRemark(lead.getRemark());
        vo.setAssignTime(lead.getAssignTime());
        vo.setLastFollowTime(lead.getLastFollowTime());
        vo.setNextFollowTime(lead.getNextFollowTime());
        vo.setCreateTime(lead.getCreateTime());

        if (lead.getOwnerId() != null) {
            SysUser owner = sysUserMapper.selectById(lead.getOwnerId());
            if (owner != null) {
                vo.setOwnerName(owner.getRealName());
            }
        }

        if (lead.getCustomerId() != null) {
            vo.setCustomer(bizCustomerMapper.selectById(lead.getCustomerId()));
        }

        LambdaQueryWrapper<BizDecorationRequirement> reqWrapper = new LambdaQueryWrapper<>();
        reqWrapper.eq(BizDecorationRequirement::getLeadId, id);
        vo.setRequirement(bizDecorationRequirementMapper.selectOne(reqWrapper));

        LambdaQueryWrapper<BizHouseMeasure> measureWrapper = new LambdaQueryWrapper<>();
        measureWrapper.eq(BizHouseMeasure::getLeadId, id);
        vo.setMeasure(bizHouseMeasureMapper.selectOne(measureWrapper));

        List<TimelineItemVO> timeline = bizFollowRecordService.getTimeline(id, null);
        vo.setTimeline(timeline);

        return vo;
    }

    @Override
    public void updateLead(BizLead lead) {
        updateById(lead);
    }

    @Override
    public PageResult<BizLead> listLeads(PageQuery pageQuery) {
        Page<BizLead> page = new Page<>(pageQuery.getCurrent(), pageQuery.getSize());
        LambdaQueryWrapper<BizLead> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(pageQuery.getKeyword())) {
            wrapper.and(w -> w.like(BizLead::getProjectName, pageQuery.getKeyword())
                    .or().like(BizLead::getLeadNo, pageQuery.getKeyword())
                    .or().like(BizLead::getCommunity, pageQuery.getKeyword()));
        }
        if (StringUtils.hasText(pageQuery.getStatus())) {
            wrapper.eq(BizLead::getStatus, pageQuery.getStatus());
        }
        if (pageQuery.getOwnerId() != null) {
            wrapper.eq(BizLead::getOwnerId, pageQuery.getOwnerId());
        }
        wrapper.orderByDesc(BizLead::getCreateTime);
        Page<BizLead> result = page(page, wrapper);
        return PageResult.of(result);
    }

    @Override
    public void assignLead(Long id, Long ownerId) {
        BizLead lead = getById(id);
        if (lead == null) {
            throw new BusinessException("线索不存在");
        }
        lead.setOwnerId(ownerId);
        lead.setAssignTime(LocalDateTime.now());
        updateById(lead);
    }

    @Override
    public List<BizLead> detectConflict(Long id) {
        BizLead lead = getById(id);
        if (lead == null) {
            throw new BusinessException("线索不存在");
        }
        BizCustomer customer = null;
        if (lead.getCustomerId() != null) {
            customer = bizCustomerMapper.selectById(lead.getCustomerId());
        }
        return baseMapper.selectConflictLeads(
                customer != null ? customer.getPhone() : null,
                customer != null ? customer.getCustomerName() : null,
                lead.getCommunity(),
                id
        );
    }

    @Override
    public void updateStatus(Long id, String status, String remark) {
        BizLead lead = getById(id);
        if (lead == null) {
            throw new BusinessException("线索不存在");
        }
        lead.setStatus(status);
        if (StringUtils.hasText(remark)) {
            lead.setRemark(remark);
        }
        updateById(lead);
    }

    private String generateLeadNo() {
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String prefix = "LD" + dateStr;
        LambdaQueryWrapper<BizLead> wrapper = new LambdaQueryWrapper<>();
        wrapper.likeRight(BizLead::getLeadNo, prefix);
        wrapper.orderByDesc(BizLead::getLeadNo);
        wrapper.last("LIMIT 1");
        BizLead last = getOne(wrapper);
        int seq = 1;
        if (last != null && last.getLeadNo() != null) {
            String lastSeq = last.getLeadNo().substring(prefix.length());
            try {
                seq = Integer.parseInt(lastSeq) + 1;
            } catch (NumberFormatException e) {
                seq = 1;
            }
        }
        return prefix + String.format("%03d", seq);
    }
}
