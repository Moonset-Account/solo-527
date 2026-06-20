package com.decoration.crm.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.decoration.crm.entity.QuotationVersion;
import com.decoration.crm.exception.BusinessException;
import com.decoration.crm.mapper.QuotationVersionMapper;
import com.decoration.crm.security.UserDetailsImpl;
import com.decoration.crm.service.QuotationVersionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class QuotationVersionServiceImpl implements QuotationVersionService {

    @Autowired
    private QuotationVersionMapper quotationVersionMapper;

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) authentication.getPrincipal()).getId();
        }
        return null;
    }

    @Override
    public List<QuotationVersion> getByLeadId(Long leadId) {
        return quotationVersionMapper.selectByLeadId(leadId);
    }

    @Override
    public QuotationVersion getById(Long id) {
        return quotationVersionMapper.selectById(id);
    }

    @Override
    @Transactional
    public QuotationVersion create(QuotationVersion quotation) {
        quotation.setCreatedBy(getCurrentUserId());
        quotation.setIsCurrent(false);
        quotationVersionMapper.insert(quotation);
        return quotation;
    }

    @Override
    public QuotationVersion update(Long id, QuotationVersion quotation) {
        QuotationVersion existing = quotationVersionMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException("报价版本不存在");
        }
        quotation.setId(id);
        quotationVersionMapper.updateById(quotation);
        return quotationVersionMapper.selectById(id);
    }

    @Override
    public void delete(Long id) {
        quotationVersionMapper.deleteById(id);
    }

    @Override
    @Transactional
    public void setCurrent(Long id) {
        QuotationVersion quotation = quotationVersionMapper.selectById(id);
        if (quotation == null) {
            throw new BusinessException("报价版本不存在");
        }
        LambdaQueryWrapper<QuotationVersion> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(QuotationVersion::getLeadId, quotation.getLeadId());
        List<QuotationVersion> all = quotationVersionMapper.selectList(wrapper);
        for (QuotationVersion q : all) {
            q.setIsCurrent(false);
            quotationVersionMapper.updateById(q);
        }
        quotation.setIsCurrent(true);
        quotationVersionMapper.updateById(quotation);
    }
}
