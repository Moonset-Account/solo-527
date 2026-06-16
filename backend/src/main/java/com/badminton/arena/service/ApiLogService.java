package com.badminton.arena.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.badminton.arena.dto.ApiLogQueryDTO;
import com.badminton.arena.dto.RetryResultDTO;
import com.badminton.arena.entity.ApiLog;

import java.util.List;

public interface ApiLogService extends IService<ApiLog> {

    Page<ApiLog> getApiLogPage(int pageNum, int pageSize, ApiLogQueryDTO queryDTO);

    List<ApiLog> getRetryList();

    boolean markForRetry(Long id);

    boolean retry(Long id);

    boolean updateRetryResult(Long id, RetryResultDTO resultDTO);

    List<ApiLog> getExportList(ApiLogQueryDTO queryDTO);
}
