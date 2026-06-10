package com.courselearning.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.courselearning.common.PageResult;
import com.courselearning.common.ResultCode;
import com.courselearning.dto.OrderCreateDTO;
import com.courselearning.entity.CommissionLog;
import com.courselearning.entity.Course;
import com.courselearning.entity.SysUser;
import com.courselearning.entity.UserOrder;
import com.courselearning.mapper.CommissionLogMapper;
import com.courselearning.mapper.CourseMapper;
import com.courselearning.mapper.SysUserMapper;
import com.courselearning.mapper.UserOrderMapper;
import com.courselearning.util.SecurityUtils;
import cn.hutool.core.util.IdUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OrderService {

    @Autowired
    private UserOrderMapper userOrderMapper;

    @Autowired
    private CourseMapper courseMapper;

    @Autowired
    private SysUserMapper sysUserMapper;

    @Autowired
    private CommissionLogMapper commissionLogMapper;

    @Autowired
    private NotificationService notificationService;

    private static final BigDecimal COMMISSION_RATE = new BigDecimal("0.30");

    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> createOrder(OrderCreateDTO dto) {
        Long userId = SecurityUtils.getCurrentUserId();

        Course course = courseMapper.selectById(dto.getCourseId());
        if (course == null) {
            throw new RuntimeException(ResultCode.COURSE_NOT_EXIST.getMessage());
        }
        if (course.getStatus() != 1) {
            throw new RuntimeException(ResultCode.COURSE_OFF_SHELF.getMessage());
        }

        SysUser user = sysUserMapper.selectById(userId);

        UserOrder order = new UserOrder();
        order.setOrderNo(IdUtil.getSnowflakeNextIdStr());
        order.setUserId(userId);
        order.setCourseId(dto.getCourseId());
        order.setOrderType(dto.getOrderType() != null ? dto.getOrderType() : "COURSE");
        order.setAmount(dto.getAmount() != null ? dto.getAmount() : course.getPrice());
        order.setPayAmount(order.getAmount());
        order.setPayStatus(0);
        order.setPayMethod(dto.getPayMethod());
        order.setMemberDays(dto.getMemberDays());
        order.setCommissionStatus(0);
        order.setStatus(1);
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());

        if (user.getReferrerId() != null) {
            order.setReferrerId(user.getReferrerId());
            order.setCommissionAmount(order.getPayAmount().multiply(COMMISSION_RATE));
        }

        userOrderMapper.insert(order);

        Map<String, Object> result = new HashMap<>();
        result.put("orderId", order.getId());
        result.put("orderNo", order.getOrderNo());
        result.put("amount", order.getPayAmount());
        return result;
    }

    @Transactional(rollbackFor = Exception.class)
    public void paymentCallback(String orderNo, Integer payStatus, String payMethod) {
        LambdaQueryWrapper<UserOrder> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserOrder::getOrderNo, orderNo);
        UserOrder order = userOrderMapper.selectOne(wrapper);

        if (order == null) {
            throw new RuntimeException(ResultCode.ORDER_NOT_EXIST.getMessage());
        }
        if (order.getPayStatus() == 1) {
            throw new RuntimeException(ResultCode.ORDER_PAID.getMessage());
        }

        if (payStatus == 1) {
            order.setPayStatus(1);
            order.setPayTime(LocalDateTime.now());
            order.setPayMethod(payMethod);
            order.setUpdatedAt(LocalDateTime.now());

            if (order.getMemberDays() != null && order.getMemberDays() > 0) {
                SysUser user = sysUserMapper.selectById(order.getUserId());
                LocalDateTime expireTime = user.getMemberExpireTime();
                if (expireTime == null || expireTime.isBefore(LocalDateTime.now())) {
                    expireTime = LocalDateTime.now();
                }
                user.setMemberExpireTime(expireTime.plusDays(order.getMemberDays()));
                sysUserMapper.updateById(user);
            }

            if (order.getReferrerId() != null && order.getCommissionAmount() != null) {
                order.setCommissionStatus(1);
                CommissionLog log = new CommissionLog();
                log.setOrderId(order.getId());
                log.setUserId(order.getReferrerId());
                log.setOrderUserId(order.getUserId());
                log.setAmount(order.getCommissionAmount());
                log.setLogType("COMMISSION");
                log.setBeforeStatus(0);
                log.setAfterStatus(1);
                log.setRemark("订单支付成功，佣金待结算");
                log.setCreatedAt(LocalDateTime.now());
                commissionLogMapper.insert(log);
            }

            userOrderMapper.updateById(order);
        }
    }

    public PageResult<Map<String, Object>> getOrderList(Long pageNum, Long pageSize, Integer payStatus,
                                                        Integer commissionStatus, String orderType, Long userId) {
        Page<UserOrder> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<UserOrder> wrapper = new LambdaQueryWrapper<>();
        if (payStatus != null) {
            wrapper.eq(UserOrder::getPayStatus, payStatus);
        }
        if (commissionStatus != null) {
            wrapper.eq(UserOrder::getCommissionStatus, commissionStatus);
        }
        if (orderType != null && !orderType.isEmpty()) {
            wrapper.eq(UserOrder::getOrderType, orderType);
        }
        if (userId == null) {
            Long currentUserId = SecurityUtils.getCurrentUserId();
            if (!SecurityUtils.isAdmin()) {
                wrapper.eq(UserOrder::getUserId, currentUserId);
            }
        } else {
            wrapper.eq(UserOrder::getUserId, userId);
        }
        wrapper.orderByDesc(UserOrder::getCreatedAt);
        Page<UserOrder> orderPage = userOrderMapper.selectPage(page, wrapper);

        List<Map<String, Object>> records = new ArrayList<>();
        for (UserOrder order : orderPage.getRecords()) {
            Map<String, Object> item = new HashMap<>();
            item.put("order", order);

            Course course = courseMapper.selectById(order.getCourseId());
            if (course != null) {
                Map<String, Object> courseInfo = new HashMap<>();
                courseInfo.put("id", course.getId());
                courseInfo.put("title", course.getTitle());
                courseInfo.put("cover", course.getCover());
                item.put("course", courseInfo);
            }

            SysUser user = sysUserMapper.selectById(order.getUserId());
            if (user != null) {
                Map<String, Object> userInfo = new HashMap<>();
                userInfo.put("id", user.getId());
                userInfo.put("nickname", user.getNickname());
                userInfo.put("avatar", user.getAvatar());
                item.put("user", userInfo);
            }

            records.add(item);
        }

        return PageResult.of(orderPage.getTotal(), records, pageNum, pageSize);
    }

    public Map<String, Object> getOrderDetail(Long id) {
        UserOrder order = userOrderMapper.selectById(id);
        if (order == null) {
            throw new RuntimeException(ResultCode.ORDER_NOT_EXIST.getMessage());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("order", order);

        Course course = courseMapper.selectById(order.getCourseId());
        result.put("course", course);

        SysUser user = sysUserMapper.selectById(order.getUserId());
        if (user != null) {
            user.setPassword(null);
        }
        result.put("user", user);

        LambdaQueryWrapper<CommissionLog> logWrapper = new LambdaQueryWrapper<>();
        logWrapper.eq(CommissionLog::getOrderId, id)
                .orderByDesc(CommissionLog::getCreatedAt);
        List<CommissionLog> logs = commissionLogMapper.selectList(logWrapper);
        result.put("commissionLogs", logs);

        return result;
    }

    @Transactional(rollbackFor = Exception.class)
    public void triggerCommissionDispute(Long orderId, String note) {
        UserOrder order = userOrderMapper.selectById(orderId);
        if (order == null) {
            throw new RuntimeException(ResultCode.ORDER_NOT_EXIST.getMessage());
        }
        if (order.getCommissionStatus() != 1) {
            throw new RuntimeException(ResultCode.COMMISSION_STATUS_ERROR.getMessage());
        }

        int beforeStatus = order.getCommissionStatus();
        order.setCommissionStatus(3);
        order.setCommissionDisputeNote(note);
        order.setUpdatedAt(LocalDateTime.now());
        userOrderMapper.updateById(order);

        CommissionLog log = new CommissionLog();
        log.setOrderId(orderId);
        log.setUserId(order.getReferrerId());
        log.setOrderUserId(order.getUserId());
        log.setAmount(order.getCommissionAmount());
        log.setLogType("DISPUTE");
        log.setBeforeStatus(beforeStatus);
        log.setAfterStatus(3);
        log.setRemark("佣金争议触发：" + note);
        log.setOperatorId(SecurityUtils.getCurrentUserId());
        log.setCreatedAt(LocalDateTime.now());
        commissionLogMapper.insert(log);

        if (order.getReferrerId() != null) {
            notificationService.createNotification(
                    order.getReferrerId(),
                    "COMMISSION_DISPUTE",
                    "佣金争议通知",
                    "您有一笔订单的佣金存在争议，请联系客服处理。订单号：" + order.getOrderNo(),
                    orderId
            );
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public void confirmCommissionDispute(Long orderId, boolean resolve) {
        UserOrder order = userOrderMapper.selectById(orderId);
        if (order == null) {
            throw new RuntimeException(ResultCode.ORDER_NOT_EXIST.getMessage());
        }
        if (order.getCommissionStatus() != 3) {
            throw new RuntimeException(ResultCode.COMMISSION_STATUS_ERROR.getMessage());
        }

        int beforeStatus = order.getCommissionStatus();
        int afterStatus = resolve ? 1 : 4;
        order.setCommissionStatus(afterStatus);
        order.setUpdatedAt(LocalDateTime.now());
        userOrderMapper.updateById(order);

        CommissionLog log = new CommissionLog();
        log.setOrderId(orderId);
        log.setUserId(order.getReferrerId());
        log.setOrderUserId(order.getUserId());
        log.setAmount(order.getCommissionAmount());
        log.setLogType(resolve ? "RESOLVE" : "CANCEL");
        log.setBeforeStatus(beforeStatus);
        log.setAfterStatus(afterStatus);
        log.setRemark(resolve ? "佣金争议已解决，恢复佣金" : "佣金争议确认，佣金取消");
        log.setOperatorId(SecurityUtils.getCurrentUserId());
        log.setCreatedAt(LocalDateTime.now());
        commissionLogMapper.insert(log);

        if (order.getReferrerId() != null) {
            notificationService.createNotification(
                    order.getReferrerId(),
                    "COMMISSION_RESOLVE",
                    "佣金争议处理结果",
                    "您的佣金争议已" + (resolve ? "解决" : "取消") + "。订单号：" + order.getOrderNo(),
                    orderId
            );
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public int settleCommission(Long referrerId) {
        LambdaQueryWrapper<UserOrder> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserOrder::getReferrerId, referrerId)
                .eq(UserOrder::getCommissionStatus, 1);
        List<UserOrder> orders = userOrderMapper.selectList(wrapper);

        int count = 0;
        for (UserOrder order : orders) {
            int beforeStatus = order.getCommissionStatus();
            order.setCommissionStatus(2);
            order.setUpdatedAt(LocalDateTime.now());
            userOrderMapper.updateById(order);

            CommissionLog log = new CommissionLog();
            log.setOrderId(order.getId());
            log.setUserId(referrerId);
            log.setOrderUserId(order.getUserId());
            log.setAmount(order.getCommissionAmount());
            log.setLogType("SETTLE");
            log.setBeforeStatus(beforeStatus);
            log.setAfterStatus(2);
            log.setRemark("佣金已结算");
            log.setOperatorId(SecurityUtils.getCurrentUserId());
            log.setCreatedAt(LocalDateTime.now());
            commissionLogMapper.insert(log);
            count++;
        }
        return count;
    }

    public Map<String, Object> getRepurchaseStats(Long referrerId) {
        Map<String, Object> result = new HashMap<>();

        if (referrerId == null) {
            Long currentUserId = SecurityUtils.getCurrentUserId();
            SysUser currentUser = currentUserId != null ? sysUserMapper.selectById(currentUserId) : null;
            boolean isAdmin = currentUser != null
                    && ("ADMIN".equals(currentUser.getRole()) || "TEACHER".equals(currentUser.getRole()));

            if (isAdmin) {
                LambdaQueryWrapper<UserOrder> allWrapper = new LambdaQueryWrapper<>();
                allWrapper.isNotNull(UserOrder::getReferrerId)
                        .eq(UserOrder::getPayStatus, 1);
                List<UserOrder> allOrders = userOrderMapper.selectList(allWrapper);

                Map<Long, List<UserOrder>> referrerMap = new HashMap<>();
                for (UserOrder order : allOrders) {
                    referrerMap.computeIfAbsent(order.getReferrerId(), k -> new ArrayList<>()).add(order);
                }

                List<Map<String, Object>> contributionList = new ArrayList<>();
                BigDecimal globalTotalCommission = BigDecimal.ZERO;
                BigDecimal globalFirstOrderAmount = BigDecimal.ZERO;
                BigDecimal globalRepurchaseAmount = BigDecimal.ZERO;
                int globalRecommendCount = 0;

                for (Map.Entry<Long, List<UserOrder>> entry : referrerMap.entrySet()) {
                    Long rid = entry.getKey();
                    List<UserOrder> refOrders = entry.getValue();

                    SysUser referrer = sysUserMapper.selectById(rid);

                    Map<Long, List<UserOrder>> refUserOrderMap = new HashMap<>();
                    for (UserOrder o : refOrders) {
                        refUserOrderMap.computeIfAbsent(o.getUserId(), k -> new ArrayList<>()).add(o);
                    }

                    int invitedUsers = refUserOrderMap.size();
                    globalRecommendCount += invitedUsers;
                    int refRepurchaseUsers = 0;
                    int refRepurchaseOrders = 0;
                    BigDecimal refTotalAmount = BigDecimal.ZERO;
                    BigDecimal refFirstOrderAmount = BigDecimal.ZERO;
                    BigDecimal refCommission = BigDecimal.ZERO;

                    for (Map.Entry<Long, List<UserOrder>> userEntry : refUserOrderMap.entrySet()) {
                        List<UserOrder> userOrders = userEntry.getValue();
                        userOrders.sort((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt()));
                        for (int i = 0; i < userOrders.size(); i++) {
                            BigDecimal amt = userOrders.get(i).getPayAmount() != null
                                    ? userOrders.get(i).getPayAmount() : BigDecimal.ZERO;
                            if (i == 0) {
                                refFirstOrderAmount = refFirstOrderAmount.add(amt);
                                globalFirstOrderAmount = globalFirstOrderAmount.add(amt);
                            } else {
                                refRepurchaseOrders++;
                                globalRepurchaseAmount = globalRepurchaseAmount.add(amt);
                            }
                            refTotalAmount = refTotalAmount.add(amt);
                        }
                        if (userOrders.size() > 1) {
                            refRepurchaseUsers++;
                        }
                    }

                    for (UserOrder o : refOrders) {
                        if (o.getCommissionAmount() != null && o.getCommissionStatus() != 4) {
                            refCommission = refCommission.add(o.getCommissionAmount());
                            globalTotalCommission = globalTotalCommission.add(o.getCommissionAmount());
                        }
                    }

                    double refRepurchaseRate = invitedUsers > 0 ? (double) refRepurchaseUsers / invitedUsers * 100 : 0;
                    BigDecimal refTotalContribution = refFirstOrderAmount.add(new BigDecimal(refRepurchaseOrders).multiply(new BigDecimal("500")));

                    Map<String, Object> contrib = new HashMap<>();
                    contrib.put("referrerId", rid);
                    contrib.put("referrerName", referrer != null ? referrer.getNickname() : "未知");
                    contrib.put("referrerAvatar", referrer != null ? referrer.getAvatar() : null);
                    contrib.put("recommendCount", invitedUsers);
                    contrib.put("firstOrderAmount", refFirstOrderAmount);
                    contrib.put("repurchaseAmount", globalRepurchaseAmount);
                    contrib.put("totalContribution", refTotalContribution);
                    contrib.put("repurchaseRate", String.format("%.2f", refRepurchaseRate));
                    contrib.put("commission", refCommission);
                    contrib.put("repurchaseUsers", refRepurchaseUsers);
                    contrib.put("repurchaseOrders", refRepurchaseOrders);
                    contributionList.add(contrib);
                }

                contributionList.sort((a, b) ->
                        new BigDecimal(b.get("totalContribution").toString())
                                .compareTo(new BigDecimal(a.get("totalContribution").toString())));

                int totalInvitedAll = referrerMap.values().stream()
                        .mapToInt(List::size).sum();
                double overallRepurchaseRate = globalRecommendCount > 0
                        ? contributionList.stream().mapToInt(c -> (int) c.getOrDefault("repurchaseUsers", 0)).sum()
                                * 100.0 / globalRecommendCount : 0;

                result.put("scope", "admin");
                result.put("referrerCount", referrerMap.size());
                result.put("totalInvitedUsers", totalInvitedAll);
                result.put("repurchaseRate", String.format("%.2f", overallRepurchaseRate) + "%");
                result.put("totalCommission", globalTotalCommission);
                result.put("firstOrderAmountTotal", globalFirstOrderAmount);
                result.put("repurchaseAmountTotal", globalRepurchaseAmount);
                result.put("contributionList", contributionList);

                return result;
            }

            referrerId = currentUserId;
        }

        LambdaQueryWrapper<UserOrder> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserOrder::getReferrerId, referrerId)
                .eq(UserOrder::getPayStatus, 1);
        List<UserOrder> orders = userOrderMapper.selectList(wrapper);

        Map<Long, List<UserOrder>> userOrderMap = new HashMap<>();
        for (UserOrder order : orders) {
            userOrderMap.computeIfAbsent(order.getUserId(), k -> new ArrayList<>()).add(order);
        }

        int totalUsers = userOrderMap.size();
        int repurchaseUsers = 0;
        int repurchaseOrders = 0;
        BigDecimal totalCommission = BigDecimal.ZERO;

        for (Map.Entry<Long, List<UserOrder>> entry : userOrderMap.entrySet()) {
            List<UserOrder> userOrders = entry.getValue();
            if (userOrders.size() > 1) {
                repurchaseUsers++;
                repurchaseOrders += (userOrders.size() - 1);
            }
            for (UserOrder order : userOrders) {
                if (order.getCommissionAmount() != null && order.getCommissionStatus() != 4) {
                    totalCommission = totalCommission.add(order.getCommissionAmount());
                }
            }
        }

        double repurchaseRate = totalUsers > 0 ? (double) repurchaseUsers / totalUsers * 100 : 0;

        result.put("totalInvitedUsers", totalUsers);
        result.put("repurchaseUsers", repurchaseUsers);
        result.put("repurchaseOrders", repurchaseOrders);
        result.put("repurchaseRate", String.format("%.2f", repurchaseRate) + "%");
        result.put("totalCommission", totalCommission);

        List<Map<String, Object>> userDetails = new ArrayList<>();
        for (Map.Entry<Long, List<UserOrder>> entry : userOrderMap.entrySet()) {
            SysUser user = sysUserMapper.selectById(entry.getKey());
            if (user != null) {
                Map<String, Object> userDetail = new HashMap<>();
                userDetail.put("userId", user.getId());
                userDetail.put("nickname", user.getNickname());
                userDetail.put("avatar", user.getAvatar());
                userDetail.put("orderCount", entry.getValue().size());
                userDetail.put("isRepurchase", entry.getValue().size() > 1);

                BigDecimal userCommission = BigDecimal.ZERO;
                for (UserOrder order : entry.getValue()) {
                    if (order.getCommissionAmount() != null && order.getCommissionStatus() != 4) {
                        userCommission = userCommission.add(order.getCommissionAmount());
                    }
                }
                userDetail.put("commission", userCommission);
                userDetails.add(userDetail);
            }
        }
        result.put("userDetails", userDetails);

        return result;
    }
}
