package com.finance.approval.repository;

import com.finance.approval.entity.ExpenseAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface ExpenseAttachmentRepository extends JpaRepository<ExpenseAttachment, Long> {

    List<ExpenseAttachment> findByApplicationId(Long applicationId);

    @Transactional
    void deleteByApplicationId(Long applicationId);
}
