package com.decoration.crm.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.decoration.crm.dto.PageQuery;
import com.decoration.crm.entity.*;
import com.decoration.crm.exception.BusinessException;
import com.decoration.crm.mapper.*;
import com.decoration.crm.security.UserDetailsImpl;
import com.decoration.crm.service.LeadCustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class LeadCustomerServiceImpl implements LeadCustomerService {

    @Autowired
    private LeadCustomerMapper leadCustomerMapper;

    @Autowired
    private LeadTagMapper leadTagMapper;

    @Autowired
    private LeadTagRelMapper leadTagRelMapper;

    @Autowired
    private LeadChangeLogMapper leadChangeLogMapper;

    @Autowired
    private SysUserMapper sysUserMapper;

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) authentication.getPrincipal()).getId();
        }
        return null;
    }

    private void logChange(Long leadId, String fieldName, String oldValue, String newValue, String changeType) {
        LeadChangeLog log = new LeadChangeLog();
        log.setLeadId(leadId);
        log.setFieldName(fieldName);
        log.setOldValue(oldValue);
        log.setNewValue(newValue);
        log.setChangedBy(getCurrentUserId());
        log.setChangeType(changeType);
        leadChangeLogMapper.insert(log);
    }

    @Override
    public IPage<LeadCustomer> getPage(PageQuery query) {
        Page<LeadCustomer> page = new Page<>(query.getPageNum(), query.getPageSize());
        return leadCustomerMapper.selectPageWithNames(page, query);
    }

    @Override
    public LeadCustomer getById(Long id) {
        return leadCustomerMapper.selectByIdWithNames(id);
    }

    @Override
    @Transactional
    public LeadCustomer create(LeadCustomer lead) {
        lead.setStatus("NEW");
        lead.setPublicSeaStatus("IN_SEA");
        lead.setPublicSeaInTime(LocalDateTime.now());
        lead.setTotalFollowCount(0);
        leadCustomerMapper.insert(lead);
        logChange(lead.getId(), "lead", null, "创建线索", "CREATE");
        return getById(lead.getId());
    }

    @Override
    @Transactional
    public LeadCustomer update(Long id, LeadCustomer lead) {
        LeadCustomer existing = leadCustomerMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException("线索不存在");
        }
        lead.setId(id);
        leadCustomerMapper.updateById(lead);
        logChange(id, "lead", null, "更新线索信息", "UPDATE");
        return getById(id);
    }

    @Override
    public void delete(Long id) {
        leadCustomerMapper.deleteById(id);
    }

    @Override
    @Transactional
    public void assignOwner(Long id, Long ownerId) {
        LeadCustomer lead = leadCustomerMapper.selectById(id);
        if (lead == null) {
            throw new BusinessException("线索不存在");
        }
        String oldOwner = lead.getOwnerId() != null ? String.valueOf(lead.getOwnerId()) : null;
        lead.setOwnerId(ownerId);
        lead.setPublicSeaStatus("CLAIMED");
        leadCustomerMapper.updateById(lead);
        logChange(id, "owner_id", oldOwner, String.valueOf(ownerId), "ASSIGN");
    }

    @Override
    @Transactional
    public void updateLevel(Long id, String level) {
        LeadCustomer lead = leadCustomerMapper.selectById(id);
        if (lead == null) {
            throw new BusinessException("线索不存在");
        }
        String oldLevel = lead.getLevel();
        lead.setLevel(level);
        leadCustomerMapper.updateById(lead);
        logChange(id, "level", oldLevel, level, "UPDATE");
    }

    @Override
    @Transactional
    public void updateStatus(Long id, String status) {
        LeadCustomer lead = leadCustomerMapper.selectById(id);
        if (lead == null) {
            throw new BusinessException("线索不存在");
        }
        String oldStatus = lead.getStatus();
        lead.setStatus(status);
        leadCustomerMapper.updateById(lead);
        logChange(id, "status", oldStatus, status, "STATUS_CHANGE");
    }

    @Override
    @Transactional
    public void addTags(Long id, List<Long> tagIds) {
        for (Long tagId : tagIds) {
            LeadTagRel rel = new LeadTagRel();
            rel.setLeadId(id);
            rel.setTagId(tagId);
            try {
                leadTagRelMapper.insert(rel);
            } catch (Exception ignored) {
            }
        }
        logChange(id, "tags", null, "添加标签", "TAG_ADD");
    }

    @Override
    @Transactional
    public void removeTags(Long id, List<Long> tagIds) {
        LambdaQueryWrapper<LeadTagRel> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(LeadTagRel::getLeadId, id).in(LeadTagRel::getTagId, tagIds);
        leadTagRelMapper.delete(wrapper);
        logChange(id, "tags", null, "移除标签", "TAG_REMOVE");
    }

    @Override
    public List<LeadTag> getTags(Long id) {
        return leadTagMapper.selectTagsByLeadId(id);
    }

    @Override
    @Transactional
    public void claimFromPublicSea(Long id) {
        Long userId = getCurrentUserId();
        if (userId == null) {
            throw new BusinessException("未登录");
        }
        LeadCustomer lead = leadCustomerMapper.selectById(id);
        if (lead == null) {
            throw new BusinessException("线索不存在");
        }
        if (!"IN_SEA".equals(lead.getPublicSeaStatus())) {
            throw new BusinessException("线索不在公海中");
        }
        lead.setOwnerId(userId);
        lead.setPublicSeaStatus("CLAIMED");
        leadCustomerMapper.updateById(lead);
        logChange(id, "public_sea_status", "IN_SEA", "CLAIMED", "CLAIM");
    }

    @Override
    @Transactional
    public void releaseToPublicSea(Long id) {
        LeadCustomer lead = leadCustomerMapper.selectById(id);
        if (lead == null) {
            throw new BusinessException("线索不存在");
        }
        String oldStatus = lead.getPublicSeaStatus();
        lead.setPublicSeaStatus("IN_SEA");
        lead.setPublicSeaInTime(LocalDateTime.now());
        lead.setOwnerId(null);
        leadCustomerMapper.updateById(lead);
        logChange(id, "public_sea_status", oldStatus, "IN_SEA", "RELEASE");
    }

    @Override
    @Transactional
    public void markLost(Long id, Long lostReasonId, String remark) {
        LeadCustomer lead = leadCustomerMapper.selectById(id);
        if (lead == null) {
            throw new BusinessException("线索不存在");
        }
        String oldStatus = lead.getStatus();
        lead.setStatus("LOST");
        lead.setLostReasonId(lostReasonId);
        lead.setLostRemark(remark);
        lead.setLostTime(LocalDateTime.now());
        leadCustomerMapper.updateById(lead);
        logChange(id, "status", oldStatus, "LOST", "STATUS_CHANGE");
    }
}
