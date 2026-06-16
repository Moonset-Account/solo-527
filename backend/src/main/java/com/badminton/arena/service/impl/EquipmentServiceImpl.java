package com.badminton.arena.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.badminton.arena.entity.Equipment;
import com.badminton.arena.exception.BusinessException;
import com.badminton.arena.mapper.EquipmentMapper;
import com.badminton.arena.service.EquipmentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

@Service
public class EquipmentServiceImpl extends ServiceImpl<EquipmentMapper, Equipment> implements EquipmentService {

    private static final Logger log = LoggerFactory.getLogger(EquipmentServiceImpl.class);

    @Override
    public Page<Equipment> page(int pageNum, int pageSize, String name, String category, Integer status) {
        LambdaQueryWrapper<Equipment> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(name)) {
            wrapper.like(Equipment::getName, name);
        }
        if (StringUtils.hasText(category)) {
            wrapper.eq(Equipment::getCategory, category);
        }
        if (status != null) {
            wrapper.eq(Equipment::getStatus, status);
        }
        wrapper.orderByDesc(Equipment::getCreateTime);
        return page(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    public Equipment add(Equipment equipment) {
        LambdaQueryWrapper<Equipment> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Equipment::getEquipNo, equipment.getEquipNo());
        Equipment exist = getOne(wrapper);
        if (exist != null) {
            throw new BusinessException("设备编号已存在");
        }
        if (equipment.getStatus() == null) {
            equipment.setStatus(1);
        }
        save(equipment);
        return equipment;
    }

    @Override
    public Equipment update(Equipment equipment) {
        Equipment exist = getById(equipment.getId());
        if (exist == null) {
            throw new BusinessException("设备不存在");
        }
        updateById(equipment);
        return getById(equipment.getId());
    }

    @Override
    public void delete(Long id) {
        Equipment exist = getById(id);
        if (exist == null) {
            throw new BusinessException("设备不存在");
        }
        removeById(id);
    }

    @Override
    public Equipment getById(Long id) {
        Equipment equipment = super.getById(id);
        if (equipment == null) {
            throw new BusinessException("设备不存在");
        }
        return equipment;
    }

    @Override
    public boolean updateStatus(Long id, Integer status) {
        Equipment equipment = getById(id);
        equipment.setStatus(status);
        if (status == 2) {
            equipment.setLastInspectionTime(LocalDateTime.now());
        }
        return updateById(equipment);
    }
}
