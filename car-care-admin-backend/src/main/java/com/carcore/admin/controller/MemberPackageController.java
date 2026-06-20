package com.carcore.admin.controller;

import com.carcore.admin.common.PageResult;
import com.carcore.admin.common.RequireRole;
import com.carcore.admin.common.Result;
import com.carcore.admin.entity.MemberPackage;
import com.carcore.admin.entity.PackageBenefit;
import com.carcore.admin.service.MemberPackageService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/member-packages")
public class MemberPackageController {

    private final MemberPackageService memberPackageService;

    public MemberPackageController(MemberPackageService memberPackageService) {
        this.memberPackageService = memberPackageService;
    }

    @GetMapping("/{id}")
    public Result<MemberPackage> getById(@PathVariable Long id) {
        return Result.success(memberPackageService.getById(id));
    }

    @GetMapping("/code/{packageCode}")
    public Result<MemberPackage> getByCode(@PathVariable String packageCode) {
        return Result.success(memberPackageService.getByPackageCode(packageCode));
    }

    @GetMapping("/enabled")
    public Result<List<MemberPackage>> getEnabledPackages() {
        return Result.success(memberPackageService.getEnabledPackages());
    }

    @GetMapping("/{id}/benefits")
    public Result<List<PackageBenefit>> getBenefits(@PathVariable Long id) {
        return Result.success(memberPackageService.getPackageBenefits(id));
    }

    @GetMapping("/page")
    public Result<PageResult<MemberPackage>> page(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String packageType,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        return Result.success(memberPackageService.page(
                keyword, packageType, status, pageNum, pageSize));
    }

    @PostMapping
    @RequireRole({"ADMIN", "BOSS"})
    public Result<MemberPackage> create(@RequestBody MemberPackageWithBenefits request) {
        return Result.success(memberPackageService.create(
                request.getPkg(), request.getBenefits()));
    }

    @PutMapping
    @RequireRole({"ADMIN", "BOSS"})
    public Result<MemberPackage> update(@RequestBody MemberPackageWithBenefits request) {
        return Result.success(memberPackageService.update(
                request.getPkg(), request.getBenefits()));
    }

    @PutMapping("/{id}/toggle-status")
    @RequireRole({"ADMIN", "BOSS"})
    public Result<Void> toggleStatus(@PathVariable Long id) {
        memberPackageService.toggleStatus(id);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    @RequireRole({"ADMIN", "BOSS"})
    public Result<Void> delete(@PathVariable Long id) {
        memberPackageService.delete(id);
        return Result.success();
    }

    public static class MemberPackageWithBenefits {
        private MemberPackage pkg;
        private List<PackageBenefit> benefits;

        public MemberPackage getPkg() {
            return pkg;
        }

        public void setPkg(MemberPackage pkg) {
            this.pkg = pkg;
        }

        public List<PackageBenefit> getBenefits() {
            return benefits;
        }

        public void setBenefits(List<PackageBenefit> benefits) {
            this.benefits = benefits;
        }
    }
}
