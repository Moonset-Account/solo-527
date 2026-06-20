package com.carcore.admin.service;

import com.carcore.admin.common.BusinessException;
import com.carcore.admin.common.CodeGenerator;
import com.carcore.admin.common.PageResult;
import com.carcore.admin.entity.MemberPackage;
import com.carcore.admin.entity.MemberPackageOrder;
import com.carcore.admin.repository.MemberPackageOrderRepository;
import com.carcore.admin.repository.MemberPackageRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class MemberPackageOrderService {

    private final MemberPackageOrderRepository memberPackageOrderRepository;
    private final MemberPackageRepository memberPackageRepository;
    private final CodeGenerator codeGenerator;

    public MemberPackageOrderService(MemberPackageOrderRepository memberPackageOrderRepository,
                                     MemberPackageRepository memberPackageRepository,
                                     CodeGenerator codeGenerator) {
        this.memberPackageOrderRepository = memberPackageOrderRepository;
        this.memberPackageRepository = memberPackageRepository;
        this.codeGenerator = codeGenerator;
    }

    public MemberPackageOrder getById(Long id) {
        return memberPackageOrderRepository.findById(id)
                .orElseThrow(() -> new BusinessException("订单不存在"));
    }

    public MemberPackageOrder getByOrderNo(String orderNo) {
        return memberPackageOrderRepository.findByOrderNo(orderNo)
                .orElseThrow(() -> new BusinessException("订单不存在"));
    }

    public PageResult<MemberPackageOrder> page(String orderNo, Long memberId, Long packageId,
                                                Integer status, LocalDate startDate, LocalDate endDate,
                                                int pageNum, int pageSize) {
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize, Sort.by(Sort.Direction.DESC, "createTime"));
        Page<MemberPackageOrder> page = memberPackageOrderRepository.findByConditions(
                orderNo, memberId, packageId, status, startDate, endDate, pageable);
        return PageResult.of(page.getContent(), page.getTotalElements(), pageNum, pageSize);
    }

    @Transactional
    public MemberPackageOrder createOrder(MemberPackageOrder order) {
        MemberPackage pkg = memberPackageRepository.findById(order.getPackageId())
                .orElseThrow(() -> new BusinessException("套餐不存在"));

        order.setOrderNo(codeGenerator.generatePackageOrderNo());
        order.setStatus(1);
        order.setPackageName(pkg.getPackageName());
        order.setPackagePrice(pkg.getPackagePrice());
        order.setPurchaseDate(LocalDate.now());
        order.setValidStartDate(LocalDate.now());
        if (pkg.getValidDays() != null && pkg.getValidDays() > 0) {
            order.setValidEndDate(LocalDate.now().plusDays(pkg.getValidDays()));
        } else {
            order.setValidEndDate(LocalDate.now().plusYears(100));
        }
        order.setTotalUsage(pkg.getMaxUsage());
        order.setRemainingUsage(pkg.getMaxUsage());

        return memberPackageOrderRepository.save(order);
    }

    @Transactional
    public MemberPackageOrder useOrder(Long id) {
        MemberPackageOrder order = getById(id);
        if (order.getStatus() != 1) {
            throw new BusinessException("订单已失效或已用完，无法使用");
        }
        if (order.getRemainingUsage() == null || order.getRemainingUsage() <= 0) {
            throw new BusinessException("剩余次数不足");
        }
        order.setRemainingUsage(order.getRemainingUsage() - 1);
        if (order.getRemainingUsage() <= 0) {
            order.setStatus(2);
        }
        return memberPackageOrderRepository.save(order);
    }

    @Transactional
    public MemberPackageOrder expireOrder(Long id) {
        MemberPackageOrder order = getById(id);
        if (order.getStatus() == 0) {
            throw new BusinessException("订单已失效");
        }
        order.setStatus(0);
        return memberPackageOrderRepository.save(order);
    }
}
