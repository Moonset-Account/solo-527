package com.badminton.arena.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.badminton.arena.entity.Court;

import java.util.List;

public interface CourtService extends IService<Court> {

    Page<Court> page(int pageNum, int pageSize, Integer status, String keyword);

    List<Court> listByStatus(Integer status);

    Court getById(Long id);

    boolean add(Court court);

    boolean update(Court court);

    boolean delete(Long id);
}
