package com.property.service;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.property.common.Result;
import com.property.common.UserContext;
import com.property.common.enums.UserRoleEnum;
import com.property.common.enums.WorkOrderStatusEnum;
import com.property.entity.*;
import com.property.mapper.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class SatisfactionService {

    @Autowired
    private SatisfactionMapper satisfactionMapper;

    @Autowired
    private WorkOrderMapper workOrderMapper;

    @Autowired
    private OwnerMapper ownerMapper;

    @Autowired
    private SysUserMapper sysUserMapper;

    @Transactional(rollbackFor = Exception.class)
    public Result<Satisfaction> submitSatisfaction(Long workOrderId, Integer overallScore,
                                                    Integer responseSpeedScore, Integer serviceAttitudeScore,
                                                    Integer qualityScore, String content, Integer isSolved) {
        SysUser currentUser = UserContext.getUser();

        WorkOrder order = workOrderMapper.selectById(workOrderId);
        if (order == null) {
            return Result.validateError("工单不存在");
        }

        if (!WorkOrderStatusEnum.COMPLETED.getCode().equals(order.getStatus())
                && !WorkOrderStatusEnum.CLOSED.getCode().equals(order.getStatus())) {
            return Result.validateError("只有已完成的工单才能评价");
        }

        Long ownerId = null;
        if (UserRoleEnum.OWNER.getCode().equals(currentUser.getRole())) {
            Owner owner = ownerMapper.selectOne(
                    new LambdaQueryWrapper<Owner>().eq(Owner::getUserId, currentUser.getId())
            );
            if (owner != null) {
                ownerId = owner.getId();
            }

            if (ownerId == null || !ownerId.equals(order.getOwnerId())) {
                return Result.forbidden("您不是该工单的业主，无法评价");
            }
        }

        Satisfaction existing = satisfactionMapper.selectOne(
                new LambdaQueryWrapper<Satisfaction>().eq(Satisfaction::getWorkOrderId, workOrderId)
        );
        if (existing != null) {
            return Result.validateError("该工单已评价过，请勿重复评价");
        }

        Satisfaction satisfaction = new Satisfaction();
        satisfaction.setWorkOrderId(workOrderId);
        satisfaction.setOwnerId(ownerId != null ? ownerId : order.getOwnerId());
        satisfaction.setOverallScore(overallScore);
        satisfaction.setResponseSpeedScore(responseSpeedScore);
        satisfaction.setServiceAttitudeScore(serviceAttitudeScore);
        satisfaction.setQualityScore(qualityScore);
        satisfaction.setContent(content);
        satisfaction.setIsSolved(isSolved != null ? isSolved : 1);

        satisfactionMapper.insert(satisfaction);

        log.info("满意度评价提交成功: workOrderId={}, score={}", workOrderId, overallScore);

        return Result.success("评价提交成功", satisfaction);
    }

    public IPage<Satisfaction> getSatisfactionPage(int page, int size, Integer minScore, Long ownerId) {
        LambdaQueryWrapper<Satisfaction> wrapper = new LambdaQueryWrapper<>();

        if (minScore != null) {
            wrapper.ge(Satisfaction::getOverallScore, minScore);
        }
        if (ownerId != null) {
            wrapper.eq(Satisfaction::getOwnerId, ownerId);
        }

        wrapper.orderByDesc(Satisfaction::getCreatedAt);

        Page<Satisfaction> pageParam = new Page<>(page, size);
        IPage<Satisfaction> result = satisfactionMapper.selectPage(pageParam, wrapper);

        result.getRecords().forEach(this::fillSatisfactionInfo);
        result.getRecords().forEach(this::filterSensitiveFields);

        return result;
    }

    private void fillSatisfactionInfo(Satisfaction satisfaction) {
        if (satisfaction.getWorkOrderId() != null) {
            WorkOrder order = workOrderMapper.selectById(satisfaction.getWorkOrderId());
            if (order != null) {
                satisfaction.setOrderNo(order.getOrderNo());
            }
        }

        if (satisfaction.getOwnerId() != null) {
            Owner owner = ownerMapper.selectById(satisfaction.getOwnerId());
            if (owner != null) {
                SysUser user = sysUserMapper.selectById(owner.getUserId());
                if (user != null) {
                    satisfaction.setOwnerName(user.getRealName());
                }
            }
        }
    }

    private void filterSensitiveFields(Satisfaction satisfaction) {
        SysUser currentUser = UserContext.getUser();
        if (currentUser == null) return;

        String role = currentUser.getRole();

        if (UserRoleEnum.OWNER.getCode().equals(role)) {
            if (!satisfaction.getOwnerName().equals(currentUser.getRealName())) {
                satisfaction.setOwnerName("***");
            }
        }
    }
}
