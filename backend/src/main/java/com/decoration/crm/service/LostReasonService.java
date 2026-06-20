package com.decoration.crm.service;

import com.decoration.crm.entity.LostReason;
import java.util.List;

public interface LostReasonService {
    List<LostReason> getAll();
    List<LostReason> getEnabled();
    LostReason create(LostReason reason);
    LostReason update(Long id, LostReason reason);
    void delete(Long id);
}
