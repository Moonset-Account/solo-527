package com.decoration.crm.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.decoration.crm.entity.LostReason;
import com.decoration.crm.mapper.LostReasonMapper;
import com.decoration.crm.service.LostReasonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class LostReasonServiceImpl implements LostReasonService {

    @Autowired
    private LostReasonMapper lostReasonMapper;

    @Override
    public List<LostReason> getAll() {
        LambdaQueryWrapper<LostReason> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByAsc(LostReason::getSortOrder).orderByDesc(LostReason::getCreatedAt);
        return lostReasonMapper.selectList(wrapper);
    }

    @Override
    public List<LostReason> getEnabled() {
        LambdaQueryWrapper<LostReason> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(LostReason::getEnabled, true)
                .orderByAsc(LostReason::getSortOrder);
        return lostReasonMapper.selectList(wrapper);
    }

    @Override
    public LostReason create(LostReason reason) {
        if (reason.getEnabled() == null) {
            reason.setEnabled(true);
        }
        lostReasonMapper.insert(reason);
        return reason;
    }

    @Override
    public LostReason update(Long id, LostReason reason) {
        reason.setId(id);
        lostReasonMapper.updateById(reason);
        return reason;
    }

    @Override
    public void delete(Long id) {
        lostReasonMapper.deleteById(id);
    }
}
