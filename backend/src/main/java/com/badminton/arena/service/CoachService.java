package com.badminton.arena.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.badminton.arena.common.PageResult;
import com.badminton.arena.entity.Coach;

public interface CoachService extends IService<Coach> {

    PageResult<Coach> page(Integer pageNum, Integer pageSize, String name, String level);

    Coach add(Coach coach);

    Coach update(Coach coach);

    void delete(Long id);
}
