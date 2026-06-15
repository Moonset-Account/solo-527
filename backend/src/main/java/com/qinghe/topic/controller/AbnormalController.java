package com.qinghe.topic.controller;

import com.qinghe.topic.common.PageResult;
import com.qinghe.topic.common.Result;
import com.qinghe.topic.dto.AbnormalHandleDTO;
import com.qinghe.topic.dto.AbnormalQueryDTO;
import com.qinghe.topic.dto.AbnormalSaveDTO;
import com.qinghe.topic.entity.AbnormalRecord;
import com.qinghe.topic.service.AbnormalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "异常记录管理")
@RestController
@RequestMapping("/abnormal")
@RequiredArgsConstructor
public class AbnormalController {

    private final AbnormalService abnormalService;

    @Operation(summary = "异常记录分页列表")
    @GetMapping("/page")
    public Result<PageResult<AbnormalRecord>> page(AbnormalQueryDTO query) {
        return Result.success(abnormalService.page(query));
    }

    @Operation(summary = "异常记录详情")
    @GetMapping("/{id}")
    public Result<AbnormalRecord> getById(@PathVariable Long id) {
        return Result.success(abnormalService.getById(id));
    }

    @Operation(summary = "上报异常记录")
    @PostMapping("/save")
    public Result<Void> save(@RequestBody @Valid AbnormalSaveDTO dto) {
        abnormalService.save(dto);
        return Result.success();
    }

    @Operation(summary = "处理异常(新媒体运营写结论)")
    @PostMapping("/handle")
    public Result<Void> handle(@RequestBody AbnormalHandleDTO dto) {
        abnormalService.handle(dto);
        return Result.success();
    }

    @Operation(summary = "更新异常状态")
    @PutMapping("/status/{id}/{status}")
    public Result<Void> updateStatus(@PathVariable Long id, @PathVariable Integer status) {
        abnormalService.updateStatus(id, status);
        return Result.success();
    }

    @Operation(summary = "异常概览统计")
    @GetMapping("/overview")
    public Result<Map<String, Object>> overview() {
        return Result.success(abnormalService.getOverview());
    }
}
