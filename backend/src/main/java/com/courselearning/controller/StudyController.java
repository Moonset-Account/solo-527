package com.courselearning.controller;

import com.courselearning.common.Result;
import com.courselearning.dto.CheckInDTO;
import com.courselearning.dto.ProgressUpdateDTO;
import com.courselearning.entity.CheckIn;
import com.courselearning.service.StudyService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/study")
public class StudyController {

    @Autowired
    private StudyService studyService;

    @PostMapping("/progress")
    public Result<Map<String, Object>> updateProgress(@Valid @RequestBody ProgressUpdateDTO dto) {
        Map<String, Object> result = studyService.updateProgress(dto);
        return Result.success("进度更新成功", result);
    }

    @GetMapping("/continue")
    public Result<List<Map<String, Object>>> continueStudy() {
        Long userId = com.courselearning.util.SecurityUtils.getCurrentUserId();
        List<Map<String, Object>> result = studyService.getContinueStudyList(userId);
        return Result.success(result);
    }

    @GetMapping("/completion-rate")
    public Result<Map<String, Object>> completionRate(
            @RequestParam(defaultValue = "course") String dimension,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) Long userId) {
        Map<String, Object> result = studyService.getCompletionRate(dimension, courseId, userId);
        return Result.success(result);
    }

    @PostMapping("/check-in")
    public Result<Map<String, Object>> checkIn(@RequestBody(required = false) CheckInDTO dto) {
        LocalDate checkDate = dto != null ? dto.getCheckDate() : null;
        Integer studyDuration = dto != null ? dto.getStudyDuration() : null;
        Long courseId = dto != null ? dto.getCourseId() : null;
        String remark = dto != null ? dto.getRemark() : null;
        Map<String, Object> result = studyService.checkIn(checkDate, studyDuration, courseId, remark);
        return Result.success("打卡成功", result);
    }

    @GetMapping("/checkin-list")
    public Result<List<CheckIn>> checkInList(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<CheckIn> result = studyService.getCheckInList(startDate, endDate);
        return Result.success(result);
    }
}
