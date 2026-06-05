package com.property.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.property.common.Result;
import com.property.entity.InspectionPoint;
import com.property.entity.InspectionRecord;
import com.property.service.InspectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/inspection")
public class InspectionController {

    @Autowired
    private InspectionService inspectionService;

    @PostMapping("/checkin")
    public Result<InspectionRecord> checkIn(
            @RequestParam Long pointId,
            @RequestParam(defaultValue = "NORMAL") String status,
            @RequestParam(required = false) String abnormalDescription,
            @RequestParam(required = false) BigDecimal lng,
            @RequestParam(required = false) BigDecimal lat) {
        return inspectionService.checkIn(pointId, status, abnormalDescription, lng, lat);
    }

    @PostMapping("/records/{id}/handle")
    public Result<InspectionRecord> handleAbnormal(
            @PathVariable Long id,
            @RequestParam String handleRemark,
            @RequestParam(defaultValue = "false") boolean createOrder) {
        return inspectionService.handleAbnormal(id, handleRemark, createOrder);
    }

    @GetMapping("/records")
    public Result<IPage<InspectionRecord>> getRecordPage(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long pointId) {
        return Result.success(inspectionService.getRecordPage(page, size, status, pointId));
    }

    @GetMapping("/points")
    public Result<IPage<InspectionPoint>> getPointPage(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category) {
        return Result.success(inspectionService.getPointPage(page, size, keyword, category));
    }
}
