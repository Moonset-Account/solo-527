package com.carcore.admin.service;

import com.carcore.admin.common.BusinessException;
import com.carcore.admin.common.CodeGenerator;
import com.carcore.admin.common.PageResult;
import com.carcore.admin.entity.MemberPackage;
import com.carcore.admin.entity.PackageBenefit;
import com.carcore.admin.repository.DetectionRecordRepository;
import com.carcore.admin.repository.MemberPackageRepository;
import com.carcore.admin.repository.PackageBenefitRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MemberPackageService {

    private final MemberPackageRepository memberPackageRepository;
    private final PackageBenefitRepository packageBenefitRepository;
    private final DetectionRecordRepository detectionRecordRepository;
    private final CodeGenerator codeGenerator;

    public MemberPackageService(MemberPackageRepository memberPackageRepository, PackageBenefitRepository packageBenefitRepository, DetectionRecordRepository detectionRecordRepository, CodeGenerator codeGenerator) {
        this.memberPackageRepository = memberPackageRepository;
        this.packageBenefitRepository = packageBenefitRepository;
        this.detectionRecordRepository = detectionRecordRepository;
        this.codeGenerator = codeGenerator;
    }

    @Cacheable(value = "memberPackage", key = "#id", unless = "#result == null")
    public MemberPackage getById(Long id) {
        MemberPackage pkg = memberPackageRepository.findById(id)
                .orElseThrow(() -> new BusinessException("套餐不存在"));
        enrichPackage(pkg);
        return pkg;
    }

    @Cacheable(value = "memberPackage", key = "#packageCode", unless = "#result == null")
    public MemberPackage getByPackageCode(String packageCode) {
        MemberPackage pkg = memberPackageRepository.findByPackageCode(packageCode)
                .orElseThrow(() -> new BusinessException("套餐不存在"));
        enrichPackage(pkg);
        return pkg;
    }

    @Cacheable(value = "memberPackage", key = "'enabled'", unless = "#result == null || #result.size() == 0")
    public List<MemberPackage> getEnabledPackages() {
        List<MemberPackage> packages = memberPackageRepository.findByStatus(1);
        packages.forEach(this::enrichPackage);
        return packages;
    }

    @Cacheable(value = "packageBenefit", key = "#packageId", unless = "#result == null || #result.size() == 0")
    public List<PackageBenefit> getPackageBenefits(Long packageId) {
        return packageBenefitRepository.findByPackageIdOrderBySortOrderAsc(packageId);
    }

    public PageResult<MemberPackage> page(String keyword, String packageType, Integer status,
                                           int pageNum, int pageSize) {
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize, Sort.by(Sort.Direction.DESC, "createTime"));
        Page<MemberPackage> page = memberPackageRepository.findByConditions(
                keyword, packageType, status, pageable);
        
        List<MemberPackage> packages = page.getContent();
        packages.forEach(this::enrichPackage);
        
        return PageResult.of(packages, page.getTotalElements(), pageNum, pageSize);
    }

    @Transactional
    @CacheEvict(value = {"memberPackage", "packageBenefit"}, allEntries = true)
    public MemberPackage create(MemberPackage pkg, List<PackageBenefit> benefits) {
        pkg.setPackageCode(codeGenerator.generatePackageCode());
        pkg.setStatus(0);
        MemberPackage saved = memberPackageRepository.save(pkg);
        
        if (benefits != null && !benefits.isEmpty()) {
            for (int i = 0; i < benefits.size(); i++) {
                PackageBenefit benefit = benefits.get(i);
                benefit.setPackageId(saved.getId());
                benefit.setSortOrder(i);
                packageBenefitRepository.save(benefit);
            }
        }
        
        return saved;
    }

    @Transactional
    @CacheEvict(value = {"memberPackage", "packageBenefit"}, allEntries = true)
    public MemberPackage update(MemberPackage pkg, List<PackageBenefit> benefits) {
        MemberPackage existing = getById(pkg.getId());
        existing.setPackageName(pkg.getPackageName());
        existing.setPackageType(pkg.getPackageType());
        existing.setOriginalPrice(pkg.getOriginalPrice());
        existing.setPackagePrice(pkg.getPackagePrice());
        existing.setValidDays(pkg.getValidDays());
        existing.setMaxUsage(pkg.getMaxUsage());
        existing.setDescription(pkg.getDescription());
        existing.setSourceDetectionRecordId(pkg.getSourceDetectionRecordId());
        
        MemberPackage saved = memberPackageRepository.save(existing);
        
        packageBenefitRepository.deleteByPackageId(saved.getId());
        if (benefits != null && !benefits.isEmpty()) {
            for (int i = 0; i < benefits.size(); i++) {
                PackageBenefit benefit = benefits.get(i);
                benefit.setPackageId(saved.getId());
                benefit.setSortOrder(i);
                benefit.setId(null);
                packageBenefitRepository.save(benefit);
            }
        }
        
        return saved;
    }

    @Transactional
    @CacheEvict(value = "memberPackage", allEntries = true)
    public void toggleStatus(Long id) {
        MemberPackage pkg = getById(id);
        pkg.setStatus(pkg.getStatus() == 1 ? 0 : 1);
        memberPackageRepository.save(pkg);
    }

    @Transactional
    @CacheEvict(value = {"memberPackage", "packageBenefit"}, allEntries = true)
    public void delete(Long id) {
        MemberPackage pkg = getById(id);
        if (pkg.getStatus() == 1) {
            throw new BusinessException("已上架的套餐不能删除，请先下架");
        }
        packageBenefitRepository.deleteByPackageId(id);
        memberPackageRepository.delete(pkg);
    }

    private void enrichPackage(MemberPackage pkg) {
        pkg.setBenefits(packageBenefitRepository.findByPackageIdOrderBySortOrderAsc(pkg.getId()));
        if (pkg.getSourceDetectionRecordId() != null) {
            detectionRecordRepository.findById(pkg.getSourceDetectionRecordId())
                    .ifPresent(r -> pkg.setSourceDetectionRecordNo(r.getRecordNo()));
        }
    }
}
