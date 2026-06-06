package com.ceramic.kiln.repository;

import com.ceramic.kiln.entity.ArtworkPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArtworkPhotoRepository extends JpaRepository<ArtworkPhoto, Long> {
    List<ArtworkPhoto> findByArtworkId(Long artworkId);
    List<ArtworkPhoto> findByKilnOutRecordId(Long kilnOutRecordId);
}
