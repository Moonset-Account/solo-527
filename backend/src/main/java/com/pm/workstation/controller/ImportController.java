package com.pm.workstation.controller;

import com.pm.workstation.dto.ApiResponseDTO;
import com.pm.workstation.dto.ImportResultDTO;
import com.pm.workstation.entity.ImportError;
import com.pm.workstation.service.ImportService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/imports")
public class ImportController {

    @Autowired
    private ImportService importService;

    @PostMapping("/requirements")
    public ApiResponseDTO<ImportResultDTO> batchImportRequirements(@RequestParam("file") MultipartFile file) {
        return ApiResponseDTO.success(importService.batchImportRequirements(file));
    }

    @PostMapping("/batch-approve")
    public ApiResponseDTO<Void> batchApproveWithValidation(@RequestBody List<Long> ids) {
        importService.batchApproveWithValidation(ids);
        return ApiResponseDTO.success(null);
    }

    @GetMapping("/errors/{batchNo}")
    public ApiResponseDTO<List<ImportError>> getImportErrors(@PathVariable String batchNo) {
        return ApiResponseDTO.success(importService.getImportErrors(batchNo));
    }

    @GetMapping("/errors/{batchNo}/download")
    public ResponseEntity<byte[]> downloadErrorTemplate(@PathVariable String batchNo) {
        byte[] data = importService.downloadErrorTemplate(batchNo);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=import_errors.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(data);
    }
}
