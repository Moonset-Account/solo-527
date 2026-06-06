package com.gym.controller;

import com.gym.common.ApiResponse;
import com.gym.entity.Coach;
import com.gym.service.CoachService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/coaches")
@RequiredArgsConstructor
public class CoachController {

    private final CoachService coachService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Coach> createCoach(@RequestBody Coach coach) {
        return ApiResponse.success(coachService.createCoach(coach));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ApiResponse<Coach> updateCoach(@PathVariable Long id, @RequestBody Coach coach) {
        return ApiResponse.success(coachService.updateCoach(id, coach));
    }

    @GetMapping
    public ApiResponse<List<Coach>> getCoaches(@RequestParam(required = false) String specialty) {
        return ApiResponse.success(coachService.getAllCoaches(specialty));
    }

    @GetMapping("/{id}")
    public ApiResponse<Coach> getCoachById(@PathVariable Long id) {
        return ApiResponse.success(coachService.getCoachById(id));
    }

    @GetMapping("/user/{userId}")
    public ApiResponse<Coach> getCoachByUserId(@PathVariable Long userId) {
        return ApiResponse.success(coachService.getCoachByUserId(userId));
    }
}
