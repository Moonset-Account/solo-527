package com.carcore.admin.service;

import com.carcore.admin.common.BusinessException;
import com.carcore.admin.common.CodeGenerator;
import com.carcore.admin.common.PageResult;
import com.carcore.admin.dto.ReportGenerateDTO;
import com.carcore.admin.entity.EfficiencyReport;
import com.carcore.admin.entity.RepairOrder;
import com.carcore.admin.entity.Technician;
import com.carcore.admin.entity.Workstation;
import com.carcore.admin.repository.EfficiencyReportRepository;
import com.carcore.admin.repository.RepairOrderRepository;
import com.carcore.admin.repository.TechnicianRepository;
import com.carcore.admin.repository.WorkstationRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class EfficiencyReportService {

    private final EfficiencyReportRepository efficiencyReportRepository;
    private final RepairOrderRepository repairOrderRepository;
    private final TechnicianRepository technicianRepository;
    private final WorkstationRepository workstationRepository;
    private final CodeGenerator codeGenerator;
    private final ObjectMapper objectMapper;

    public EfficiencyReportService(EfficiencyReportRepository efficiencyReportRepository, RepairOrderRepository repairOrderRepository, TechnicianRepository technicianRepository, WorkstationRepository workstationRepository, CodeGenerator codeGenerator, ObjectMapper objectMapper) {
        this.efficiencyReportRepository = efficiencyReportRepository;
        this.repairOrderRepository = repairOrderRepository;
        this.technicianRepository = technicianRepository;
        this.workstationRepository = workstationRepository;
        this.codeGenerator = codeGenerator;
        this.objectMapper = objectMapper;
    }

    public EfficiencyReport getById(Long id) {
        return efficiencyReportRepository.findById(id)
                .orElseThrow(() -> new BusinessException("报表不存在"));
    }

    public EfficiencyReport getByReportNo(String reportNo) {
        return efficiencyReportRepository.findByReportNo(reportNo)
                .orElseThrow(() -> new BusinessException("报表不存在"));
    }

    public PageResult<EfficiencyReport> page(String reportNo, String reportType,
                                              LocalDate startDate, LocalDate endDate,
                                              int pageNum, int pageSize) {
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize, Sort.by(Sort.Direction.DESC, "reportDate"));
        Page<EfficiencyReport> page = efficiencyReportRepository.findByConditions(
                reportNo, reportType, startDate, endDate, pageable);
        return PageResult.of(page.getContent(), page.getTotalElements(), pageNum, pageSize);
    }

    @Transactional
    public EfficiencyReport generate(ReportGenerateDTO dto) {
        LocalDateTime startTime;
        LocalDateTime endTime;
        
        LocalDate reportDate = dto.getReportDate();
        
        switch (dto.getReportType()) {
            case "DAILY" -> {
                startTime = reportDate.atStartOfDay();
                endTime = reportDate.atTime(LocalTime.MAX);
            }
            case "WEEKLY" -> {
                startTime = reportDate.with(java.time.DayOfWeek.MONDAY).atStartOfDay();
                endTime = reportDate.with(java.time.DayOfWeek.SUNDAY).atTime(LocalTime.MAX);
            }
            case "MONTHLY" -> {
                startTime = reportDate.withDayOfMonth(1).atStartOfDay();
                endTime = reportDate.withDayOfMonth(reportDate.lengthOfMonth()).atTime(LocalTime.MAX);
            }
            default -> throw new BusinessException("不支持的报表类型");
        }
        
        Optional<EfficiencyReport> existing = efficiencyReportRepository
                .findByReportTypeAndReportDate(dto.getReportType(), reportDate);
        if (existing.isPresent()) {
            throw new BusinessException("该周期的报表已生成，请直接查看");
        }
        
        List<RepairOrder> closedOrders = repairOrderRepository.findClosedOrdersByTimeRange(startTime, endTime);
        
        EfficiencyReport report = new EfficiencyReport();
        report.setReportNo(codeGenerator.generateReportNo());
        report.setReportType(dto.getReportType());
        report.setReportDate(reportDate);
        report.setTotalOrders(closedOrders.size());
        
        long completedCount = closedOrders.stream()
                .filter(o -> o.getStatus() == 6)
                .count();
        report.setCompletedOrders((int) completedCount);
        
        long delayedCount = repairOrderRepository.countDelayedOrdersByTimeRange(startTime, endTime);
        report.setDelayedOrders((int) delayedCount);
        
        BigDecimal totalRevenue = closedOrders.stream()
                .map(RepairOrder::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        report.setTotalRevenue(totalRevenue);
        
        BigDecimal totalHours = BigDecimal.ZERO;
        int validCount = 0;
        for (RepairOrder order : closedOrders) {
            if (order.getActualStartTime() != null && order.getActualEndTime() != null) {
                Duration duration = Duration.between(order.getActualStartTime(), order.getActualEndTime());
                totalHours = totalHours.add(BigDecimal.valueOf(duration.toMinutes())
                        .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP));
                validCount++;
            }
        }
        if (validCount > 0) {
            report.setAverageCompletionHours(totalHours.divide(
                    BigDecimal.valueOf(validCount), 2, RoundingMode.HALF_UP));
        } else {
            report.setAverageCompletionHours(BigDecimal.ZERO);
        }
        
        long passedCount = closedOrders.stream()
                .filter(o -> "PASSED".equals(o.getQualityStatus()))
                .count();
        if (closedOrders.size() > 0) {
            BigDecimal passRate = BigDecimal.valueOf(passedCount)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(closedOrders.size()), 2, RoundingMode.HALF_UP);
            report.setPassRate(passRate);
        } else {
            report.setPassRate(BigDecimal.ZERO);
        }
        
        report.setTechEfficiency(generateTechEfficiency(closedOrders));
        report.setStationUtilization(generateStationUtilization(closedOrders, startTime, endTime));
        
        String sourceIds = closedOrders.stream()
                .map(RepairOrder::getId)
                .map(String::valueOf)
                .collect(Collectors.joining(","));
        report.setSourceCloseOrderIds(sourceIds);
        
        report.setRemark(dto.getRemark());
        
        return efficiencyReportRepository.save(report);
    }

    private String generateTechEfficiency(List<RepairOrder> orders) {
        Map<Long, List<RepairOrder>> techOrdersMap = orders.stream()
                .filter(o -> o.getTechnicianId() != null)
                .collect(Collectors.groupingBy(RepairOrder::getTechnicianId));
        
        List<Map<String, Object>> result = new ArrayList<>();
        List<Technician> technicians = technicianRepository.findAll();
        Map<Long, String> techNameMap = technicians.stream()
                .collect(Collectors.toMap(Technician::getId, Technician::getName));
        
        for (Map.Entry<Long, List<RepairOrder>> entry : techOrdersMap.entrySet()) {
            Long techId = entry.getKey();
            List<RepairOrder> techOrders = entry.getValue();
            
            BigDecimal totalHours = BigDecimal.ZERO;
            BigDecimal totalRevenue = BigDecimal.ZERO;
            int completed = 0;
            
            for (RepairOrder order : techOrders) {
                if (order.getActualStartTime() != null && order.getActualEndTime() != null) {
                    Duration duration = Duration.between(order.getActualStartTime(), order.getActualEndTime());
                    totalHours = totalHours.add(BigDecimal.valueOf(duration.toMinutes())
                            .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP));
                }
                if (order.getTotalAmount() != null) {
                    totalRevenue = totalRevenue.add(order.getTotalAmount());
                }
                if (order.getStatus() == 6) {
                    completed++;
                }
            }
            
            BigDecimal efficiency = totalHours.compareTo(BigDecimal.ZERO) > 0
                    ? totalRevenue.divide(totalHours, 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            
            Map<String, Object> techData = new HashMap<>();
            techData.put("technicianId", techId);
            techData.put("technicianName", techNameMap.getOrDefault(techId, "未知"));
            techData.put("orderCount", techOrders.size());
            techData.put("completedCount", completed);
            techData.put("totalHours", totalHours);
            techData.put("totalRevenue", totalRevenue);
            techData.put("efficiency", efficiency);
            
            result.add(techData);
        }
        
        try {
            return objectMapper.writeValueAsString(result);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private String generateStationUtilization(List<RepairOrder> orders,
                                              LocalDateTime startTime, LocalDateTime endTime) {
        Map<Long, List<RepairOrder>> stationOrdersMap = orders.stream()
                .filter(o -> o.getWorkstationId() != null)
                .collect(Collectors.groupingBy(RepairOrder::getWorkstationId));
        
        Duration totalDuration = Duration.between(startTime, endTime);
        BigDecimal totalHours = BigDecimal.valueOf(totalDuration.toMinutes())
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
        
        List<Map<String, Object>> result = new ArrayList<>();
        List<Workstation> workstations = workstationRepository.findAll();
        Map<Long, String> stationNameMap = workstations.stream()
                .collect(Collectors.toMap(Workstation::getId, Workstation::getStationName));
        
        for (Map.Entry<Long, List<RepairOrder>> entry : stationOrdersMap.entrySet()) {
            Long stationId = entry.getKey();
            List<RepairOrder> stationOrders = entry.getValue();
            
            BigDecimal occupiedHours = BigDecimal.ZERO;
            for (RepairOrder order : stationOrders) {
                if (order.getActualStartTime() != null && order.getActualEndTime() != null) {
                    Duration duration = Duration.between(order.getActualStartTime(), order.getActualEndTime());
                    occupiedHours = occupiedHours.add(BigDecimal.valueOf(duration.toMinutes())
                            .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP));
                }
            }
            
            BigDecimal utilization = totalHours.compareTo(BigDecimal.ZERO) > 0
                    ? occupiedHours.divide(totalHours, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                    : BigDecimal.ZERO;
            
            Map<String, Object> stationData = new HashMap<>();
            stationData.put("workstationId", stationId);
            stationData.put("workstationName", stationNameMap.getOrDefault(stationId, "未知"));
            stationData.put("orderCount", stationOrders.size());
            stationData.put("occupiedHours", occupiedHours);
            stationData.put("totalHours", totalHours);
            stationData.put("utilization", utilization);
            
            result.add(stationData);
        }
        
        try {
            return objectMapper.writeValueAsString(result);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    public Map<String, Object> getReportDetail(Long id) {
        EfficiencyReport report = getById(id);
        Map<String, Object> result = new HashMap<>();
        result.put("report", report);
        
        try {
            if (report.getTechEfficiency() != null) {
                result.put("techEfficiencyData", 
                        objectMapper.readValue(report.getTechEfficiency(), List.class));
            }
            if (report.getStationUtilization() != null) {
                result.put("stationUtilizationData", 
                        objectMapper.readValue(report.getStationUtilization(), List.class));
            }
        } catch (JsonProcessingException e) {
            result.put("techEfficiencyData", List.of());
            result.put("stationUtilizationData", List.of());
        }
        
        return result;
    }
}
