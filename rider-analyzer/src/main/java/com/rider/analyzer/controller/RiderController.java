package com.rider.analyzer.controller;

import com.rider.analyzer.common.Result;
import com.rider.analyzer.entity.Rider;
import com.rider.analyzer.service.RiderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/riders")
@RequiredArgsConstructor
public class RiderController {

    private final RiderService riderService;

    @GetMapping("/list")
    public Result<List<Rider>> getRiderList(
            @RequestParam(required = false) Long stationId,
            @RequestParam(required = false) String status) {
        return Result.success(riderService.getRiderList(stationId, status));
    }

    @GetMapping("/{id}")
    public Result<Rider> getRiderById(@PathVariable Long id) {
        return Result.success(riderService.getRiderById(id));
    }
}
