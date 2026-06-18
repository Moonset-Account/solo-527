package com.emailgenerator.repository;

import com.emailgenerator.entity.EmailRecordVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmailRecordVersionRepository extends JpaRepository<EmailRecordVersion, Long>, JpaSpecificationExecutor<EmailRecordVersion> {

    List<EmailRecordVersion> findByRecordIdOrderByVersionDesc(Long recordId);

    EmailRecordVersion findByRecordIdAndVersion(Long recordId, Integer version);

    Integer countByRecordId(Long recordId);
}
