package com.badminton.arena.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.badminton.arena.entity.Equipment;
import com.badminton.arena.entity.Repair;
import com.badminton.arena.exception.BusinessException;
import com.badminton.arena.mapper.RepairMapper;
import com.badminton.arena.service.EquipmentService;
import com.badminton.arena.service.RepairService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class RepairServiceImpl extends ServiceImpl<RepairMapper, Repair> implements RepairService {

    private static final Logger log = LoggerFactory.getLogger(RepairServiceImpl.class);

    @Autowired
    private EquipmentService equipmentService;

    @Override
    public Page<Repair> page(int pageNum, int pageSize, Long equipmentId, Long repairerId, Integer status, Integer priority) {
        LambdaQueryWrapper<Repair> wrapper = new LambdaQueryWrapper<>();
        if (equipmentId != null) {
            wrapper.eq(Repair::getEquipmentId, equipmentId);
        }
        if (repairerId != null) {
            wrapper.eq(Repair::getRepairerId, repairerId);
        }
        if (status != null) {
            wrapper.eq(Repair::getStatus, status);
        }
        if (priority != null) {
            wrapper.eq(Repair::getPriority, priority);
        }
        wrapper.orderByDesc(Repair::getCreateTime);
        return page(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    @Transactional
    public Repair createRepair(Repair repair) {
        Equipment equipment = equipmentService.getById(repair.getEquipmentId());
        if (equipment == null) {
            throw new BusinessException("设备不存在");
        }
        String repairNo = generateRepairNo();
        repair.setRepairNo(repairNo);
        if (repair.getPriority() == null) {
            repair.setPriority(2);
        }
        if (repair.getStatus() == null) {
            repair.setStatus(0);
        }
        if (repair.getReportTime() == null) {
            repair.setReportTime(LocalDateTime.now());
        }
        save(repair);
        equipment.setStatus(3);
        equipmentService.updateById(equipment);
        return repair;
    }

    @Override
    @Transactional
    public Repair assignRepairer(Long id, Long repairerId) {
        Repair repair = getById(id);
        if (repair == null) {
            throw new BusinessException("维修单不存在");
        }
        if (repair.getStatus() != 0) {
            throw new BusinessException("只有待处理状态的维修单可以分配维修人");
        }
        repair.setRepairerId(repairerId);
        updateById(repair);
        return repair;
    }

    @Override
    @Transactional
    public Repair updateStatus(Long id, Integer status, Repair repair) {
        Repair exist = getById(id);
        if (exist == null) {
            throw new BusinessException("维修单不存在");
        }
        if (status == 1) {
            if (exist.getStatus() != 0) {
                throw new BusinessException("只有待处理状态的维修单可以开始维修");
            }
            exist.setStatus(1);
            exist.setStartTime(LocalDateTime.now());
            Equipment equipment = equipmentService.getById(exist.getEquipmentId());
            equipment.setStatus(4);
            equipmentService.updateById(equipment);
        } else if (status == 2) {
            if (exist.getStatus() != 1) {
                throw new BusinessException("只有维修中的维修单可以完成");
            }
            exist.setStatus(2);
            exist.setFinishTime(LocalDateTime.now());
            if (repair != null) {
                exist.setRepairDesc(repair.getRepairDesc());
                exist.setCost(repair.getCost());
            }
            Equipment equipment = equipmentService.getById(exist.getEquipmentId());
            equipment.setStatus(1);
            equipmentService.updateById(equipment);
        } else if (status == 3) {
            if (exist.getStatus() == 2) {
                throw new BusinessException("已完成的维修单不能取消");
            }
            exist.setStatus(3);
        } else {
            throw new BusinessException("无效的状态值");
        }
        updateById(exist);
        return exist;
    }

    @Override
    public Repair getById(Long id) {
        Repair repair = super.getById(id);
        if (repair == null) {
            throw new BusinessException("维修单不存在");
        }
        return repair;
    }

    private String generateRepairNo() {
        String date = java.time.LocalDate.now().toString().replace("-", "");
        long count = count() + 1;
        return "WX" + date + String.format("%04d", count);
    }
}
