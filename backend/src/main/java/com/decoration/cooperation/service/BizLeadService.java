package com.decoration.cooperation.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.decoration.cooperation.common.PageQuery;
import com.decoration.cooperation.common.PageResult;
import com.decoration.cooperation.dto.LeadCreateDTO;
import com.decoration.cooperation.entity.BizLead;
import com.decoration.cooperation.vo.LeadDetailVO;

import java.util.List;

public interface BizLeadService extends IService<BizLead> {

    BizLead createLead(LeadCreateDTO dto);

    LeadDetailVO getLeadDetail(Long id);

    void updateLead(BizLead lead);

    PageResult<BizLead> listLeads(PageQuery pageQuery);

    void assignLead(Long id, Long ownerId);

    List<BizLead> detectConflict(Long id);

    void updateStatus(Long id, String status, String remark);
}
