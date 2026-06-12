package com.energy.controller;

import com.energy.common.Result;
import com.energy.dto.ExportQueryDTO;
import com.energy.entity.ExportHistory;
import com.energy.service.ExportHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/exports")
@RequiredArgsConstructor
public class ExportHistoryController {

    private final ExportHistoryService exportHistoryService;

    @PostMapping("/search")
    public Result<Page<ExportHistory>> search(@RequestBody ExportQueryDTO dto) {
        return Result.success(exportHistoryService.search(dto));
    }

    @GetMapping("/{id}")
    public Result<ExportHistory> getById(@PathVariable Long id) {
        return Result.success(exportHistoryService.getById(id));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> download(@PathVariable Long id) {
        byte[] data = exportHistoryService.downloadFile(id);
        ExportHistory history = exportHistoryService.getById(id);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv;charset=UTF-8"));
        String encodedName = URLEncoder.encode(history.getFileName(), StandardCharsets.UTF_8);
        headers.setContentDispositionFormData("attachment", encodedName);
        return ResponseEntity.ok().headers(headers).body(data);
    }
}
