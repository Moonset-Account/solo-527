package com.badminton.arena.service.impl;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.badminton.arena.context.UserContext;
import com.badminton.arena.dto.BookingDTO;
import com.badminton.arena.entity.Booking;
import com.badminton.arena.entity.Court;
import com.badminton.arena.exception.BusinessException;
import com.badminton.arena.mapper.BookingMapper;
import com.badminton.arena.service.BookingService;
import com.badminton.arena.service.CourtService;
import com.badminton.arena.vo.BookingVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookingServiceImpl extends ServiceImpl<BookingMapper, Booking> implements BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingServiceImpl.class);

    @Autowired
    private CourtService courtService;

    private static final LocalTime OPEN_TIME = LocalTime.of(8, 0);
    private static final LocalTime CLOSE_TIME = LocalTime.of(22, 0);

    @Override
    @Transactional
    public BookingVO createBooking(BookingDTO bookingDTO) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            throw new BusinessException("用户未登录");
        }

        Court court = courtService.getById(bookingDTO.getCourtId());
        if (court == null) {
            throw new BusinessException("场地不存在");
        }
        if (court.getStatus() != 1) {
            throw new BusinessException("场地当前不可用");
        }

        LocalDate bookingDate = bookingDTO.getBookingDate();
        LocalTime startTime = bookingDTO.getStartTime();
        LocalTime endTime = bookingDTO.getEndTime();

        if (bookingDate.isBefore(LocalDate.now())) {
            throw new BusinessException("不能预约过去的日期");
        }

        if (startTime.isBefore(OPEN_TIME) || endTime.isAfter(CLOSE_TIME)) {
            throw new BusinessException("预约时间需在营业时间内（08:00-22:00）");
        }

        if (!endTime.isAfter(startTime)) {
            throw new BusinessException("结束时间必须晚于开始时间");
        }

        if (checkTimeConflict(bookingDTO.getCourtId(), bookingDate, startTime, endTime, null)) {
            throw new BusinessException("该时段已被预约，请选择其他时段");
        }

        long hours = Duration.between(startTime, endTime).toMinutes() / 60;
        if (hours < 1) {
            hours = 1;
        }
        BigDecimal totalAmount = court.getPricePerHour().multiply(BigDecimal.valueOf(hours));

        Booking booking = new Booking();
        booking.setBookingNo(IdUtil.simpleUUID());
        booking.setUserId(userId);
        booking.setCourtId(bookingDTO.getCourtId());
        booking.setBookingDate(bookingDate);
        booking.setStartTime(startTime);
        booking.setEndTime(endTime);
        booking.setTotalAmount(totalAmount);
        booking.setPayAmount(BigDecimal.ZERO);
        booking.setStatus(0);
        booking.setRemark(bookingDTO.getRemark());
        save(booking);

        return convertToBookingVO(booking, court);
    }

    @Override
    @Transactional
    public boolean cancelBooking(Long bookingId) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            throw new BusinessException("用户未登录");
        }

        Booking booking = getById(bookingId);
        if (booking == null) {
            throw new BusinessException("预约不存在");
        }

        if (!booking.getUserId().equals(userId)) {
            throw new BusinessException("只能取消自己的预约");
        }

        if (booking.getStatus() == 2) {
            throw new BusinessException("预约已取消");
        }

        if (booking.getStatus() == 1) {
            throw new BusinessException("已支付的预约请先申请退款");
        }

        booking.setStatus(2);
        return updateById(booking);
    }

    @Override
    public List<LocalTime[]> getAvailableSlots(Long courtId, LocalDate date) {
        Court court = courtService.getById(courtId);
        if (court == null) {
            throw new BusinessException("场地不存在");
        }

        List<Booking> bookings = baseMapper.selectConflictingBookings(courtId, date);

        List<LocalTime[]> busySlots = bookings.stream()
                .map(b -> new LocalTime[]{b.getStartTime(), b.getEndTime()})
                .sorted(Comparator.comparing(slot -> slot[0]))
                .collect(Collectors.toList());

        List<LocalTime[]> availableSlots = new ArrayList<>();
        LocalTime current = OPEN_TIME;

        if (date.isEqual(LocalDate.now())) {
            LocalTime now = LocalTime.now();
            if (now.isAfter(current)) {
                current = now.plusMinutes(30);
                if (current.getMinute() % 30 != 0) {
                    current = current.withMinute(0).plusHours(1);
                }
            }
        }

        for (LocalTime[] busy : busySlots) {
            if (current.isBefore(busy[0])) {
                availableSlots.add(new LocalTime[]{current, busy[0]});
            }
            if (busy[1].isAfter(current)) {
                current = busy[1];
            }
        }

        if (current.isBefore(CLOSE_TIME)) {
            availableSlots.add(new LocalTime[]{current, CLOSE_TIME});
        }

        return availableSlots;
    }

    @Override
    public Page<BookingVO> getMyBookings(int pageNum, int pageSize, Integer status) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            throw new BusinessException("用户未登录");
        }

        LambdaQueryWrapper<Booking> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Booking::getUserId, userId);
        if (status != null) {
            wrapper.eq(Booking::getStatus, status);
        }
        wrapper.orderByDesc(Booking::getCreateTime);

        Page<Booking> bookingPage = page(new Page<>(pageNum, pageSize), wrapper);
        Page<BookingVO> voPage = new Page<>(bookingPage.getCurrent(), bookingPage.getSize(), bookingPage.getTotal());

        List<BookingVO> voList = bookingPage.getRecords().stream()
                .map(booking -> {
                    Court court = courtService.getById(booking.getCourtId());
                    return convertToBookingVO(booking, court);
                })
                .collect(Collectors.toList());

        voPage.setRecords(voList);
        return voPage;
    }

    @Override
    public BookingVO getBookingDetail(Long bookingId) {
        Booking booking = getById(bookingId);
        if (booking == null) {
            throw new BusinessException("预约不存在");
        }

        Long userId = UserContext.getUserId();
        if (userId == null) {
            throw new BusinessException("用户未登录");
        }
        if (!booking.getUserId().equals(userId)) {
            throw new BusinessException("无权查看他人预约");
        }

        Court court = courtService.getById(booking.getCourtId());
        return convertToBookingVO(booking, court);
    }

    @Override
    public boolean checkTimeConflict(Long courtId, LocalDate date, LocalTime startTime, LocalTime endTime, Long excludeBookingId) {
        List<Booking> bookings = baseMapper.selectConflictingBookings(courtId, date);

        for (Booking booking : bookings) {
            if (excludeBookingId != null && booking.getId().equals(excludeBookingId)) {
                continue;
            }

            LocalTime bStart = booking.getStartTime();
            LocalTime bEnd = booking.getEndTime();

            if (startTime.isBefore(bEnd) && endTime.isAfter(bStart)) {
                return true;
            }
        }
        return false;
    }

    private BookingVO convertToBookingVO(Booking booking, Court court) {
        BookingVO vo = new BookingVO();
        BeanUtils.copyProperties(booking, vo);
        if (court != null) {
            vo.setCourtName(court.getName());
            vo.setCourtNo(court.getCourtNo());
        }
        return vo;
    }
}
