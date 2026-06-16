package com.badminton.arena.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.badminton.arena.common.PageResult;
import com.badminton.arena.entity.Coach;
import com.badminton.arena.exception.BusinessException;
import com.badminton.arena.mapper.CoachMapper;
import com.badminton.arena.service.CoachService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class CoachServiceImpl extends ServiceImpl<CoachMapper, Coach> implements CoachService {

    private static final Logger log = LoggerFactory.getLogger(CoachServiceImpl.class);

    @Override
    public PageResult<Coach> page(Integer pageNum, Integer pageSize, String name, String level) {
        Page<Coach> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<Coach> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(name)) {
            wrapper.like(Coach::getName, name);
        }
        if (StringUtils.hasText(level)) {
            wrapper.eq(Coach::getLevel, level);
        }
        wrapper.orderByDesc(Coach::getCreateTime);
        Page<Coach> result = page(page, wrapper);
        return new PageResult<>(result.getTotal(), result.getPages(), result.getCurrent(), result.getSize(), result.getRecords());
    }

    @Override
    public Coach add(Coach coach) {
        LambdaQueryWrapper<Coach> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Coach::getCoachNo, coach.getCoachNo());
        Coach exist = getOne(wrapper);
        if (exist != null) {
            throw new BusinessException("教练编号已存在");
        }
        if (coach.getStatus() == null) {
            coach.setStatus(1);
        }
        save(coach);
        return coach;
    }

    @Override
    public Coach update(Coach coach) {
        Coach exist = getById(coach.getId());
        if (exist == null) {
            throw new BusinessException("教练不存在");
        }
        updateById(coach);
        return getById(coach.getId());
    }

    @Override
    public void delete(Long id) {
        Coach exist = getById(id);
        if (exist == null) {
            throw new BusinessException("教练不存在");
        }
        removeById(id);
    }
}
