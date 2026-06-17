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

    @PostMapping(value = "/requirements", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<?> exportRequirements(
            @RequestBody RequirementQueryDTO query,
            @RequestParam(defaultValue = "true") boolean checkDuplicate) {
        try {
            byte[] data = exportService.exportRequirements(query, checkDuplicate);

            String fileName = "需求导出_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".xlsx";
            String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedFileName)
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .contentLength(data.length)
                    .body(data);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(ApiResponse.error(400, e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(ApiResponse.error(500, "导出失败: " + e.getMessage()));
        }
    }

    @PostMapping(value = "/requirements/batch", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<?> exportRequirementsByIds(@RequestBody List<Long> ids) {
        try {
            byte[] data = exportService.exportRequirementsByIds(ids);

            String fileName = "需求批量导出_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".xlsx";
            String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedFileName)
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .contentLength(data.length)
                    .body(data);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(ApiResponse.error(400, e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(ApiResponse.error(500, "导出失败: " + e.getMessage()));
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
