package com.emailgenerator.controller;

import com.emailgenerator.common.BaseQuery;
import com.emailgenerator.service.ExportService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/export")
public class ExportController {

    private final ExportService exportService;

    public ExportController(ExportService exportService) {
        this.exportService = exportService;
    }

    @GetMapping("/email-records")
    public void exportEmailRecords(BaseQuery query, HttpServletResponse response) throws IOException {
        String operator = "admin";
        exportService.exportEmailRecords(query, response, operator);
    }

    @GetMapping("/risk-samples")
    public void exportRiskSamples(BaseQuery query, HttpServletResponse response) throws IOException {
        String operator = "admin";
        exportService.exportRiskSamples(query, response, operator);
    }
}
