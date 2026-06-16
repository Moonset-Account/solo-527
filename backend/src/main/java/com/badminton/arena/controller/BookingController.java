package com.badminton.arena.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.badminton.arena.common.PageResult;
import com.badminton.arena.common.Result;
import com.badminton.arena.dto.BookingDTO;
import com.badminton.arena.service.BookingService;
import com.badminton.arena.vo.BookingVO;
import javax.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/booking")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @PostMapping
    public Result<BookingVO> createBooking(@Valid @RequestBody BookingDTO bookingDTO) {
        BookingVO bookingVO = bookingService.createBooking(bookingDTO);
        return Result.success(bookingVO);
    }

    @PutMapping("/cancel/{id}")
    public Result<Void> cancelBooking(@PathVariable Long id) {
        bookingService.cancelBooking(id);
        return Result.success();
    }

    @GetMapping("/available-slots")
    public Result<List<LocalTime[]>> getAvailableSlots(@RequestParam Long courtId,
                                                       @RequestParam LocalDate date) {
        List<LocalTime[]> slots = bookingService.getAvailableSlots(courtId, date);
        return Result.success(slots);
    }

    @GetMapping("/my")
    public Result<PageResult<BookingVO>> getMyBookings(@RequestParam(defaultValue = "1") int pageNum,
                                                       @RequestParam(defaultValue = "10") int pageSize,
                                                       @RequestParam(required = false) Integer status) {
        Page<BookingVO> page = bookingService.getMyBookings(pageNum, pageSize, status);
        PageResult<BookingVO> pageResult = new PageResult<>(
                page.getTotal(),
                page.getPages(),
                page.getCurrent(),
                page.getSize(),
                page.getRecords()
        );
        return Result.success(pageResult);
    }

    @GetMapping("/{id}")
    public Result<BookingVO> getBookingDetail(@PathVariable Long id) {
        BookingVO bookingVO = bookingService.getBookingDetail(id);
        return Result.success(bookingVO);
    }

    @GetMapping("/check-conflict")
    public Result<Boolean> checkTimeConflict(@RequestParam Long courtId,
                                             @RequestParam LocalDate date,
                                             @RequestParam LocalTime startTime,
                                             @RequestParam LocalTime endTime,
                                             @RequestParam(required = false) Long excludeBookingId) {
        boolean conflict = bookingService.checkTimeConflict(courtId, date, startTime, endTime, excludeBookingId);
        return Result.success(conflict);
    }
}
