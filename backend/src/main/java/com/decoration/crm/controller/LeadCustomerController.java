package com.decoration.crm.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.decoration.crm.dto.PageQuery;
import com.decoration.crm.dto.Result;
import com.decoration.crm.entity.LeadCustomer;
import com.decoration.crm.entity.LeadTag;
import com.decoration.crm.service.LeadCustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/leads")
public class LeadCustomerController {

    @Autowired
    private LeadCustomerService leadCustomerService;

    @GetMapping
    public Result<IPage<LeadCustomer>> getPage(PageQuery query) {
        return Result.success(leadCustomerService.getPage(query));
    }

    @GetMapping("/{id}")
    public Result<LeadCustomer> getById(@PathVariable Long id) {
        return Result.success(leadCustomerService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SALES','MANAGER')")
    public Result<LeadCustomer> create(@RequestBody LeadCustomer lead) {
        return Result.success(leadCustomerService.create(lead));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SALES','MANAGER')")
    public Result<LeadCustomer> update(@PathVariable Long id, @RequestBody LeadCustomer lead) {
        return Result.success(leadCustomerService.update(id, lead));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Result<Void> delete(@PathVariable Long id) {
        leadCustomerService.delete(id);
        return Result.success();
    }

    @PutMapping("/{id}/owner")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Result<Void> assignOwner(@PathVariable Long id, @RequestBody Map<String, Long> body) {
        leadCustomerService.assignOwner(id, body.get("ownerId"));
        return Result.success();
    }

    @PutMapping("/{id}/level")
    @PreAuthorize("hasAnyRole('ADMIN','SALES','MANAGER')")
    public Result<Void> updateLevel(@PathVariable Long id, @RequestBody Map<String, String> body) {
        leadCustomerService.updateLevel(id, body.get("level"));
        return Result.success();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','SALES','MANAGER')")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        leadCustomerService.updateStatus(id, body.get("status"));
        return Result.success();
    }

    @GetMapping("/{id}/tags")
    public Result<List<LeadTag>> getTags(@PathVariable Long id) {
        return Result.success(leadCustomerService.getTags(id));
    }

    @PostMapping("/{id}/tags")
    @PreAuthorize("hasAnyRole('ADMIN','SALES','MANAGER')")
    public Result<Void> addTags(@PathVariable Long id, @RequestBody Map<String, List<Long>> body) {
        leadCustomerService.addTags(id, body.get("tagIds"));
        return Result.success();
    }

    @DeleteMapping("/{id}/tags")
    @PreAuthorize("hasAnyRole('ADMIN','SALES','MANAGER')")
    public Result<Void> removeTags(@PathVariable Long id, @RequestBody Map<String, List<Long>> body) {
        leadCustomerService.removeTags(id, body.get("tagIds"));
        return Result.success();
    }

    @PostMapping("/{id}/claim")
    @PreAuthorize("hasAnyRole('ADMIN','SALES','MANAGER')")
    public Result<Void> claimFromPublicSea(@PathVariable Long id) {
        leadCustomerService.claimFromPublicSea(id);
        return Result.success();
    }

    @PostMapping("/{id}/release")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Result<Void> releaseToPublicSea(@PathVariable Long id) {
        leadCustomerService.releaseToPublicSea(id);
        return Result.success();
    }

    @PostMapping("/{id}/lost")
    @PreAuthorize("hasAnyRole('ADMIN','SALES','MANAGER')")
    public Result<Void> markLost(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long lostReasonId = body.get("lostReasonId") != null ? Long.valueOf(body.get("lostReasonId").toString()) : null;
        String remark = body.get("remark") != null ? body.get("remark").toString() : null;
        leadCustomerService.markLost(id, lostReasonId, remark);
        return Result.success();
    }
}
