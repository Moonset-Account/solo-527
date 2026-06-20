package com.datagrowth.portal.repository;

import com.datagrowth.portal.entity.FilterTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FilterTemplateRepository extends JpaRepository<FilterTemplate, Long> {
    Page<FilterTemplate> findByUserId(Long userId, Pageable pageable);
    
    Page<FilterTemplate> findByUserIdOrIsPublicTrue(Long userId, Pageable pageable);
    
    @Query("SELECT f FROM FilterTemplate f WHERE f.pageCode = :pageCode AND (f.userId = :userId OR f.isPublic = true)")
    Page<FilterTemplate> findByPageCodeAndUserOrPublic(
        @Param("pageCode") String pageCode, 
        @Param("userId") Long userId, 
        Pageable pageable
    );
    
    @Query("SELECT f FROM FilterTemplate f WHERE f.pageCode = :pageCode AND f.userId = :userId")
    List<FilterTemplate> findByPageCodeAndUserId(
        @Param("pageCode") String pageCode, 
        @Param("userId") Long userId
    );
    
    Page<FilterTemplate> findByIsPublicTrue(Pageable pageable);
}
