package com.decoration.crm.controller;

import com.decoration.crm.dto.Result;
import com.decoration.crm.entity.QuotationVersion;
import com.decoration.crm.service.QuotationVersionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/quotations")
public class QuotationVersionController {

    @Autowired
    private QuotationVersionService quotationVersionService;

    @GetMapping("/lead/{leadId}")
    public Result<List<QuotationVersion>> getByLeadId(@PathVariable Long leadId) {
        return Result.success(quotationVersionService.getByLeadId(leadId));
    }

    @GetMapping("/{id}")
    public Result<QuotationVersion> getById(@PathVariable Long id) {
        return Result.success(quotationVersionService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SALES','DESIGNER','MANAGER')")
    public Result<QuotationVersion> create(@RequestBody QuotationVersion quotation) {
        return Result.success(quotationVersionService.create(quotation));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SALES','DESIGNER','MANAGER')")
    public Result<QuotationVersion> update(@PathVariable Long id, @RequestBody QuotationVersion quotation) {
        return Result.success(quotationVersionService.update(id, quotation));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Result<Void> delete(@PathVariable Long id) {
        quotationVersionService.delete(id);
        return Result.success();
    }

    @PutMapping("/{id}/current")
    @PreAuthorize("hasAnyRole('ADMIN','SALES','MANAGER')")
    public Result<Void> setCurrent(@PathVariable Long id) {
        quotationVersionService.setCurrent(id);
        return Result.success();
    }
}
