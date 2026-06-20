package com.decoration.crm.service;

import com.decoration.crm.entity.PublicSeaRule;
import java.util.List;

public interface PublicSeaRuleService {
    List<PublicSeaRule> getAll();
    List<PublicSeaRule> getEnabled();
    PublicSeaRule create(PublicSeaRule rule);
    PublicSeaRule update(Long id, PublicSeaRule rule);
    void delete(Long id);
}
