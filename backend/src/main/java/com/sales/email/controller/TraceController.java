package com.sales.email.controller;

import com.sales.email.common.Result;
import com.sales.email.dto.SourceOrderTraceDTO;
import com.sales.email.entity.PromptVersion;
import com.sales.email.service.PromptTemplateService;
import com.sales.email.service.TraceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/trace")
@RequiredArgsConstructor
public class TraceController {

    private final TraceService traceService;
    private final PromptTemplateService promptTemplateService;

    @GetMapping("/source-order/{sourceOrderNo}")
    public Result<SourceOrderTraceDTO> traceBySourceOrderNo(@PathVariable String sourceOrderNo) {
        return Result.success(traceService.traceBySourceOrderNo(sourceOrderNo));
    }

    @GetMapping("/prompt-versions")
    public Result<List<PromptVersion>> getPromptVersionsBySourceOrderNo(@RequestParam String sourceOrderNo) {
        return Result.success(promptTemplateService.getVersionsBySourceOrderNo(sourceOrderNo));
    }
}
