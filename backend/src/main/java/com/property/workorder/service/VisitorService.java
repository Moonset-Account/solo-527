package com.property.workorder.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.property.workorder.common.PageResult;
import com.property.workorder.entity.VisitorAppointment;
import com.property.workorder.mapper.VisitorAppointmentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VisitorService {

    private final VisitorAppointmentMapper visitorMapper;

    public PageResult<VisitorAppointment> queryAppointments(String visitorName, String visitorPhone,
                                                              String buildingNo, String roomNo,
                                                              LocalDate visitDate, String status,
                                                              Integer current, Integer size) {
        Page<VisitorAppointment> page = new Page<>(current, size);
        LambdaQueryWrapper<VisitorAppointment> wrapper = new LambdaQueryWrapper<>();
        if (visitorName != null && !visitorName.isEmpty()) {
            wrapper.like(VisitorAppointment::getVisitorName, visitorName);
        }
        if (visitorPhone != null && !visitorPhone.isEmpty()) {
            wrapper.like(VisitorAppointment::getVisitorPhone, visitorPhone);
        }
        if (buildingNo != null && !buildingNo.isEmpty()) {
            wrapper.eq(VisitorAppointment::getBuildingNo, buildingNo);
        }
        if (roomNo != null && !roomNo.isEmpty()) {
            wrapper.eq(VisitorAppointment::getRoomNo, roomNo);
        }
        if (visitDate != null) {
            wrapper.eq(VisitorAppointment::getVisitDate, visitDate);
        }
        if (status != null && !status.isEmpty()) {
            wrapper.eq(VisitorAppointment::getStatus, status);
        }
        wrapper.orderByDesc(VisitorAppointment::getCreatedAt);
        return PageResult.of(visitorMapper.selectPage(page, wrapper));
    }

    public List<VisitorAppointment> queryAppointmentsForExport(String visitorName, String visitorPhone,
                                                                String buildingNo, String roomNo,
                                                                LocalDate visitDate, String status) {
        LambdaQueryWrapper<VisitorAppointment> wrapper = new LambdaQueryWrapper<>();
        if (visitorName != null && !visitorName.isEmpty()) {
            wrapper.like(VisitorAppointment::getVisitorName, visitorName);
        }
        if (visitorPhone != null && !visitorPhone.isEmpty()) {
            wrapper.like(VisitorAppointment::getVisitorPhone, visitorPhone);
        }
        if (buildingNo != null && !buildingNo.isEmpty()) {
            wrapper.eq(VisitorAppointment::getBuildingNo, buildingNo);
        }
        if (roomNo != null && !roomNo.isEmpty()) {
            wrapper.eq(VisitorAppointment::getRoomNo, roomNo);
        }
        if (visitDate != null) {
            wrapper.eq(VisitorAppointment::getVisitDate, visitDate);
        }
        if (status != null && !status.isEmpty()) {
            wrapper.eq(VisitorAppointment::getStatus, status);
        }
        wrapper.orderByDesc(VisitorAppointment::getCreatedAt);
        return visitorMapper.selectList(wrapper);
    }

    @Transactional(rollbackFor = Exception.class)
    public VisitorAppointment createAppointment(VisitorAppointment appointment) {
        appointment.setAppointmentNo("V" + System.currentTimeMillis());
        appointment.setStatus("PENDING");
        visitorMapper.insert(appointment);
        return appointment;
    }

    @Transactional(rollbackFor = Exception.class)
    public VisitorAppointment approveAppointment(Long id, Long staffId, boolean approved) {
        VisitorAppointment appt = visitorMapper.selectById(id);
        if (appt == null) {
            throw new RuntimeException("预约记录不存在");
        }
        if (!"PENDING".equals(appt.getStatus())) {
            throw new RuntimeException("当前状态不可审批");
        }
        appt.setStatus(approved ? "APPROVED" : "REJECTED");
        appt.setApprovedBy(staffId);
        appt.setApprovedAt(LocalDateTime.now());
        visitorMapper.updateById(appt);
        return appt;
    }

    @Transactional(rollbackFor = Exception.class)
    public VisitorAppointment checkIn(Long id) {
        VisitorAppointment appt = visitorMapper.selectById(id);
        if (appt == null) {
            throw new RuntimeException("预约记录不存在");
        }
        appt.setStatus("CHECKED_IN");
        appt.setCheckInAt(LocalDateTime.now());
        visitorMapper.updateById(appt);
        return appt;
    }

    @Transactional(rollbackFor = Exception.class)
    public VisitorAppointment checkOut(Long id) {
        VisitorAppointment appt = visitorMapper.selectById(id);
        if (appt == null) {
            throw new RuntimeException("预约记录不存在");
        }
        appt.setStatus("CHECKED_OUT");
        appt.setCheckOutAt(LocalDateTime.now());
        visitorMapper.updateById(appt);
        return appt;
    }
}
