package com.decoration.cooperation.controller;

import com.decoration.cooperation.common.PageQuery;
import com.decoration.cooperation.common.PageResult;
import com.decoration.cooperation.common.Result;
import com.decoration.cooperation.entity.BizContract;
import com.decoration.cooperation.service.ContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/contracts")
@RequiredArgsConstructor
public class ContractController {

    private final ContractService contractService;

    @GetMapping
    @PreAuthorize("hasAuthority('contract:list')")
    public Result<PageResult<BizContract>> page(PageQuery query) {
        return Result.success(contractService.page(query));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('contract:list')")
    public Result<BizContract> getById(@PathVariable Long id) {
        return Result.success(contractService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('contract:create')")
    public Result<Long> create(@RequestBody BizContract contract) {
        return Result.success(contractService.create(contract));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('contract:update')")
    public Result<Void> update(@PathVariable Long id, @RequestBody BizContract contract) {
        contractService.update(id, contract);
        return Result.success();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAuthority('contract:update')")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestParam String status) {
        contractService.updateStatus(id, status);
        return Result.success();
    }
}
