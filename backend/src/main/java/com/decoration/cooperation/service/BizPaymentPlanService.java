package com.decoration.cooperation.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.decoration.cooperation.common.PageQuery;
import com.decoration.cooperation.common.PageResult;
import com.decoration.cooperation.entity.BizPaymentPlan;
import com.decoration.cooperation.entity.BizPaymentRecord;
import com.decoration.cooperation.vo.PaymentProgressVO;

public interface BizPaymentPlanService extends IService<BizPaymentPlan> {

    PageResult<?> getPaymentProgressReport(PageQuery pageQuery);

    PaymentProgressVO getPaymentProgressDetail(Long contractId);

    BizPaymentRecord recordPayment(BizPaymentRecord record);
}
