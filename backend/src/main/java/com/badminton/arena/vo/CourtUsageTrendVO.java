package com.badminton.arena.vo;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CourtUsageTrendVO {

    private LocalDate statDate;

    private BigDecimal usageRate;

    private BigDecimal bookedHours;

    private Integer bookingCount;

    private BigDecimal totalRevenue;

    public LocalDate getStatDate() {
        return statDate;
    }

    public void setStatDate(LocalDate statDate) {
        this.statDate = statDate;
    }

    public BigDecimal getUsageRate() {
        return usageRate;
    }

    public void setUsageRate(BigDecimal usageRate) {
        this.usageRate = usageRate;
    }

    public BigDecimal getBookedHours() {
        return bookedHours;
    }

    public void setBookedHours(BigDecimal bookedHours) {
        this.bookedHours = bookedHours;
    }

    public Integer getBookingCount() {
        return bookingCount;
    }

    public void setBookingCount(Integer bookingCount) {
        this.bookingCount = bookingCount;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }
}
