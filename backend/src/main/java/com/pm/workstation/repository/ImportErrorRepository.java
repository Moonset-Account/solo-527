package com.pm.workstation.repository;

import com.pm.workstation.entity.ImportError;
import com.pm.workstation.enums.ImportErrorStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ImportErrorRepository extends JpaRepository<ImportError, Long> {

    List<ImportError> findByBatchNo(String batchNo);

    List<ImportError> findByStatus(ImportErrorStatus status);

    List<ImportError> findByBatchNoAndStatus(String batchNo, ImportErrorStatus status);

    long countByBatchNoAndStatus(String batchNo, ImportErrorStatus status);
}
