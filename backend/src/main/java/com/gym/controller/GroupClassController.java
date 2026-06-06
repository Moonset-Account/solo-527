package com.gym.controller;

import com.gym.common.ApiResponse;
import com.gym.entity.GroupClass;
import com.gym.service.GroupClassService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/group-classes")
@RequiredArgsConstructor
public class GroupClassController {

    private final GroupClassService groupClassService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ApiResponse<GroupClass> createClass(@RequestBody GroupClass groupClass) {
        return ApiResponse.success(groupClassService.createGroupClass(groupClass));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ApiResponse<GroupClass> updateClass(@PathVariable Long id, @RequestBody GroupClass groupClass) {
        return ApiResponse.success(groupClassService.updateGroupClass(id, groupClass));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ApiResponse<GroupClass> cancelClass(@PathVariable Long id) {
        return ApiResponse.success(groupClassService.cancelClass(id));
    }

    @GetMapping
    public ApiResponse<List<GroupClass>> getClasses(@RequestParam(required = false) String status) {
        return ApiResponse.success(groupClassService.getAllClasses(status));
    }

    @GetMapping("/{id}")
    public ApiResponse<GroupClass> getClassById(@PathVariable Long id) {
        return ApiResponse.success(groupClassService.getClassById(id));
    }

    @GetMapping("/date/{date}")
    public ApiResponse<List<GroupClass>> getClassesByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.success(groupClassService.getClassesByDate(date));
    }

    @GetMapping("/range")
    public ApiResponse<List<GroupClass>> getClassesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ApiResponse.success(groupClassService.getClassesByDateRange(startDate, endDate));
    }

    @GetMapping("/coach/{coachId}")
    public ApiResponse<List<GroupClass>> getClassesByCoach(@PathVariable Long coachId) {
        return ApiResponse.success(groupClassService.getClassesByCoach(coachId));
    }

    @GetMapping("/coach/{coachId}/range")
    public ApiResponse<List<GroupClass>> getCoachClassesInRange(
            @PathVariable Long coachId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ApiResponse.success(groupClassService.getCoachClassesInRange(coachId, startDate, endDate));
    }
}
