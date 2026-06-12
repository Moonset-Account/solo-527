package com.finance.approval.repository;

import com.finance.approval.entity.ChangeLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChangeLogRepository extends JpaRepository<ChangeLog, Long> {

    Page<ChangeLog> findAll(Pageable pageable);

    Page<ChangeLog> findByChangeType(String changeType, Pageable pageable);
}
