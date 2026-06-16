package com.rider.analyzer.controller;

import com.rider.analyzer.common.Result;
import com.rider.analyzer.entity.BatchImportRecord;
import com.rider.analyzer.service.BatchImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;

@RestController
@RequestMapping("/api/batch")
@RequiredArgsConstructor
public class BatchImportController {

    private final BatchImportService batchImportService;

    @PostMapping("/import")
    public Result<BatchImportRecord> importWithValidation(
            @RequestParam String type,
            @RequestParam(required = false) Object file) {
        return Result.success(batchImportService.importWithValidation(type, file));
    }

    @PostMapping("/approve")
    public Result<BatchImportRecord> approve(@RequestParam String batchNo) {
        return Result.success(batchImportService.approve(batchNo));
    }

    @GetMapping("/errors/{batchNo}/download")
    public ResponseEntity<Resource> downloadErrors(@PathVariable String batchNo) {
        String errorFilePath = batchImportService.generateErrorFile(batchNo);
        File file = new File(errorFilePath);
        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }
        Resource resource = new FileSystemResource(file);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=errors_" + batchNo + ".csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(resource);
    }
}
