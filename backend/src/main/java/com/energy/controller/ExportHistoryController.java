package com.energy.controller;

import com.energy.common.Result;
import com.energy.dto.ExportQueryDTO;
import com.energy.entity.ExportHistory;
import com.energy.service.ExportHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

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
        return null;
    }
}
