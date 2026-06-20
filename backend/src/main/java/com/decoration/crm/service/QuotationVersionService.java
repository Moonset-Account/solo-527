package com.decoration.crm.service;

import com.decoration.crm.entity.QuotationVersion;
import java.util.List;

public interface QuotationVersionService {
    List<QuotationVersion> getByLeadId(Long leadId);
    QuotationVersion getById(Long id);
    QuotationVersion create(QuotationVersion quotation);
    QuotationVersion update(Long id, QuotationVersion quotation);
    void delete(Long id);
    void setCurrent(Long id);
}
