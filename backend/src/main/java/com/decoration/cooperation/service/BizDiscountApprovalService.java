package com.decoration.cooperation.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.decoration.cooperation.common.PageQuery;
import com.decoration.cooperation.common.PageResult;
import com.decoration.cooperation.dto.ApprovalActionDTO;
import com.decoration.cooperation.dto.DiscountApprovalCreateDTO;
import com.decoration.cooperation.entity.BizDiscountApproval;

import java.util.Map;

public interface BizDiscountApprovalService extends IService<BizDiscountApproval> {

    BizDiscountApproval createApproval(DiscountApprovalCreateDTO dto);

    void submitApproval(Long id);

    void approve(ApprovalActionDTO dto);

    void reject(ApprovalActionDTO dto);

    PageResult<BizDiscountApproval> listApprovals(PageQuery pageQuery);

    Map<String, Object> getApprovalDetail(Long id);
}
