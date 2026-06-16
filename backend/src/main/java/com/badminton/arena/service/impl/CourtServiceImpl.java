package com.badminton.arena.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.badminton.arena.entity.Court;
import com.badminton.arena.exception.BusinessException;
import com.badminton.arena.mapper.CourtMapper;
import com.badminton.arena.service.CourtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class CourtServiceImpl extends ServiceImpl<CourtMapper, Court> implements CourtService {

    private static final Logger log = LoggerFactory.getLogger(CourtServiceImpl.class);

    @Override
    public Page<Court> page(int pageNum, int pageSize, Integer status, String keyword) {
        LambdaQueryWrapper<Court> wrapper = new LambdaQueryWrapper<>();
        if (status != null) {
            wrapper.eq(Court::getStatus, status);
        }
        if (StringUtils.hasText(keyword)) {
            wrapper.like(Court::getName, keyword)
                    .or().like(Court::getCourtNo, keyword);
        }
        wrapper.orderByAsc(Court::getCourtNo);
        return page(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    public List<Court> listByStatus(Integer status) {
        LambdaQueryWrapper<Court> wrapper = new LambdaQueryWrapper<>();
        if (status != null) {
            wrapper.eq(Court::getStatus, status);
        }
        wrapper.orderByAsc(Court::getCourtNo);
        return list(wrapper);
    }

    @Override
    public Court getById(Long id) {
        Court court = super.getById(id);
        if (court == null) {
            throw new BusinessException("场地不存在");
        }
        return court;
    }

    @Override
    public boolean add(Court court) {
        LambdaQueryWrapper<Court> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Court::getCourtNo, court.getCourtNo());
        Court existCourt = getOne(wrapper);
        if (existCourt != null) {
            throw new BusinessException("场地编号已存在");
        }
        return save(court);
    }

    @Override
    public boolean update(Court court) {
        Court existCourt = getById(court.getId());
        if (existCourt == null) {
            throw new BusinessException("场地不存在");
        }
        if (!existCourt.getCourtNo().equals(court.getCourtNo())) {
            LambdaQueryWrapper<Court> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(Court::getCourtNo, court.getCourtNo());
            Court courtByNo = getOne(wrapper);
            if (courtByNo != null) {
                throw new BusinessException("场地编号已存在");
            }
        }
        return updateById(court);
    }

    @Override
    public boolean delete(Long id) {
        Court court = getById(id);
        if (court == null) {
            throw new BusinessException("场地不存在");
        }
        return removeById(id);
    }
}
