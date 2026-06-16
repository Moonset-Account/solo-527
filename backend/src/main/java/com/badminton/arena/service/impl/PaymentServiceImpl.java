package com.badminton.arena.service.impl;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.badminton.arena.context.UserContext;
import com.badminton.arena.dto.PaymentDTO;
import com.badminton.arena.entity.Booking;
import com.badminton.arena.entity.Payment;
import com.badminton.arena.exception.BusinessException;
import com.badminton.arena.mapper.PaymentMapper;
import com.badminton.arena.service.BookingService;
import com.badminton.arena.service.PaymentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class PaymentServiceImpl extends ServiceImpl<PaymentMapper, Payment> implements PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentServiceImpl.class);

    @Autowired
    private BookingService bookingService;

    @Override
    @Transactional
    public Payment createPayment(PaymentDTO paymentDTO) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            throw new BusinessException("用户未登录");
        }

        Booking booking = bookingService.getById(paymentDTO.getBookingId());
        if (booking == null) {
            throw new BusinessException("预约不存在");
        }

        if (!booking.getUserId().equals(userId)) {
            throw new BusinessException("只能支付自己的预约");
        }

        if (booking.getStatus() == 1) {
            throw new BusinessException("该预约已支付");
        }

        if (booking.getStatus() == 2) {
            throw new BusinessException("该预约已取消");
        }

        BigDecimal payAmount = paymentDTO.getAmount();
        if (payAmount == null) {
            payAmount = booking.getTotalAmount();
        }

        LambdaQueryWrapper<Payment> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Payment::getBookingId, paymentDTO.getBookingId())
                .eq(Payment::getStatus, 0);
        Payment existPayment = getOne(wrapper);
        if (existPayment != null) {
            return existPayment;
        }

        Payment payment = new Payment();
        payment.setPayNo(IdUtil.simpleUUID());
        payment.setBookingId(paymentDTO.getBookingId());
        payment.setUserId(userId);
        payment.setAmount(payAmount);
        payment.setPayType(paymentDTO.getPayType());
        payment.setStatus(0);
        save(payment);

        return payment;
    }

    @Override
    @Transactional
    public boolean payCallback(String payNo, String transactionId, boolean success) {
        LambdaQueryWrapper<Payment> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Payment::getPayNo, payNo);
        Payment payment = getOne(wrapper);
        if (payment == null) {
            throw new BusinessException("支付记录不存在");
        }

        if (payment.getStatus() == 1) {
            return true;
        }

        if (success) {
            payment.setStatus(1);
            payment.setTransactionId(transactionId);
            payment.setPayTime(LocalDateTime.now());
            updateById(payment);

            Booking booking = bookingService.getById(payment.getBookingId());
            if (booking != null) {
                booking.setStatus(1);
                booking.setPayAmount(payment.getAmount());
                booking.setPayTime(LocalDateTime.now());
                bookingService.updateById(booking);
            }
        } else {
            payment.setStatus(2);
            updateById(payment);
        }

        return true;
    }

    @Override
    public Payment getPaymentByPayNo(String payNo) {
        LambdaQueryWrapper<Payment> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Payment::getPayNo, payNo);
        Payment payment = getOne(wrapper);
        if (payment == null) {
            throw new BusinessException("支付记录不存在");
        }
        return payment;
    }

    @Override
    public Payment getPaymentByBookingId(Long bookingId) {
        LambdaQueryWrapper<Payment> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Payment::getBookingId, bookingId);
        return getOne(wrapper);
    }

    @Override
    public Integer getPaymentStatus(Long bookingId) {
        Payment payment = getPaymentByBookingId(bookingId);
        if (payment == null) {
            return -1;
        }
        return payment.getStatus();
    }
}
