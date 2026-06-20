package com.decoration.crm.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.decoration.crm.entity.PublicSeaRule;
import com.decoration.crm.mapper.PublicSeaRuleMapper;
import com.decoration.crm.service.PublicSeaRuleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PublicSeaRuleServiceImpl implements PublicSeaRuleService {

    @Autowired
    private PublicSeaRuleMapper publicSeaRuleMapper;

    @Override
    public List<PublicSeaRule> getAll() {
        LambdaQueryWrapper<PublicSeaRule> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(PublicSeaRule::getCreatedAt);
        return publicSeaRuleMapper.selectList(wrapper);
    }

    @Override
    public List<PublicSeaRule> getEnabled() {
        LambdaQueryWrapper<PublicSeaRule> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PublicSeaRule::getEnabled, true)
                .orderByDesc(PublicSeaRule::getCreatedAt);
        return publicSeaRuleMapper.selectList(wrapper);
    }

    @Override
    public PublicSeaRule create(PublicSeaRule rule) {
        if (rule.getEnabled() == null) {
            rule.setEnabled(true);
        }
        publicSeaRuleMapper.insert(rule);
        return rule;
    }

    @Override
    public PublicSeaRule update(Long id, PublicSeaRule rule) {
        rule.setId(id);
        publicSeaRuleMapper.updateById(rule);
        return rule;
    }

    @Override
    public void delete(Long id) {
        publicSeaRuleMapper.deleteById(id);
    }
}
