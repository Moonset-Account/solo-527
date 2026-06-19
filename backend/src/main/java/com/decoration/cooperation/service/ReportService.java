package com.decoration.cooperation.service;

import com.decoration.cooperation.common.PageQuery;
import com.decoration.cooperation.common.PageResult;
import com.decoration.cooperation.vo.DealPredictionVO;
import com.decoration.cooperation.vo.PaymentProgressVO;

import java.util.Map;

public interface ReportService {

    DealPredictionVO getDealPrediction();

    PageResult<PaymentProgressVO> getPaymentProgressReport(PageQuery pageQuery);

    PaymentProgressVO getPaymentProgressDetail(Long contractId);

    Map<String, Object> getDashboardStatistics();
}
