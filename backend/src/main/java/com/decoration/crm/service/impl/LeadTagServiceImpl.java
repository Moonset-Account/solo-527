package com.decoration.crm.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.decoration.crm.entity.LeadTag;
import com.decoration.crm.mapper.LeadTagMapper;
import com.decoration.crm.service.LeadTagService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class LeadTagServiceImpl implements LeadTagService {

    @Autowired
    private LeadTagMapper leadTagMapper;

    @Override
    public List<LeadTag> getAll() {
        LambdaQueryWrapper<LeadTag> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByAsc(LeadTag::getSortOrder).orderByDesc(LeadTag::getCreatedAt);
        return leadTagMapper.selectList(wrapper);
    }

    @Override
    public List<LeadTag> getByCategory(String category) {
        LambdaQueryWrapper<LeadTag> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(LeadTag::getCategory, category)
                .orderByAsc(LeadTag::getSortOrder);
        return leadTagMapper.selectList(wrapper);
    }

    @Override
    public LeadTag create(LeadTag tag) {
        leadTagMapper.insert(tag);
        return tag;
    }

    @Override
    public LeadTag update(Long id, LeadTag tag) {
        tag.setId(id);
        leadTagMapper.updateById(tag);
        return tag;
    }

    @Override
    public void delete(Long id) {
        leadTagMapper.deleteById(id);
    }
}
