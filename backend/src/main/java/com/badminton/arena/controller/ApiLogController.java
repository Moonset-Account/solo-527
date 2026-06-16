package com.badminton.arena.controller;

import com.alibaba.excel.EasyExcel;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.badminton.arena.common.PageResult;
import com.badminton.arena.common.Result;
import com.badminton.arena.dto.ApiLogQueryDTO;
import com.badminton.arena.dto.RetryResultDTO;
import com.badminton.arena.entity.ApiLog;
import com.badminton.arena.service.ApiLogService;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api-log")
public class ApiLogController {

    @Autowired
    private ApiLogService apiLogService;

    @GetMapping("/page")
    public Result<PageResult<ApiLog>> getApiLogPage(@RequestParam(defaultValue = "1") int pageNum,
                                                    @RequestParam(defaultValue = "10") int pageSize,
                                                    ApiLogQueryDTO queryDTO) {
        Page<ApiLog> page = apiLogService.getApiLogPage(pageNum, pageSize, queryDTO);
        PageResult<ApiLog> pageResult = new PageResult<>(
                page.getTotal(),
                page.getPages(),
                page.getCurrent(),
                page.getSize(),
                page.getRecords()
        );
        return Result.success(pageResult);
    }

    @GetMapping("/{id}")
    public Result<ApiLog> getApiLogDetail(@PathVariable Long id) {
        ApiLog apiLog = apiLogService.getById(id);
        return Result.success(apiLog);
    }

    @GetMapping("/retry/list")
    public Result<List<ApiLog>> getRetryList() {
        List<ApiLog> list = apiLogService.getRetryList();
        return Result.success(list);
    }

    @PostMapping("/retry/mark/{id}")
    public Result<Void> markForRetry(@PathVariable Long id) {
        apiLogService.markForRetry(id);
        return Result.success();
    }

    @PostMapping("/retry/{id}")
    public Result<Void> retry(@PathVariable Long id) {
        apiLogService.retry(id);
        return Result.success();
    }

    @PostMapping("/retry/{id}/result")
    public Result<Void> updateRetryResult(@PathVariable Long id, @RequestBody RetryResultDTO resultDTO) {
        apiLogService.updateRetryResult(id, resultDTO);
        return Result.success();
    }

    @GetMapping("/export")
    public void exportExcel(ApiLogQueryDTO queryDTO, HttpServletResponse response) throws IOException {
        List<ApiLog> list = apiLogService.getExportList(queryDTO);
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setCharacterEncoding("utf-8");
        String fileName = URLEncoder.encode("接口调用日志", StandardCharsets.UTF_8).replaceAll("\\+", "%20");
        response.setHeader("Content-disposition", "attachment;filename*=utf-8''" + fileName + ".xlsx");
        EasyExcel.write(response.getOutputStream(), ApiLog.class)
                .sheet("日志列表")
                .doWrite(list);
    }
}
