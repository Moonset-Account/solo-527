package com.ceramic.kiln.repository;

import com.ceramic.kiln.entity.Artwork;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ArtworkRepository extends JpaRepository<Artwork, Long>, JpaSpecificationExecutor<Artwork> {
    Optional<Artwork> findByArtworkCode(String artworkCode);
    List<Artwork> findByStudentId(Long studentId);
    List<Artwork> findByKilnRunId(Long kilnRunId);
    List<Artwork> findByStatus(String status);
    List<Artwork> findByKilnRunIdIsNullAndStatus(String status);
}
