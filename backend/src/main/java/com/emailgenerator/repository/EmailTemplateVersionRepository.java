package com.emailgenerator.repository;

import com.emailgenerator.entity.EmailTemplateVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmailTemplateVersionRepository extends JpaRepository<EmailTemplateVersion, Long>, JpaSpecificationExecutor<EmailTemplateVersion> {

    List<EmailTemplateVersion> findByTemplateIdOrderByVersionDesc(Long templateId);

    EmailTemplateVersion findByTemplateIdAndVersion(Long templateId, Integer version);
}
