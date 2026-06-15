package com.qinghe.topic.controller;

import com.qinghe.topic.common.PageResult;
import com.qinghe.topic.common.Result;
import com.qinghe.topic.dto.ScriptQueryDTO;
import com.qinghe.topic.dto.ScriptSaveDTO;
import com.qinghe.topic.entity.Script;
import com.qinghe.topic.service.ScriptService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "脚本管理")
@RestController
@RequestMapping("/script")
@RequiredArgsConstructor
public class ScriptController {

    private final ScriptService scriptService;

    @Operation(summary = "脚本分页列表")
    @GetMapping("/page")
    public Result<PageResult<Script>> page(ScriptQueryDTO query) {
        return Result.success(scriptService.page(query));
    }

    @Operation(summary = "脚本详情")
    @GetMapping("/{id}")
    public Result<Script> getById(@PathVariable Long id) {
        return Result.success(scriptService.getById(id));
    }

    @Operation(summary = "保存脚本(新增/编辑)")
    @PostMapping("/save")
    public Result<Void> save(@RequestBody @Valid ScriptSaveDTO dto) {
        scriptService.save(dto);
        return Result.success();
    }

    @Operation(summary = "更新脚本状态")
    @PutMapping("/status/{id}/{status}")
    public Result<Void> updateStatus(@PathVariable Long id, @PathVariable Integer status) {
        scriptService.updateStatus(id, status);
        return Result.success();
    }

    @Operation(summary = "删除脚本")
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        scriptService.delete(id);
        return Result.success();
    }

    @Operation(summary = "根据选题ID查询脚本列表")
    @GetMapping("/list/topic/{topicId}")
    public Result<List<Script>> listByTopicId(@PathVariable Long topicId) {
        return Result.success(scriptService.listByTopicId(topicId));
    }

    @Operation(summary = "脚本概览统计")
    @GetMapping("/overview")
    public Result<Map<String, Object>> overview() {
        return Result.success(scriptService.getOverview());
    }
}
