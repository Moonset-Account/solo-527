package com.badminton.arena.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.badminton.arena.entity.Booking;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Mapper
public interface BookingMapper extends BaseMapper<Booking> {

    @Select("SELECT * FROM booking WHERE court_id = #{courtId} AND booking_date = #{bookingDate} " +
            "AND status IN (0, 1) AND deleted = 0")
    List<Booking> selectConflictingBookings(@Param("courtId") Long courtId,
                                            @Param("bookingDate") LocalDate bookingDate);
}
