package com.decoration.cooperation.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.decoration.cooperation.common.PageQuery;
import com.decoration.cooperation.common.PageResult;
import com.decoration.cooperation.entity.BizContract;

import java.util.Map;

public interface BizContractService extends IService<BizContract> {

    BizContract createContract(BizContract contract);

    BizContract getById(Long id);

    PageResult<BizContract> listContracts(PageQuery pageQuery);

    void updateStatus(Long id, String status, String remark);

    Map<String, Object> getContractDetail(Long id);
}
