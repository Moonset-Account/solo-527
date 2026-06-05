package com.property.service;

import cn.hutool.core.date.DateUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.property.common.Result;
import com.property.common.UserContext;
import com.property.common.enums.UserRoleEnum;
import com.property.entity.*;
import com.property.mapper.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;


@Service
public class InspectionService {

    private static final Logger log = LoggerFactory.getLogger(InspectionService.class);

    @Autowired
    private InspectionRecordMapper inspectionRecordMapper;

    @Autowired
    private InspectionPointMapper inspectionPointMapper;

    @Autowired
    private SysUserMapper sysUserMapper;

    @Autowired
    private WorkOrderMapper workOrderMapper;

    @Autowired
    private MessageService messageService;

    @Transactional(rollbackFor = Exception.class)
    public Result<InspectionRecord> checkIn(Long pointId, String status, String abnormalDescription,
                                            java.math.BigDecimal lng, java.math.BigDecimal lat) {
        SysUser currentUser = UserContext.getUser();

        if (!UserRoleEnum.INSPECTOR.getCode().equals(currentUser.getRole())) {
            return Result.forbidden("只有巡检人员可以打卡");
        }

        InspectionPoint point = inspectionPointMapper.selectById(pointId);
        if (point == null) {
            return Result.validateError("巡检点不存在");
        }

        if (point.getStatus() != 1) {
            return Result.validateError("该巡检点已停用");
        }

        InspectionRecord record = new InspectionRecord();
        record.setRecordNo(generateRecordNo());
        record.setPointId(pointId);
        record.setInspectorId(currentUser.getId());
        record.setCheckTime(LocalDateTime.now());
        record.setStatus(status != null ? status : "NORMAL");
        record.setAbnormalDescription(abnormalDescription);
        record.setIsHandled("NORMAL".equals(status) ? 1 : 0);
        record.setLocationLng(lng);
        record.setLocationLat(lat);

        inspectionRecordMapper.insert(record);

        if ("ABNORMAL".equals(status)) {
            messageService.sendMessageToAdmins(
                    com.property.common.enums.MessageTypeEnum.SYSTEM_NOTICE,
                    "巡检异常提醒",
                    "巡检点 [" + point.getPointName() + "] 发现异常：" + abnormalDescription,
                    null
            );
        }

        log.info("巡检打卡成功: pointId={}, inspector={}, status={}", pointId, currentUser.getRealName(), status);

        return Result.success("打卡成功", record);
    }

    public IPage<InspectionRecord> getRecordPage(int page, int size, String status, Long pointId) {
        SysUser currentUser = UserContext.getUser();
        String role = currentUser.getRole();

        LambdaQueryWrapper<InspectionRecord> wrapper = new LambdaQueryWrapper<>();

        if (UserRoleEnum.INSPECTOR.getCode().equals(role)) {
            wrapper.eq(InspectionRecord::getInspectorId, currentUser.getId());
        }

        if (StrUtil.isNotBlank(status)) {
            wrapper.eq(InspectionRecord::getStatus, status);
        }
        if (pointId != null) {
            wrapper.eq(InspectionRecord::getPointId, pointId);
        }

        wrapper.orderByDesc(InspectionRecord::getCheckTime);

        Page<InspectionRecord> pageParam = new Page<>(page, size);
        IPage<InspectionRecord> result = inspectionRecordMapper.selectPage(pageParam, wrapper);

        result.getRecords().forEach(this::fillRecordInfo);

        return result;
    }

    public IPage<InspectionPoint> getPointPage(int page, int size, String keyword, String category) {
        LambdaQueryWrapper<InspectionPoint> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(InspectionPoint::getStatus, 1);

        if (StrUtil.isNotBlank(keyword)) {
            wrapper.and(w -> w.like(InspectionPoint::getPointName, keyword)
                    .or().like(InspectionPoint::getPointCode, keyword)
                    .or().like(InspectionPoint::getLocation, keyword));
        }
        if (StrUtil.isNotBlank(category)) {
            wrapper.eq(InspectionPoint::getCategory, category);
        }

        wrapper.orderByAsc(InspectionPoint::getPointCode);

        Page<InspectionPoint> pageParam = new Page<>(page, size);
        return inspectionPointMapper.selectPage(pageParam, wrapper);
    }

    @Transactional(rollbackFor = Exception.class)
    public Result<InspectionRecord> handleAbnormal(Long recordId, String handleRemark, boolean createOrder) {
        SysUser currentUser = UserContext.getUser();
        InspectionRecord record = inspectionRecordMapper.selectById(recordId);

        if (record == null) {
            return Result.validateError("巡检记录不存在");
        }

        if (!"ABNORMAL".equals(record.getStatus())) {
            return Result.validateError("该记录无异常需要处理");
        }

        record.setIsHandled(1);
        record.setHandleRemark(handleRemark);
        inspectionRecordMapper.updateById(record);

        if (createOrder) {
            InspectionPoint point = inspectionPointMapper.selectById(record.getPointId());

            WorkOrder order = new WorkOrder();
            order.setOrderNo("WO" + DateUtil.format(LocalDateTime.now(), "yyyyMMddHHmmss") +
                    String.format("%03d", (int) (Math.random() * 1000)));
            order.setTitle("巡检异常维修 - " + point.getPointName());
            order.setDescription("巡检发现异常：" + record.getAbnormalDescription() + "。处理备注：" + handleRemark);
            order.setCategory("公共设施");
            order.setPriority(com.property.common.enums.WorkOrderPriorityEnum.NORMAL.getCode());
            order.setStatus(com.property.common.enums.WorkOrderStatusEnum.PENDING.getCode());
            order.setReportTime(LocalDateTime.now());
            order.setCreatedBy(currentUser.getId());
            order.setHasPhoto(0);
            order.setIsPaid(0);

            workOrderMapper.insert(order);
            record.setRelatedOrderId(order.getId());
            inspectionRecordMapper.updateById(record);

            messageService.sendMessageToAdmins(
                    com.property.common.enums.MessageTypeEnum.ORDER_NEW,
                    "巡检异常工单",
                    "巡检异常已生成工单：" + order.getTitle(),
                    order.getId()
            );
        }

        log.info("巡检异常处理完成: recordId={}", recordId);

        return Result.success("处理完成", record);
    }

    private void fillRecordInfo(InspectionRecord record) {
        if (record.getPointId() != null) {
            InspectionPoint point = inspectionPointMapper.selectById(record.getPointId());
            if (point != null) {
                record.setPointName(point.getPointName());
                record.setPointLocation(point.getLocation());
            }
        }

        if (record.getInspectorId() != null) {
            SysUser inspector = sysUserMapper.selectById(record.getInspectorId());
            if (inspector != null) {
                record.setInspectorName(inspector.getRealName());
            }
        }
    }

    private String generateRecordNo() {
        return "IR" + DateUtil.format(LocalDateTime.now(), "yyyyMMddHHmmss") +
                String.format("%03d", (int) (Math.random() * 1000));
    }
}
