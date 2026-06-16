package com.badminton.arena.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.badminton.arena.context.UserContext;
import com.badminton.arena.entity.Equipment;
import com.badminton.arena.entity.Inspection;
import com.badminton.arena.entity.Repair;
import com.badminton.arena.exception.BusinessException;
import com.badminton.arena.mapper.InspectionMapper;
import com.badminton.arena.service.EquipmentService;
import com.badminton.arena.service.InspectionService;
import com.badminton.arena.service.RepairService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class InspectionServiceImpl extends ServiceImpl<InspectionMapper, Inspection> implements InspectionService {

    private static final Logger log = LoggerFactory.getLogger(InspectionServiceImpl.class);

    @Autowired
    private EquipmentService equipmentService;

    @Autowired
    private RepairService repairService;

    @Override
    public Page<Inspection> page(int pageNum, int pageSize, Long equipmentId, Long inspectorId, Integer status) {
        LambdaQueryWrapper<Inspection> wrapper = new LambdaQueryWrapper<>();
        if (equipmentId != null) {
            wrapper.eq(Inspection::getEquipmentId, equipmentId);
        }
        if (inspectorId != null) {
            wrapper.eq(Inspection::getInspectorId, inspectorId);
        }
        if (status != null) {
            wrapper.eq(Inspection::getStatus, status);
        }
        wrapper.orderByDesc(Inspection::getCreateTime);
        return page(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    @Transactional
    public Inspection createInspection(Inspection inspection) {
        Equipment equipment = equipmentService.getById(inspection.getEquipmentId());
        if (equipment == null) {
            throw new BusinessException("设备不存在");
        }
        String inspectionNo = generateInspectionNo();
        inspection.setInspectionNo(inspectionNo);
        if (inspection.getStatus() == null) {
            inspection.setStatus(0);
        }
        save(inspection);
        equipment.setStatus(2);
        equipmentService.updateById(equipment);
        return inspection;
    }

    @Override
    @Transactional
    public Inspection assignInspector(Long id, Long inspectorId) {
        Inspection inspection = getById(id);
        if (inspection == null) {
            throw new BusinessException("巡检任务不存在");
        }
        if (inspection.getStatus() != 0) {
            throw new BusinessException("只有待巡检状态的任务可以分配巡检人");
        }
        inspection.setInspectorId(inspectorId);
        inspection.setStatus(1);
        updateById(inspection);
        return inspection;
    }

    @Override
    @Transactional
    public Inspection submitResult(Long id, Inspection inspection) {
        Inspection exist = getById(id);
        if (exist == null) {
            throw new BusinessException("巡检任务不存在");
        }
        if (exist.getStatus() != 1) {
            throw new BusinessException("只有巡检中的任务可以提交结果");
        }
        exist.setResult(inspection.getResult());
        exist.setAbnormalDesc(inspection.getAbnormalDesc());
        exist.setImages(inspection.getImages());
        exist.setActualTime(LocalDateTime.now());

        Equipment equipment = equipmentService.getById(exist.getEquipmentId());

        if (inspection.getStatus() != null && inspection.getStatus() == 3) {
            exist.setStatus(3);
            equipment.setStatus(3);
            Repair repair = new Repair();
            repair.setEquipmentId(exist.getEquipmentId());
            repair.setInspectionId(exist.getId());
            repair.setReporterId(UserContext.getUserId());
            repair.setFaultDesc(inspection.getAbnormalDesc());
            repair.setPriority(2);
            repair.setStatus(0);
            repairService.createRepair(repair);
        } else {
            exist.setStatus(2);
            equipment.setStatus(1);
            equipment.setLastInspectionTime(LocalDateTime.now());
        }

        updateById(exist);
        equipmentService.updateById(equipment);
        return exist;
    }

    @Override
    public Inspection getById(Long id) {
        Inspection inspection = super.getById(id);
        if (inspection == null) {
            throw new BusinessException("巡检任务不存在");
        }
        return inspection;
    }

    private String generateInspectionNo() {
        String date = java.time.LocalDate.now().toString().replace("-", "");
        long count = count() + 1;
        return "XJ" + date + String.format("%04d", count);
    }
}
