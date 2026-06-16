package com.rider.analyzer.controller;

import com.rider.analyzer.common.Result;
import com.rider.analyzer.entity.Station;
import com.rider.analyzer.entity.StationInventory;
import com.rider.analyzer.service.StationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stations")
@RequiredArgsConstructor
public class StationController {

    private final StationService stationService;

    @GetMapping
    public Result<List<Station>> getStationList() {
        return Result.success(stationService.getStationList());
    }

    @GetMapping("/{id}/inventory")
    public Result<List<StationInventory>> getStationInventory(@PathVariable Long id) {
        return Result.success(stationService.getStationInventory(id));
    }
}
