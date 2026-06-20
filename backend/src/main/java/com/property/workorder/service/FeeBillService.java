package com.property.workorder.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.property.workorder.common.PageResult;
import com.property.workorder.entity.FeeBill;
import com.property.workorder.entity.PaymentRecord;
import com.property.workorder.entity.Resident;
import com.property.workorder.mapper.FeeBillMapper;
import com.property.workorder.mapper.PaymentRecordMapper;
import com.property.workorder.mapper.ResidentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FeeBillService {

    private final FeeBillMapper feeBillMapper;
    private final PaymentRecordMapper paymentRecordMapper;
    private final ResidentMapper residentMapper;

    public PageResult<FeeBill> getResidentBills(Long residentId, Integer current, Integer size, String status) {
        Page<FeeBill> page = new Page<>(current, size);
        LambdaQueryWrapper<FeeBill> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(FeeBill::getResidentId, residentId);
        if (status != null && !status.isEmpty()) {
            wrapper.eq(FeeBill::getStatus, status);
        }
        wrapper.orderByDesc(FeeBill::getBillDate);
        return PageResult.of(feeBillMapper.selectPage(page, wrapper));
    }

    public PageResult<FeeBill> queryBills(String buildingNo, String roomNo, String feeType,
                                           String billPeriod, String status,
                                           Integer current, Integer size) {
        Page<FeeBill> page = new Page<>(current, size);
        LambdaQueryWrapper<FeeBill> wrapper = new LambdaQueryWrapper<>();
        if (buildingNo != null && !buildingNo.isEmpty()) {
            wrapper.eq(FeeBill::getBuildingNo, buildingNo);
        }
        if (roomNo != null && !roomNo.isEmpty()) {
            wrapper.eq(FeeBill::getRoomNo, roomNo);
        }
        if (feeType != null && !feeType.isEmpty()) {
            wrapper.eq(FeeBill::getFeeType, feeType);
        }
        if (billPeriod != null && !billPeriod.isEmpty()) {
            wrapper.eq(FeeBill::getBillPeriod, billPeriod);
        }
        if (status != null && !status.isEmpty()) {
            wrapper.eq(FeeBill::getStatus, status);
        }
        wrapper.orderByDesc(FeeBill::getBillDate);
        return PageResult.of(feeBillMapper.selectPage(page, wrapper));
    }

    public List<FeeBill> queryBillsForExport(String buildingNo, String roomNo, String feeType,
                                              String billPeriod, String status) {
        LambdaQueryWrapper<FeeBill> wrapper = new LambdaQueryWrapper<>();
        if (buildingNo != null && !buildingNo.isEmpty()) {
            wrapper.eq(FeeBill::getBuildingNo, buildingNo);
        }
        if (roomNo != null && !roomNo.isEmpty()) {
            wrapper.eq(FeeBill::getRoomNo, roomNo);
        }
        if (feeType != null && !feeType.isEmpty()) {
            wrapper.eq(FeeBill::getFeeType, feeType);
        }
        if (billPeriod != null && !billPeriod.isEmpty()) {
            wrapper.eq(FeeBill::getBillPeriod, billPeriod);
        }
        if (status != null && !status.isEmpty()) {
            wrapper.eq(FeeBill::getStatus, status);
        }
        wrapper.orderByDesc(FeeBill::getBillDate);
        return feeBillMapper.selectList(wrapper);
    }

    public List<Map<String, Object>> getPaymentProgress(String buildingNo, String feeType,
                                                         String billPeriod) {
        Map<String, Object> params = new HashMap<>();
        params.put("buildingNo", buildingNo);
        params.put("feeType", feeType);
        params.put("billPeriod", billPeriod);
        return feeBillMapper.selectPaymentProgress(params);
    }

    @Transactional(rollbackFor = Exception.class)
    public PaymentRecord payBill(Long billId, BigDecimal amount, String method, Long operatorId) {
        FeeBill bill = feeBillMapper.selectById(billId);
        if (bill == null) {
            throw new RuntimeException("账单不存在");
        }
        BigDecimal remainAmount = bill.getTotalAmount().subtract(bill.getPaidAmount());
        if (amount.compareTo(remainAmount) > 0) {
            throw new RuntimeException("支付金额超过未缴金额");
        }

        BigDecimal newPaidAmount = bill.getPaidAmount().add(amount);
        bill.setPaidAmount(newPaidAmount);
        if (newPaidAmount.compareTo(bill.getTotalAmount()) >= 0) {
            bill.setStatus("PAID");
        } else {
            bill.setStatus("PARTIAL_PAID");
        }
        feeBillMapper.updateById(bill);

        PaymentRecord record = new PaymentRecord();
        record.setPaymentNo("PAY" + System.currentTimeMillis());
        record.setBillId(billId);
        record.setResidentId(bill.getResidentId());
        record.setAmount(amount);
        record.setMethod(method);
        record.setStatus(1);
        record.setPaidAt(LocalDateTime.now());
        record.setOperatorId(operatorId);
        paymentRecordMapper.insert(record);

        return record;
    }

    public FeeBill getBillDetail(Long id) {
        return feeBillMapper.selectById(id);
    }

    public Map<String, Object> getResidentBillSummary(Long residentId) {
        Resident resident = residentMapper.selectById(residentId);
        LambdaQueryWrapper<FeeBill> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(FeeBill::getResidentId, residentId);
        List<FeeBill> bills = feeBillMapper.selectList(wrapper);

        BigDecimal totalUnpaid = BigDecimal.ZERO;
        int unpaidCount = 0;
        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal totalPaid = BigDecimal.ZERO;

        for (FeeBill bill : bills) {
            totalAmount = totalAmount.add(bill.getTotalAmount());
            totalPaid = totalPaid.add(bill.getPaidAmount());
            BigDecimal unpaid = bill.getTotalAmount().subtract(bill.getPaidAmount());
            if (unpaid.compareTo(BigDecimal.ZERO) > 0) {
                totalUnpaid = totalUnpaid.add(unpaid);
                unpaidCount++;
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("resident", resident);
        result.put("totalBills", bills.size());
        result.put("unpaidCount", unpaidCount);
        result.put("totalAmount", totalAmount);
        result.put("totalPaid", totalPaid);
        result.put("totalUnpaid", totalUnpaid);
        return result;
    }
}
