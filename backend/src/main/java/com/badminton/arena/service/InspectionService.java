package com.badminton.arena.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.badminton.arena.entity.Inspection;

public interface InspectionService extends IService<Inspection> {

    Page<Inspection> page(int pageNum, int pageSize, Long equipmentId, Long inspectorId, Integer status);

    Inspection createInspection(Inspection inspection);

    Inspection assignInspector(Long id, Long inspectorId);

    Inspection submitResult(Long id, Inspection inspection);

    Inspection getById(Long id);
}
