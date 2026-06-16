package com.badminton.arena.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.badminton.arena.entity.Repair;

public interface RepairService extends IService<Repair> {

    Page<Repair> page(int pageNum, int pageSize, Long equipmentId, Long repairerId, Integer status, Integer priority);

    Repair createRepair(Repair repair);

    Repair assignRepairer(Long id, Long repairerId);

    Repair updateStatus(Long id, Integer status, Repair repair);

    Repair getById(Long id);
}
