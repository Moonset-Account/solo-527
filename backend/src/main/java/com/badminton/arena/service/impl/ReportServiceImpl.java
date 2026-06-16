package com.badminton.arena.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.badminton.arena.entity.*;
import com.badminton.arena.mapper.*;
import com.badminton.arena.service.ReportService;
import com.badminton.arena.vo.CourtUsageTrendVO;
import com.badminton.arena.vo.InventoryReportVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReportServiceImpl extends ServiceImpl<InventoryReportMapper, InventoryReport> implements ReportService {

    private static final Logger log = LoggerFactory.getLogger(ReportServiceImpl.class);

    @Autowired
    private CourtUsageStatsMapper courtUsageStatsMapper;

    @Autowired
    private BookingMapper bookingMapper;

    @Autowired
    private CourtMapper courtMapper;

    @Autowired
    private CourseScheduleMapper courseScheduleMapper;

    @Autowired
    private CourseMapper courseMapper;

    @Override
    public List<CourtUsageTrendVO> getCourtUsageTrend(LocalDate startDate, LocalDate endDate, Long courtId) {
        LambdaQueryWrapper<CourtUsageStats> wrapper = new LambdaQueryWrapper<>();
        wrapper.ge(CourtUsageStats::getStatDate, startDate);
        wrapper.le(CourtUsageStats::getStatDate, endDate);
        if (courtId != null) {
            wrapper.eq(CourtUsageStats::getCourtId, courtId);
        }
        wrapper.orderByAsc(CourtUsageStats::getStatDate);

        List<CourtUsageStats> statsList = courtUsageStatsMapper.selectList(wrapper);

        if (courtId != null) {
            return statsList.stream().map(stats -> {
                CourtUsageTrendVO vo = new CourtUsageTrendVO();
                vo.setStatDate(stats.getStatDate());
                vo.setUsageRate(stats.getUsageRate());
                vo.setBookedHours(stats.getBookedHours());
                vo.setBookingCount(stats.getBookingCount());
                vo.setTotalRevenue(stats.getTotalRevenue());
                return vo;
            }).collect(Collectors.toList());
        }

        Map<LocalDate, List<CourtUsageStats>> groupedByDate = statsList.stream()
                .collect(Collectors.groupingBy(CourtUsageStats::getStatDate));

        List<CourtUsageTrendVO> result = new ArrayList<>();
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            List<CourtUsageStats> dayStats = groupedByDate.get(date);
            CourtUsageTrendVO vo = new CourtUsageTrendVO();
            vo.setStatDate(date);
            if (dayStats != null && !dayStats.isEmpty()) {
                BigDecimal totalBookedHours = dayStats.stream()
                        .map(CourtUsageStats::getBookedHours)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal totalHours = dayStats.stream()
                        .map(CourtUsageStats::getTotalHours)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                int totalBookingCount = dayStats.stream()
                        .mapToInt(CourtUsageStats::getBookingCount)
                        .sum();
                BigDecimal totalRevenue = dayStats.stream()
                        .map(CourtUsageStats::getTotalRevenue)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal avgUsageRate = BigDecimal.ZERO;
                if (totalHours.compareTo(BigDecimal.ZERO) > 0) {
                    avgUsageRate = totalBookedHours.divide(totalHours, 2, RoundingMode.HALF_UP)
                            .multiply(new BigDecimal("100"));
                }

                vo.setBookedHours(totalBookedHours);
                vo.setUsageRate(avgUsageRate);
                vo.setBookingCount(totalBookingCount);
                vo.setTotalRevenue(totalRevenue);
            } else {
                vo.setBookedHours(BigDecimal.ZERO);
                vo.setUsageRate(BigDecimal.ZERO);
                vo.setBookingCount(0);
                vo.setTotalRevenue(BigDecimal.ZERO);
            }
            result.add(vo);
        }

        return result;
    }

    @Override
    public List<InventoryReportVO> getInventoryReport(LocalDate startDate, LocalDate endDate, String reportType) {
        LambdaQueryWrapper<InventoryReport> wrapper = new LambdaQueryWrapper<>();
        wrapper.ge(InventoryReport::getReportDate, startDate);
        wrapper.le(InventoryReport::getReportDate, endDate);
        if (reportType != null && !reportType.isEmpty()) {
            wrapper.eq(InventoryReport::getReportType, reportType);
        }
        wrapper.orderByAsc(InventoryReport::getReportDate);
        List<InventoryReport> list = list(wrapper);

        return list.stream().map(report -> {
            InventoryReportVO vo = new InventoryReportVO();
            BeanUtils.copyProperties(report, vo);
            return vo;
        }).collect(Collectors.toList());
    }

    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional(rollbackFor = Exception.class)
    public void generateDailyStatsJob() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        log.info("开始生成日期: {} 的统计数据", yesterday);
        try {
            generateCourtUsageStats(yesterday);
            generateInventoryReport(yesterday);
            log.info("日期: {} 的统计数据生成完成", yesterday);
        } catch (Exception e) {
            log.error("生成日期: {} 的统计数据失败", yesterday, e);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void generateCourtUsageStats(LocalDate statDate) {
        List<Court> courts = courtMapper.selectList(null);

        for (Court court : courts) {
            LambdaQueryWrapper<Booking> bookingWrapper = new LambdaQueryWrapper<>();
            bookingWrapper.eq(Booking::getCourtId, court.getId());
            bookingWrapper.eq(Booking::getBookingDate, statDate);
            bookingWrapper.in(Booking::getStatus, 1, 3);
            List<Booking> bookings = bookingMapper.selectList(bookingWrapper);

            BigDecimal totalHours = new BigDecimal("14.0");
            BigDecimal bookedHours = BigDecimal.ZERO;
            int bookingCount = bookings.size();
            BigDecimal totalRevenue = BigDecimal.ZERO;

            for (Booking booking : bookings) {
                LocalTime start = booking.getStartTime();
                LocalTime end = booking.getEndTime();
                long minutes = Duration.between(start, end).toMinutes();
                BigDecimal hours = new BigDecimal(minutes).divide(new BigDecimal("60"), 1, RoundingMode.HALF_UP);
                bookedHours = bookedHours.add(hours);
                totalRevenue = totalRevenue.add(booking.getPayAmount() != null ? booking.getPayAmount() : BigDecimal.ZERO);
            }

            BigDecimal usageRate = BigDecimal.ZERO;
            if (totalHours.compareTo(BigDecimal.ZERO) > 0) {
                usageRate = bookedHours.divide(totalHours, 2, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal("100"));
            }

            LambdaQueryWrapper<CourtUsageStats> statsWrapper = new LambdaQueryWrapper<>();
            statsWrapper.eq(CourtUsageStats::getStatDate, statDate);
            statsWrapper.eq(CourtUsageStats::getCourtId, court.getId());
            CourtUsageStats existStats = courtUsageStatsMapper.selectOne(statsWrapper);

            if (existStats != null) {
                existStats.setTotalHours(totalHours);
                existStats.setBookedHours(bookedHours);
                existStats.setUsageRate(usageRate);
                existStats.setBookingCount(bookingCount);
                existStats.setTotalRevenue(totalRevenue);
                courtUsageStatsMapper.updateById(existStats);
            } else {
                CourtUsageStats stats = new CourtUsageStats();
                stats.setStatDate(statDate);
                stats.setCourtId(court.getId());
                stats.setTotalHours(totalHours);
                stats.setBookedHours(bookedHours);
                stats.setUsageRate(usageRate);
                stats.setBookingCount(bookingCount);
                stats.setTotalRevenue(totalRevenue);
                courtUsageStatsMapper.insert(stats);
            }
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void generateInventoryReport(LocalDate reportDate) {
        generateCourtUsageInventoryReport(reportDate);
        generateCourseOccupancyReport(reportDate);
    }

    private void generateCourtUsageInventoryReport(LocalDate reportDate) {
        LambdaQueryWrapper<CourtUsageStats> statsWrapper = new LambdaQueryWrapper<>();
        statsWrapper.eq(CourtUsageStats::getStatDate, reportDate);
        List<CourtUsageStats> statsList = courtUsageStatsMapper.selectList(statsWrapper);

        for (CourtUsageStats stats : statsList) {
            Court court = courtMapper.selectById(stats.getCourtId());
            if (court == null) {
                continue;
            }

            LambdaQueryWrapper<InventoryReport> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(InventoryReport::getReportDate, reportDate);
            wrapper.eq(InventoryReport::getReportType, "court_usage");
            wrapper.eq(InventoryReport::getBizId, court.getId());
            InventoryReport existReport = getOne(wrapper);

            int totalCapacity = stats.getTotalHours().multiply(new BigDecimal("60")).intValue();
            int usedCapacity = stats.getBookedHours().multiply(new BigDecimal("60")).intValue();

            if (existReport != null) {
                existReport.setBizName(court.getName());
                existReport.setTotalCapacity(totalCapacity);
                existReport.setUsedCapacity(usedCapacity);
                existReport.setOccupancyRate(stats.getUsageRate());
                updateById(existReport);
            } else {
                InventoryReport report = new InventoryReport();
                report.setReportDate(reportDate);
                report.setReportType("court_usage");
                report.setBizId(court.getId());
                report.setBizName(court.getName());
                report.setTotalCapacity(totalCapacity);
                report.setUsedCapacity(usedCapacity);
                report.setOccupancyRate(stats.getUsageRate());
                save(report);
            }
        }
    }

    private void generateCourseOccupancyReport(LocalDate reportDate) {
        LambdaQueryWrapper<CourseSchedule> scheduleWrapper = new LambdaQueryWrapper<>();
        scheduleWrapper.eq(CourseSchedule::getScheduleDate, reportDate);
        scheduleWrapper.ne(CourseSchedule::getStatus, 3);
        List<CourseSchedule> scheduleList = courseScheduleMapper.selectList(scheduleWrapper);

        for (CourseSchedule schedule : scheduleList) {
            Course course = courseMapper.selectById(schedule.getCourseId());
            if (course == null) {
                continue;
            }

            LambdaQueryWrapper<InventoryReport> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(InventoryReport::getReportDate, reportDate);
            wrapper.eq(InventoryReport::getReportType, "course_occupancy");
            wrapper.eq(InventoryReport::getBizId, schedule.getId());
            InventoryReport existReport = getOne(wrapper);

            int totalCapacity = schedule.getMaxStudents();
            int usedCapacity = schedule.getEnrolledCount();
            BigDecimal occupancyRate = BigDecimal.ZERO;
            if (totalCapacity > 0) {
                occupancyRate = new BigDecimal(usedCapacity)
                        .divide(new BigDecimal(totalCapacity), 2, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal("100"));
            }

            if (existReport != null) {
                existReport.setBizName(course.getName());
                existReport.setTotalCapacity(totalCapacity);
                existReport.setUsedCapacity(usedCapacity);
                existReport.setOccupancyRate(occupancyRate);
                updateById(existReport);
            } else {
                InventoryReport report = new InventoryReport();
                report.setReportDate(reportDate);
                report.setReportType("course_occupancy");
                report.setBizId(schedule.getId());
                report.setBizName(course.getName());
                report.setTotalCapacity(totalCapacity);
                report.setUsedCapacity(usedCapacity);
                report.setOccupancyRate(occupancyRate);
                save(report);
            }
        }
    }
}
