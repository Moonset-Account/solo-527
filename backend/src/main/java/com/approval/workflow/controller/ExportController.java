package com.approval.workflow.controller;

import com.approval.workflow.dto.ApiResponse;
import com.approval.workflow.dto.RequirementQueryDTO;
import com.approval.workflow.service.ExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/export")
public class ExportController {

    private final ExportService exportService;

    public ExportController(ExportService exportService) {
        this.exportService = exportService;
    }

    @PostMapping("/requirements")
    public ResponseEntity<byte[]> exportRequirements(
            @RequestBody RequirementQueryDTO query,
            @RequestParam(defaultValue = "true") boolean checkDuplicate) {
        try {
            byte[] data = exportService.exportRequirements(query, checkDuplicate);

            String fileName = "需求导出_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".xlsx";
            String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedFileName)
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(data);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage().getBytes(StandardCharsets.UTF_8));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("导出失败".getBytes(StandardCharsets.UTF_8));
        }
    }

    @PostMapping("/requirements/batch")
    public ResponseEntity<byte[]> exportRequirementsByIds(@RequestBody List<Long> ids) {
        try {
            byte[] data = exportService.exportRequirementsByIds(ids);

            String fileName = "需求批量导出_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".xlsx";
            String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedFileName)
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(data);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage().getBytes(StandardCharsets.UTF_8));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("导出失败".getBytes(StandardCharsets.UTF_8));
        }
    }

    @PostMapping("/check-duplicate")
    public ApiResponse<Map<String, Object>> checkDuplicateExport(@RequestBody RequirementQueryDTO query) {
        String exportKey = exportService.generateExportKey(query);
        boolean hasExported = exportService.hasExported(exportKey);
        String exportInfo = exportService.getExportInfo(exportKey);

        return ApiResponse.success(Map.of(
                "hasExported", hasExported,
                "exportInfo", exportInfo,
                "exportKey", exportKey
        ));
    }
}
