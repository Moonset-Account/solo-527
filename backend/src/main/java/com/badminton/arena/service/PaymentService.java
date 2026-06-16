package com.badminton.arena.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.badminton.arena.dto.PaymentDTO;
import com.badminton.arena.entity.Payment;

public interface PaymentService extends IService<Payment> {

    Payment createPayment(PaymentDTO paymentDTO);

    boolean payCallback(String payNo, String transactionId, boolean success);

    Payment getPaymentByPayNo(String payNo);

    Payment getPaymentByBookingId(Long bookingId);

    Integer getPaymentStatus(Long bookingId);
}
