package com.qinghe.course.controller;

import com.qinghe.course.common.PageResult;
import com.qinghe.course.common.QueryParams;
import com.qinghe.course.common.Result;
import com.qinghe.course.entity.LearningProgress;
import com.qinghe.course.security.SecurityUtils;
import com.qinghe.course.service.LearningService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/learning")
@RequiredArgsConstructor
public class LearningController {

    private final LearningService learningService;

    @GetMapping("/my")
    public Result<List<LearningProgress>> getMyProgress() {
        return Result.success(learningService.getMyProgress());
    }

    @GetMapping
    public Result<PageResult<LearningProgress>> list(QueryParams params) {
        Long userId = SecurityUtils.getCurrentUser().isAdmin() ? null : SecurityUtils.getCurrentUserId();
        return Result.success(learningService.search(params, userId));
    }

    @GetMapping("/class/{classId}")
    public Result<List<LearningProgress>> getClassProgress(@PathVariable Long classId) {
        return Result.success(learningService.getClassProgress(classId));
    }

    @PutMapping("/{id}/progress")
    public Result<LearningProgress> updateProgress(@PathVariable Long id, @RequestBody UpdateProgressRequest request) {
        return Result.success(learningService.updateProgress(id, request.getHours(), request.getCompletedLessons()));
    }

    @Data
    public static class UpdateProgressRequest {
        private BigDecimal hours;
        private Integer completedLessons;
    }
}
