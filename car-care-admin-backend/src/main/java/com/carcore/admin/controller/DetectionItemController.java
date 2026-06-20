package com.carcore.admin.controller;

import com.carcore.admin.common.PageResult;
import com.carcore.admin.common.Result;
import com.carcore.admin.entity.DetectionItem;
import com.carcore.admin.service.DetectionItemService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/detection-items")
public class DetectionItemController {

    private final DetectionItemService detectionItemService;

    public DetectionItemController(DetectionItemService detectionItemService) {
        this.detectionItemService = detectionItemService;
    }

    @GetMapping("/{id}")
    public Result<DetectionItem> getById(@PathVariable Long id) {
        return Result.success(detectionItemService.getById(id));
    }

    @GetMapping("/code/{itemCode}")
    public Result<DetectionItem> getByCode(@PathVariable String itemCode) {
        return Result.success(detectionItemService.getByItemCode(itemCode));
    }

    @GetMapping("/category/{category}")
    public Result<List<DetectionItem>> getByCategory(@PathVariable String category) {
        return Result.success(detectionItemService.getByCategory(category));
    }

    @GetMapping("/enabled")
    public Result<List<DetectionItem>> getEnabledItems() {
        return Result.success(detectionItemService.getEnabledItems());
    }

    @GetMapping("/page")
    public Result<PageResult<DetectionItem>> page(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        return Result.success(detectionItemService.page(keyword, category, status, pageNum, pageSize));
    }

    @PostMapping
    public Result<DetectionItem> create(@RequestBody DetectionItem item) {
        return Result.success(detectionItemService.create(item));
    }

    @PutMapping
    public Result<DetectionItem> update(@RequestBody DetectionItem item) {
        return Result.success(detectionItemService.update(item));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        detectionItemService.delete(id);
        return Result.success();
    }

    @PutMapping("/{id}/toggle-status")
    public Result<Void> toggleStatus(@PathVariable Long id) {
        detectionItemService.toggleStatus(id);
        return Result.success();
    }
}
