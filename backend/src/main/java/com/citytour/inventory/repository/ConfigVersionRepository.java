package com.citytour.inventory.repository;

import com.citytour.inventory.entity.ConfigVersion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ConfigVersionRepository extends JpaRepository<ConfigVersion, Long> {

    List<ConfigVersion> findByConfigTypeAndConfigKeyOrderByVersionNoDesc(String configType, String configKey);

    @Query("SELECT c FROM ConfigVersion c WHERE c.configType = :configType " +
           "AND c.configKey = :configKey AND c.status = 'ACTIVE' " +
           "AND c.effectStartTime <= :currentTime " +
           "AND (c.effectEndTime IS NULL OR c.effectEndTime > :currentTime) " +
           "ORDER BY c.versionNo DESC LIMIT 1")
    Optional<ConfigVersion> findActiveConfig(@Param("configType") String configType,
                                             @Param("configKey") String configKey,
                                             @Param("currentTime") LocalDateTime currentTime);

    @Query("SELECT c FROM ConfigVersion c WHERE " +
           "(:configType IS NULL OR c.configType = :configType) AND " +
           "(:configKey IS NULL OR c.configKey LIKE %:configKey%) AND " +
           "(:status IS NULL OR c.status = :status)")
    Page<ConfigVersion> findByConditions(@Param("configType") String configType,
                                        @Param("configKey") String configKey,
                                        @Param("status") String status,
                                        Pageable pageable);
}
