package com.energy.controller;

import com.energy.common.Result;
import com.energy.dto.EnergyDataPoint;
import com.energy.dto.EnergyQueryDTO;
import com.energy.entity.ExportHistory;
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
        String csvContent = energyService.generatePeakCsv(dto);
        String fileName = "peak_export_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".csv";
        List<EnergyDataPoint> peaks = energyService.getPeakAnalysis(dto);
        ExportHistory history = exportHistoryService.recordExport(
                "PEAK", fileName, csvContent, "admin", dto.getArea(), dto, peaks.size());
        byte[] data = csvContent.getBytes(StandardCharsets.UTF_8);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv;charset=UTF-8"));
        headers.set("X-Export-Id", String.valueOf(history.getId()));
        headers.set("X-Export-No", history.getExportNo());
        String encodedName = URLEncoder.encode(fileName, StandardCharsets.UTF_8);
        headers.setContentDispositionFormData("attachment", encodedName);
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
