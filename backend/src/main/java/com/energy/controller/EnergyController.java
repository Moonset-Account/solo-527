package com.energy.controller;

import com.energy.common.Result;
import com.energy.dto.EnergyDataPoint;
import com.energy.dto.EnergyQueryDTO;
import com.energy.entity.MeterReading;
import com.energy.service.EnergyService;
import com.energy.service.ExportHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/energy")
@RequiredArgsConstructor
public class EnergyController {

    private final EnergyService energyService;
    private final ExportHistoryService exportHistoryService;

    @PostMapping("/curve")
    public Result<List<EnergyDataPoint>> getCurve(@RequestBody EnergyQueryDTO dto) {
        return Result.success(energyService.getEnergyCurve(dto));
    }

    @PostMapping("/peaks")
    public Result<List<EnergyDataPoint>> getPeaks(@RequestBody EnergyQueryDTO dto) {
        return Result.success(energyService.getPeakAnalysis(dto));
    }

    @PostMapping("/validate")
    public Result<List<MeterReading>> validate(@RequestBody EnergyQueryDTO dto) {
        return Result.success(energyService.validateReadings(dto));
    }

    @PostMapping("/export")
    public ResponseEntity<byte[]> exportPeaks(@RequestBody EnergyQueryDTO dto) {
        byte[] data = energyService.exportPeakByArea(dto);
        String fileName = "peak_export_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".csv";
        exportHistoryService.recordExport("PEAK", fileName, "admin", dto.getArea(), dto, data.length);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv;charset=UTF-8"));
        headers.setContentDispositionFormData("attachment", URLEncoder.encode(fileName, StandardCharsets.UTF_8));
        return ResponseEntity.ok().headers(headers).body(data);
    }

    @GetMapping("/dashboard")
    public Result<Map<String, Object>> getDashboard() {
        return Result.success(energyService.getDashboardStats());
    }

    @GetMapping("/areas")
    public Result<List<String>> getAreas() {
        return Result.success(energyService.getAllAreas());
    }
}
