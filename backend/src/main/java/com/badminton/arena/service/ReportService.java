package com.badminton.arena.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.badminton.arena.entity.InventoryReport;
import com.badminton.arena.vo.CourtUsageTrendVO;
import com.badminton.arena.vo.InventoryReportVO;

import java.time.LocalDate;
import java.util.List;

public interface ReportService extends IService<InventoryReport> {

    List<CourtUsageTrendVO> getCourtUsageTrend(LocalDate startDate, LocalDate endDate, Long courtId);

    List<InventoryReportVO> getInventoryReport(LocalDate startDate, LocalDate endDate, String reportType);

    void generateCourtUsageStats(LocalDate statDate);

    void generateInventoryReport(LocalDate reportDate);
}
