package com.badminton.arena.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.badminton.arena.dto.BookingDTO;
import com.badminton.arena.entity.Booking;
import com.badminton.arena.vo.BookingVO;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface BookingService extends IService<Booking> {

    BookingVO createBooking(BookingDTO bookingDTO);

    boolean cancelBooking(Long bookingId);

    List<LocalTime[]> getAvailableSlots(Long courtId, LocalDate date);

    Page<BookingVO> getMyBookings(int pageNum, int pageSize, Integer status);

    BookingVO getBookingDetail(Long bookingId);

    boolean checkTimeConflict(Long courtId, LocalDate date, LocalTime startTime, LocalTime endTime, Long excludeBookingId);
}
