package com.decoration.crm.service;

import com.decoration.crm.entity.LeadTag;
import java.util.List;

public interface LeadTagService {
    List<LeadTag> getAll();
    List<LeadTag> getByCategory(String category);
    LeadTag create(LeadTag tag);
    LeadTag update(Long id, LeadTag tag);
    void delete(Long id);
}
