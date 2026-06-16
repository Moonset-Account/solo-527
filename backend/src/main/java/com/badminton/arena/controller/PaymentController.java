package com.badminton.arena.controller;

import cn.hutool.core.util.IdUtil;
import com.badminton.arena.common.Result;
import com.badminton.arena.dto.PaymentDTO;
import com.badminton.arena.entity.Payment;
import com.badminton.arena.service.PaymentService;
import javax.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payment")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping
    public Result<Payment> createPayment(@Valid @RequestBody PaymentDTO paymentDTO) {
        Payment payment = paymentService.createPayment(paymentDTO);
        return Result.success(payment);
    }

    @PostMapping("/mock-pay/{payNo}")
    public Result<String> mockPay(@PathVariable String payNo) {
        String transactionId = "MOCK_" + IdUtil.simpleUUID();
        paymentService.payCallback(payNo, transactionId, true);
        return Result.success("模拟支付成功");
    }

    @PostMapping("/callback")
    public Result<Void> payCallback(@RequestParam String payNo,
                                    @RequestParam String transactionId,
                                    @RequestParam boolean success) {
        paymentService.payCallback(payNo, transactionId, success);
        return Result.success();
    }

    @GetMapping("/{payNo}")
    public Result<Payment> getPaymentByPayNo(@PathVariable String payNo) {
        Payment payment = paymentService.getPaymentByPayNo(payNo);
        return Result.success(payment);
    }

    @GetMapping("/booking/{bookingId}")
    public Result<Payment> getPaymentByBookingId(@PathVariable Long bookingId) {
        Payment payment = paymentService.getPaymentByBookingId(bookingId);
        return Result.success(payment);
    }

    @GetMapping("/status/{bookingId}")
    public Result<Integer> getPaymentStatus(@PathVariable Long bookingId) {
        Integer status = paymentService.getPaymentStatus(bookingId);
        return Result.success(status);
    }
}
