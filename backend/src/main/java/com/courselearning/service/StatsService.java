package com.courselearning.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.courselearning.entity.*;
import com.courselearning.mapper.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

@Service
public class StatsService {

    @Autowired
    private SysUserMapper sysUserMapper;

    @Autowired
    private CourseMapper courseMapper;

    @Autowired
    private ChapterMapper chapterMapper;

    @Autowired
    private UserOrderMapper userOrderMapper;

    @Autowired
    private CommissionLogMapper commissionLogMapper;

    @Autowired
    private StudyProgressMapper studyProgressMapper;

    @Autowired
    private CheckInMapper checkInMapper;

    public Map<String, Object> getOverview() {
        Map<String, Object> result = new HashMap<>();

        LambdaQueryWrapper<SysUser> userWrapper = new LambdaQueryWrapper<>();
        Long totalUsers = sysUserMapper.selectCount(userWrapper);
        result.put("totalUsers", totalUsers);

        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LambdaQueryWrapper<SysUser> todayUserWrapper = new LambdaQueryWrapper<>();
        todayUserWrapper.ge(SysUser::getCreatedAt, todayStart);
        Long todayNewUsers = sysUserMapper.selectCount(todayUserWrapper);
        result.put("todayNewUsers", todayNewUsers);

        LambdaQueryWrapper<Course> courseWrapper = new LambdaQueryWrapper<>();
        courseWrapper.eq(Course::getStatus, 1);
        Long totalCourses = courseMapper.selectCount(courseWrapper);
        result.put("totalCourses", totalCourses);

        LambdaQueryWrapper<Chapter> chapterWrapper = new LambdaQueryWrapper<>();
        Long totalChapters = chapterMapper.selectCount(chapterWrapper);
        result.put("totalChapters", totalChapters);

        LambdaQueryWrapper<UserOrder> orderWrapper = new LambdaQueryWrapper<>();
        orderWrapper.eq(UserOrder::getPayStatus, 1);
        List<UserOrder> paidOrders = userOrderMapper.selectList(orderWrapper);
        Long totalOrders = (long) paidOrders.size();
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalCommission = BigDecimal.ZERO;
        for (UserOrder order : paidOrders) {
            if (order.getPayAmount() != null) {
                totalRevenue = totalRevenue.add(order.getPayAmount());
            }
            if (order.getCommissionAmount() != null && order.getCommissionStatus() != 4) {
                totalCommission = totalCommission.add(order.getCommissionAmount());
            }
        }
        result.put("totalOrders", totalOrders);
        result.put("totalRevenue", totalRevenue);
        result.put("totalCommission", totalCommission);

        LambdaQueryWrapper<CheckIn> todayCheckInWrapper = new LambdaQueryWrapper<>();
        todayCheckInWrapper.eq(CheckIn::getCheckDate, LocalDate.now());
        Long todayCheckIns = checkInMapper.selectCount(todayCheckInWrapper);
        result.put("todayCheckIns", todayCheckIns);

        LocalDateTime yesterdayStart = LocalDate.now().minusDays(1).atStartOfDay();
        LambdaQueryWrapper<UserOrder> todayOrderWrapper = new LambdaQueryWrapper<>();
        todayOrderWrapper.eq(UserOrder::getPayStatus, 1)
                .ge(UserOrder::getPayTime, todayStart);
        List<UserOrder> todayPaidOrders = userOrderMapper.selectList(todayOrderWrapper);
        Long todayOrders = (long) todayPaidOrders.size();
        BigDecimal todayRevenue = BigDecimal.ZERO;
        for (UserOrder order : todayPaidOrders) {
            if (order.getPayAmount() != null) {
                todayRevenue = todayRevenue.add(order.getPayAmount());
            }
        }
        result.put("todayOrders", todayOrders);
        result.put("todayRevenue", todayRevenue);

        LambdaQueryWrapper<UserOrder> yesterdayOrderWrapper = new LambdaQueryWrapper<>();
        yesterdayOrderWrapper.eq(UserOrder::getPayStatus, 1)
                .ge(UserOrder::getPayTime, yesterdayStart)
                .lt(UserOrder::getPayTime, todayStart);
        Long yesterdayOrders = userOrderMapper.selectCount(yesterdayOrderWrapper);
        double orderGrowth = yesterdayOrders > 0 ?
                (double) (todayOrders - yesterdayOrders) / yesterdayOrders * 100 : (todayOrders > 0 ? 100 : 0);
        result.put("orderGrowth", String.format("%.2f", orderGrowth) + "%");

        Map<String, Object> commissionStatus = new HashMap<>();
        LambdaQueryWrapper<UserOrder> pendingWrapper = new LambdaQueryWrapper<>();
        pendingWrapper.eq(UserOrder::getCommissionStatus, 1);
        commissionStatus.put("pending", userOrderMapper.selectCount(pendingWrapper));

        LambdaQueryWrapper<UserOrder> settledWrapper = new LambdaQueryWrapper<>();
        settledWrapper.eq(UserOrder::getCommissionStatus, 2);
        commissionStatus.put("settled", userOrderMapper.selectCount(settledWrapper));

        LambdaQueryWrapper<UserOrder> disputeWrapper = new LambdaQueryWrapper<>();
        disputeWrapper.eq(UserOrder::getCommissionStatus, 3);
        commissionStatus.put("dispute", userOrderMapper.selectCount(disputeWrapper));

        result.put("commissionStatus", commissionStatus);

        return result;
    }

    public Map<String, Object> getDrilldown(String dimension, LocalDate startDate, LocalDate endDate,
                                            Long courseId, Long userId) {
        Map<String, Object> result = new HashMap<>();
        result.put("dimension", dimension);

        LocalDateTime start = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime end = endDate != null ? endDate.atTime(23, 59, 59) : null;

        LambdaQueryWrapper<UserOrder> orderWrapper = new LambdaQueryWrapper<>();
        orderWrapper.eq(UserOrder::getPayStatus, 1);

        if (start != null) {
            orderWrapper.ge(UserOrder::getPayTime, start);
        }
        if (end != null) {
            orderWrapper.le(UserOrder::getPayTime, end);
        }
        if (courseId != null) {
            orderWrapper.eq(UserOrder::getCourseId, courseId);
        }
        if (userId != null) {
            orderWrapper.eq(UserOrder::getUserId, userId);
        }

        List<UserOrder> orders = userOrderMapper.selectList(orderWrapper);

        switch (dimension) {
            case "day" -> {
                Map<LocalDate, List<UserOrder>> dateMap = new TreeMap<>();
                for (UserOrder order : orders) {
                    LocalDate date = order.getPayTime().toLocalDate();
                    dateMap.computeIfAbsent(date, k -> new ArrayList<>()).add(order);
                }
                List<Map<String, Object>> timeStats = new ArrayList<>();
                for (Map.Entry<LocalDate, List<UserOrder>> entry : dateMap.entrySet()) {
                    Map<String, Object> stat = buildTimeStat(entry.getKey().toString(), entry.getValue());
                    timeStats.add(stat);
                }
                result.put("stats", timeStats);
            }
            case "week" -> {
                Map<String, List<UserOrder>> weekMap = new TreeMap<>();
                for (UserOrder order : orders) {
                    LocalDate date = order.getPayTime().toLocalDate();
                    LocalDate weekStart = date.with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
                    LocalDate weekEnd = weekStart.plusDays(6);
                    String key = weekStart + " ~ " + weekEnd;
                    weekMap.computeIfAbsent(key, k -> new ArrayList<>()).add(order);
                }
                List<Map<String, Object>> timeStats = new ArrayList<>();
                for (Map.Entry<String, List<UserOrder>> entry : weekMap.entrySet()) {
                    Map<String, Object> stat = buildTimeStat(entry.getKey(), entry.getValue());
                    timeStats.add(stat);
                }
                result.put("stats", timeStats);
            }
            case "month" -> {
                Map<String, List<UserOrder>> monthMap = new TreeMap<>();
                for (UserOrder order : orders) {
                    LocalDate date = order.getPayTime().toLocalDate();
                    String key = date.getYear() + "-" + String.format("%02d", date.getMonthValue());
                    monthMap.computeIfAbsent(key, k -> new ArrayList<>()).add(order);
                }
                List<Map<String, Object>> timeStats = new ArrayList<>();
                for (Map.Entry<String, List<UserOrder>> entry : monthMap.entrySet()) {
                    Map<String, Object> stat = buildTimeStat(entry.getKey(), entry.getValue());
                    timeStats.add(stat);
                }
                result.put("stats", timeStats);
            }
            case "course" -> {
                Map<Long, List<UserOrder>> courseMap = new HashMap<>();
                for (UserOrder order : orders) {
                    courseMap.computeIfAbsent(order.getCourseId(), k -> new ArrayList<>()).add(order);
                }
                List<Map<String, Object>> courseStats = new ArrayList<>();
                for (Map.Entry<Long, List<UserOrder>> entry : courseMap.entrySet()) {
                    Course course = courseMapper.selectById(entry.getKey());
                    Map<String, Object> stat = buildTimeStat(
                            course != null ? course.getTitle() : "Unknown",
                            entry.getValue());
                    stat.put("courseId", entry.getKey());
                    if (course != null) {
                        stat.put("cover", course.getCover());
                    }
                    courseStats.add(stat);
                }
                courseStats.sort((a, b) -> ((Long) b.get("orderCount")).compareTo((Long) a.get("orderCount")));
                result.put("stats", courseStats);
            }
            case "user" -> {
                Map<Long, List<UserOrder>> userMap = new HashMap<>();
                for (UserOrder order : orders) {
                    userMap.computeIfAbsent(order.getUserId(), k -> new ArrayList<>()).add(order);
                }
                List<Map<String, Object>> userStats = new ArrayList<>();
                for (Map.Entry<Long, List<UserOrder>> entry : userMap.entrySet()) {
                    SysUser user = sysUserMapper.selectById(entry.getKey());
                    Map<String, Object> stat = buildTimeStat(
                            user != null ? user.getNickname() : "Unknown",
                            entry.getValue());
                    stat.put("userId", entry.getKey());
                    if (user != null) {
                        stat.put("avatar", user.getAvatar());
                    }
                    stat.put("orderCount", (long) entry.getValue().size());
                    userStats.add(stat);
                }
                userStats.sort((a, b) -> ((Long) b.get("orderCount")).compareTo((Long) a.get("orderCount")));
                result.put("stats", userStats);
            }
        }

        List<Map<String, Object>> orderDetails = new ArrayList<>();
        for (UserOrder order : orders) {
            Map<String, Object> detail = new HashMap<>();
            detail.put("order", order);

            Course course = courseMapper.selectById(order.getCourseId());
            if (course != null) {
                Map<String, Object> courseInfo = new HashMap<>();
                courseInfo.put("id", course.getId());
                courseInfo.put("title", course.getTitle());
                courseInfo.put("cover", course.getCover());
                detail.put("course", courseInfo);
            }

            SysUser user = sysUserMapper.selectById(order.getUserId());
            if (user != null) {
                Map<String, Object> userInfo = new HashMap<>();
                userInfo.put("id", user.getId());
                userInfo.put("nickname", user.getNickname());
                userInfo.put("avatar", user.getAvatar());
                detail.put("user", userInfo);
            }

            orderDetails.add(detail);
        }
        result.put("orderDetails", orderDetails);

        return result;
    }

    private Map<String, Object> buildTimeStat(String label, List<UserOrder> orders) {
        Map<String, Object> stat = new HashMap<>();
        stat.put("label", label);
        stat.put("orderCount", (long) orders.size());

        BigDecimal revenue = BigDecimal.ZERO;
        BigDecimal commission = BigDecimal.ZERO;
        Set<Long> userIds = new HashSet<>();
        for (UserOrder order : orders) {
            if (order.getPayAmount() != null) {
                revenue = revenue.add(order.getPayAmount());
            }
            if (order.getCommissionAmount() != null && order.getCommissionStatus() != 4) {
                commission = commission.add(order.getCommissionAmount());
            }
            userIds.add(order.getUserId());
        }
        stat.put("revenue", revenue);
        stat.put("commission", commission);
        stat.put("userCount", (long) userIds.size());
        stat.put("avgAmount", orders.size() > 0 ?
                revenue.divide(BigDecimal.valueOf(orders.size()), 2, BigDecimal.ROUND_HALF_UP) : BigDecimal.ZERO);

        return stat;
    }

    public Map<String, Object> getCommissionReport(LocalDate startDate, LocalDate endDate, Long referrerId) {
        Map<String, Object> result = new HashMap<>();

        LocalDateTime start = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime end = endDate != null ? endDate.atTime(23, 59, 59) : null;

        LambdaQueryWrapper<UserOrder> orderWrapper = new LambdaQueryWrapper<>();
        orderWrapper.eq(UserOrder::getPayStatus, 1);
        if (referrerId != null) {
            orderWrapper.eq(UserOrder::getReferrerId, referrerId);
        }
        orderWrapper.isNotNull(UserOrder::getReferrerId);
        if (start != null) {
            orderWrapper.ge(UserOrder::getPayTime, start);
        }
        if (end != null) {
            orderWrapper.le(UserOrder::getPayTime, end);
        }

        List<UserOrder> orders = userOrderMapper.selectList(orderWrapper);

        Map<Long, Map<String, Object>> referrerStats = new HashMap<>();
        BigDecimal totalCommission = BigDecimal.ZERO;
        BigDecimal pendingCommission = BigDecimal.ZERO;
        BigDecimal settledCommission = BigDecimal.ZERO;
        BigDecimal disputeCommission = BigDecimal.ZERO;
        BigDecimal canceledCommission = BigDecimal.ZERO;

        for (UserOrder order : orders) {
            if (order.getCommissionAmount() == null) continue;

            Long rid = order.getReferrerId();
            referrerStats.computeIfAbsent(rid, k -> {
                Map<String, Object> m = new HashMap<>();
                m.put("referrerId", rid);
                m.put("orderCount", 0L);
                m.put("totalCommission", BigDecimal.ZERO);
                m.put("pendingCommission", BigDecimal.ZERO);
                m.put("settledCommission", BigDecimal.ZERO);
                m.put("disputeCommission", BigDecimal.ZERO);
                m.put("canceledCommission", BigDecimal.ZERO);
                SysUser u = sysUserMapper.selectById(rid);
                if (u != null) {
                    m.put("nickname", u.getNickname());
                    m.put("avatar", u.getAvatar());
                }
                return m;
            });

            Map<String, Object> stat = referrerStats.get(rid);
            stat.put("orderCount", (Long) stat.get("orderCount") + 1);

            totalCommission = totalCommission.add(order.getCommissionAmount());
            stat.put("totalCommission", ((BigDecimal) stat.get("totalCommission")).add(order.getCommissionAmount()));

            switch (order.getCommissionStatus()) {
                case 1 -> {
                    pendingCommission = pendingCommission.add(order.getCommissionAmount());
                    stat.put("pendingCommission", ((BigDecimal) stat.get("pendingCommission")).add(order.getCommissionAmount()));
                }
                case 2 -> {
                    settledCommission = settledCommission.add(order.getCommissionAmount());
                    stat.put("settledCommission", ((BigDecimal) stat.get("settledCommission")).add(order.getCommissionAmount()));
                }
                case 3 -> {
                    disputeCommission = disputeCommission.add(order.getCommissionAmount());
                    stat.put("disputeCommission", ((BigDecimal) stat.get("disputeCommission")).add(order.getCommissionAmount()));
                }
                case 4 -> {
                    canceledCommission = canceledCommission.add(order.getCommissionAmount());
                    stat.put("canceledCommission", ((BigDecimal) stat.get("canceledCommission")).add(order.getCommissionAmount()));
                }
            }
        }

        result.put("totalCommission", totalCommission);
        result.put("pendingCommission", pendingCommission);
        result.put("settledCommission", settledCommission);
        result.put("disputeCommission", disputeCommission);
        result.put("canceledCommission", canceledCommission);
        result.put("referrerCount", referrerStats.size());
        result.put("referrerStats", new ArrayList<>(referrerStats.values()));

        List<Map<String, Object>> orderDetails = new ArrayList<>();
        for (UserOrder order : orders) {
            Map<String, Object> detail = new HashMap<>();
            detail.put("order", order);

            Course course = courseMapper.selectById(order.getCourseId());
            if (course != null) {
                detail.put("courseTitle", course.getTitle());
            }

            SysUser buyer = sysUserMapper.selectById(order.getUserId());
            if (buyer != null) {
                detail.put("buyerNickname", buyer.getNickname());
            }

            SysUser referrer = sysUserMapper.selectById(order.getReferrerId());
            if (referrer != null) {
                detail.put("referrerNickname", referrer.getNickname());
            }

            orderDetails.add(detail);
        }
        result.put("orderDetails", orderDetails);

        return result;
    }
}
