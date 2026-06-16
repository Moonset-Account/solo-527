package com.badminton.arena.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.badminton.arena.entity.Equipment;

public interface EquipmentService extends IService<Equipment> {

    Page<Equipment> page(int pageNum, int pageSize, String name, String category, Integer status);

    Equipment add(Equipment equipment);

    Equipment update(Equipment equipment);

    void delete(Long id);

    Equipment getById(Long id);

    boolean updateStatus(Long id, Integer status);
}
