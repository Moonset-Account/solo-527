package com.ceramic.kiln.controller;

import com.ceramic.kiln.dto.ApiResponse;
import com.ceramic.kiln.entity.*;
import com.ceramic.kiln.service.MasterDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/master-data")
@RequiredArgsConstructor
@PreAuthorize("hasRole('INTERNAL')")
public class MasterDataController {

    private final MasterDataService masterDataService;

    @GetMapping("/clays")
    public ApiResponse<List<Clay>> getClays() {
        return ApiResponse.success(masterDataService.getAllClays());
    }

    @GetMapping("/glazes")
    public ApiResponse<List<Glaze>> getGlazes() {
        return ApiResponse.success(masterDataService.getAllGlazes());
    }

    @GetMapping("/firing-curves")
    public ApiResponse<List<FiringCurve>> getFiringCurves(
            @RequestParam(required = false) String temperatureZone) {
        if (temperatureZone != null) {
            return ApiResponse.success(masterDataService.getFiringCurvesByTemperatureZone(temperatureZone));
        }
        return ApiResponse.success(masterDataService.getAllFiringCurves());
    }

    @GetMapping("/kilns")
    public ApiResponse<List<Kiln>> getKilns(
            @RequestParam(required = false) String temperatureZone) {
        if (temperatureZone != null) {
            return ApiResponse.success(masterDataService.getKilnsByTemperatureZone(temperatureZone));
        }
        return ApiResponse.success(masterDataService.getAllKilns());
    }

    @GetMapping("/students")
    public ApiResponse<List<Student>> getStudents() {
        return ApiResponse.success(masterDataService.getAllStudents());
    }
}
