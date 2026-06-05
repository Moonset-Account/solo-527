package com.gym.controller;

import com.gym.common.enums.CourseTypeEnum;
import com.gym.common.response.Result;
import com.gym.entity.Booking;
import com.gym.service.BookingService;
import jakarta.validation.constraints.NotNull;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTION', 'COACH')")
    public Result<Booking> createBooking(@RequestBody BookingCreateRequest request) {
        try {
            Booking booking = bookingService.createBooking(
                    request.getMemberId(),
                    request.getCoachId(),
                    request.getMemberPackageId(),
                    request.getGroupClassId(),
                    request.getStartTime(),
                    request.getEndTime(),
                    request.getCourseType()
            );
            return Result.success(booking);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PutMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTION', 'COACH')")
    public Result<Booking> completeBooking(@PathVariable Long id) {
        try {
            return Result.success(bookingService.completeBooking(id));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTION', 'COACH')")
    public Result<Booking> cancelBooking(@PathVariable Long id, @RequestParam(required = false) String reason) {
        try {
            return Result.success(bookingService.cancelBooking(id, reason));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/member/{memberId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTION', 'COACH')")
    public Result<List<Booking>> getMemberBookings(@PathVariable Long memberId) {
        return Result.success(bookingService.getMemberBookings(memberId));
    }

    @GetMapping("/coach/{coachId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTION', 'COACH')")
    public Result<List<Booking>> getCoachBookings(
            @PathVariable Long coachId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return Result.success(bookingService.getCoachBookings(coachId, date));
    }

    public static class BookingCreateRequest {
        @NotNull(message = "会员ID不能为空")
        private Long memberId;
        @NotNull(message = "教练ID不能为空")
        private Long coachId;
        private Long memberPackageId;
        private Long groupClassId;
        @NotNull(message = "开始时间不能为空")
        private LocalDateTime startTime;
        @NotNull(message = "结束时间不能为空")
        private LocalDateTime endTime;
        @NotNull(message = "课程类型不能为空")
        private CourseTypeEnum courseType;

        public Long getMemberId() {
            return memberId;
        }

        public void setMemberId(Long memberId) {
            this.memberId = memberId;
        }

        public Long getCoachId() {
            return coachId;
        }

        public void setCoachId(Long coachId) {
            this.coachId = coachId;
        }

        public Long getMemberPackageId() {
            return memberPackageId;
        }

        public void setMemberPackageId(Long memberPackageId) {
            this.memberPackageId = memberPackageId;
        }

        public Long getGroupClassId() {
            return groupClassId;
        }

        public void setGroupClassId(Long groupClassId) {
            this.groupClassId = groupClassId;
        }

        public LocalDateTime getStartTime() {
            return startTime;
        }

        public void setStartTime(LocalDateTime startTime) {
            this.startTime = startTime;
        }

        public LocalDateTime getEndTime() {
            return endTime;
        }

        public void setEndTime(LocalDateTime endTime) {
            this.endTime = endTime;
        }

        public CourseTypeEnum getCourseType() {
            return courseType;
        }

        public void setCourseType(CourseTypeEnum courseType) {
            this.courseType = courseType;
        }
    }
}
