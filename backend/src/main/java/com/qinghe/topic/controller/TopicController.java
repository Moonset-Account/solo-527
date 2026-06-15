package com.qinghe.topic.controller;

import com.qinghe.topic.common.PageResult;
import com.qinghe.topic.common.Result;
import com.qinghe.topic.dto.TopicQueryDTO;
import com.qinghe.topic.dto.TopicSaveDTO;
import com.qinghe.topic.entity.Topic;
import com.qinghe.topic.service.TopicService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "选题管理")
@RestController
@RequestMapping("/topic")
@RequiredArgsConstructor
public class TopicController {

    private final TopicService topicService;

    @Operation(summary = "选题分页列表")
    @GetMapping("/page")
    public Result<PageResult<Topic>> page(TopicQueryDTO query) {
        return Result.success(topicService.page(query));
    }

    @Operation(summary = "选题详情")
    @GetMapping("/{id}")
    public Result<Topic> getById(@PathVariable Long id) {
        return Result.success(topicService.getById(id));
    }

    @Operation(summary = "保存选题(新增/编辑)")
    @PostMapping("/save")
    public Result<Void> save(@RequestBody @Valid TopicSaveDTO dto) {
        topicService.save(dto);
        return Result.success();
    }

    @Operation(summary = "更新选题状态")
    @PutMapping("/status/{id}/{status}")
    public Result<Void> updateStatus(@PathVariable Long id, @PathVariable Integer status) {
        topicService.updateStatus(id, status);
        return Result.success();
    }

    @Operation(summary = "删除选题")
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        topicService.delete(id);
        return Result.success();
    }

    @Operation(summary = "选题概览统计")
    @GetMapping("/overview")
    public Result<Map<String, Object>> overview() {
        return Result.success(topicService.getOverview());
    }
}
