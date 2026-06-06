package com.ceramic.kiln.repository;

import com.ceramic.kiln.entity.KilnOutRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KilnOutRecordRepository extends JpaRepository<KilnOutRecord, Long>, JpaSpecificationExecutor<KilnOutRecord> {
    List<KilnOutRecord> findByKilnRunId(Long kilnRunId);
    List<KilnOutRecord> findByArtworkId(Long artworkId);
}
