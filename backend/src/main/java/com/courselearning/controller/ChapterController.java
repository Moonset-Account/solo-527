package com.courselearning.controller;

import com.courselearning.common.Result;
import com.courselearning.entity.Chapter;
import com.courselearning.service.ChapterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/chapter")
public class ChapterController {

    @Autowired
    private ChapterService chapterService;

    @GetMapping("/list")
    public Result<List<Chapter>> list(@RequestParam Long courseId) {
        List<Chapter> result = chapterService.getChapterList(courseId);
        return Result.success(result);
    }

    @GetMapping("/{id}")
    public Result<Chapter> getById(@PathVariable Long id) {
        Chapter chapter = chapterService.getChapterById(id);
        return Result.success(chapter);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public Result<Void> create(@RequestBody Chapter chapter) {
        chapterService.createChapter(chapter);
        return Result.success("创建成功", null);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public Result<Void> update(@PathVariable Long id, @RequestBody Chapter chapter) {
        chapterService.updateChapter(id, chapter);
        return Result.success("更新成功", null);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public Result<Void> delete(@PathVariable Long id) {
        chapterService.deleteChapter(id);
        return Result.success("删除成功", null);
    }

    @PutMapping("/preview")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public Result<Map<String, Object>> setPreview(
            @RequestParam Long id,
            @RequestParam Integer isPreview,
            @RequestParam(required = false) Integer previewDuration) {
        Map<String, Object> result = chapterService.setPreview(id, isPreview, previewDuration);
        return Result.success("设置成功", result);
    }

    @PutMapping("/order")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public Result<Void> updateOrder(
            @RequestParam Long courseId,
            @RequestBody List<Map<String, Object>> orderList) {
        chapterService.updateChapterOrder(courseId, orderList);
        return Result.success("排序更新成功", null);
    }
}
