package com.rider.analyzer.controller;

import com.rider.analyzer.common.Result;
import com.rider.analyzer.dto.BatchImportResultVO;
import com.rider.analyzer.dto.PageResult;
import com.rider.analyzer.entity.BatchImportRecord;
import com.rider.analyzer.service.BatchImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;

@RestController
@RequestMapping("/api/batch")
@RequiredArgsConstructor
public class BatchImportController {

    private final BatchImportService batchImportService;

    @PostMapping("/import")
    public Result<BatchImportResultVO> importWithValidation(
            @RequestParam String type,
            @RequestParam("file") MultipartFile file) {
        return Result.success(batchImportService.importWithValidation(type, file));
    }

    @PostMapping("/approve")
    public Result<BatchImportRecord> approve(
            @RequestParam String batchNo,
            @RequestParam boolean approved) {
        return Result.success(batchImportService.approve(batchNo, approved));
    }

    @GetMapping("/list")
    public Result<PageResult<BatchImportRecord>> getBatchList(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        return Result.success(batchImportService.getBatchList(status, page, pageSize));
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
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(resource);
    }
}
