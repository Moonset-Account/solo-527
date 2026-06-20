package com.decoration.crm.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.decoration.crm.dto.PageQuery;
import com.decoration.crm.entity.LeadCustomer;
import com.decoration.crm.entity.LeadTag;
import java.util.List;

public interface LeadCustomerService {
    IPage<LeadCustomer> getPage(PageQuery query);
    LeadCustomer getById(Long id);
    LeadCustomer create(LeadCustomer lead);
    LeadCustomer update(Long id, LeadCustomer lead);
    void delete(Long id);
    void assignOwner(Long id, Long ownerId);
    void updateLevel(Long id, String level);
    void updateStatus(Long id, String status);
    void addTags(Long id, List<Long> tagIds);
    void removeTags(Long id, List<Long> tagIds);
    List<LeadTag> getTags(Long id);
    void claimFromPublicSea(Long id);
    void releaseToPublicSea(Long id);
    void markLost(Long id, Long lostReasonId, String remark);
}
