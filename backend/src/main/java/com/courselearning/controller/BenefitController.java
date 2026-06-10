package com.courselearning.controller;

import com.courselearning.common.Result;
import com.courselearning.entity.MemberBenefit;
import com.courselearning.service.BenefitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/benefit")
public class BenefitController {

    @Autowired
    private BenefitService benefitService;

    @GetMapping("/list")
    public Result<List<MemberBenefit>> list() {
        List<MemberBenefit> result = benefitService.getBenefitList();
        return Result.success(result);
    }

    @GetMapping("/user-benefits")
    public Result<Map<String, Object>> userBenefits() {
        Map<String, Object> result = benefitService.getUserBenefits();
        return Result.success(result);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<MemberBenefit> getById(@PathVariable Long id) {
        MemberBenefit benefit = benefitService.getBenefitById(id);
        return Result.success(benefit);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> create(@RequestBody MemberBenefit benefit) {
        benefitService.createBenefit(benefit);
        return Result.success("创建成功", null);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> update(@PathVariable Long id, @RequestBody MemberBenefit benefit) {
        benefitService.updateBenefit(id, benefit);
        return Result.success("更新成功", null);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> delete(@PathVariable Long id) {
        benefitService.deleteBenefit(id);
        return Result.success("删除成功", null);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        benefitService.updateBenefitStatus(id, status);
        return Result.success("状态更新成功", null);
    }
}
