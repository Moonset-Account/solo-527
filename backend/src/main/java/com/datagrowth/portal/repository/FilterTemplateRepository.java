package com.datagrowth.portal.repository;

import com.datagrowth.portal.entity.FilterTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FilterTemplateRepository extends JpaRepository<FilterTemplate, Long> {

    List<FilterTemplate> findByUserId(Long userId);

    List<FilterTemplate> findByPageCode(String pageCode);

    Page<FilterTemplate> findByPageCode(String pageCode, Pageable pageable);

    List<FilterTemplate> findByUserIdAndPageCode(Long userId, String pageCode);

    List<FilterTemplate> findByIsPublicTrue();

    List<FilterTemplate> findByIsPublicTrueAndPageCode(String pageCode);

    List<FilterTemplate> findAllByOrderByUseCountDescCreatedAtDesc();

    List<FilterTemplate> findByPageCodeOrderByUseCountDescCreatedAtDesc(String pageCode);
}
