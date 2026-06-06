package com.gym.controller;

import com.gym.common.ApiResponse;
import com.gym.entity.BodyMeasurement;
import com.gym.service.BodyMeasurementService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/measurements")
public class BodyMeasurementController {

    private final BodyMeasurementService bodyMeasurementService;

    public BodyMeasurementController(BodyMeasurementService bodyMeasurementService) {
        this.bodyMeasurementService = bodyMeasurementService;
    }

    @PostMapping
    public ApiResponse<BodyMeasurement> createMeasurement(@RequestBody BodyMeasurement measurement) {
        return ApiResponse.success(bodyMeasurementService.createMeasurement(measurement));
    }

    @PutMapping("/{id}")
    public ApiResponse<BodyMeasurement> updateMeasurement(@PathVariable Long id, @RequestBody BodyMeasurement measurement) {
        return ApiResponse.success(bodyMeasurementService.updateMeasurement(id, measurement));
    }

    @GetMapping("/{id}")
    public ApiResponse<BodyMeasurement> getMeasurementById(@PathVariable Long id) {
        return ApiResponse.success(bodyMeasurementService.getMeasurementById(id));
    }

    @GetMapping("/member/{memberId}")
    public ApiResponse<List<BodyMeasurement>> getMeasurementsByMember(@PathVariable Long memberId) {
        return ApiResponse.success(bodyMeasurementService.getMeasurementsByMember(memberId));
    }

    @GetMapping("/member/{memberId}/range")
    public ApiResponse<List<BodyMeasurement>> getMeasurementsByMemberAndDateRange(
            @PathVariable Long memberId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ApiResponse.success(bodyMeasurementService.getMeasurementsByMemberAndDateRange(memberId, startDate, endDate));
    }
}
