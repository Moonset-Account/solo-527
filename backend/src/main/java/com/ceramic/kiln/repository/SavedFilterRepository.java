package com.ceramic.kiln.repository;

import com.ceramic.kiln.entity.SavedFilter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedFilterRepository extends JpaRepository<SavedFilter, Long> {
    List<SavedFilter> findByUserIdAndPageName(Long userId, String pageName);
    Optional<SavedFilter> findByUserIdAndPageNameAndFilterName(Long userId, String pageName, String filterName);
    Optional<SavedFilter> findByUserIdAndPageNameAndIsDefaultTrue(Long userId, String pageName);
}
