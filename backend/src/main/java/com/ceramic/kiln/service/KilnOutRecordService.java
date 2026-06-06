package com.ceramic.kiln.service;

import com.ceramic.kiln.dto.KilnOutRecordCreateDTO;
import com.ceramic.kiln.entity.*;
import com.ceramic.kiln.exception.BusinessException;
import com.ceramic.kiln.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class KilnOutRecordService {

    private final KilnOutRecordRepository kilnOutRecordRepository;
    private final ArtworkRepository artworkRepository;
    private final KilnRunRepository kilnRunRepository;
    private final ArtworkPhotoRepository artworkPhotoRepository;

    @Transactional
    public KilnOutRecord createKilnOutRecord(KilnOutRecordCreateDTO dto, Long userId) {
        KilnRun kilnRun = kilnRunRepository.findById(dto.getKilnRunId())
            .orElseThrow(() -> new BusinessException("窑次不存在"));

        if (!"COMPLETED".equals(kilnRun.getStatus())) {
            throw new BusinessException("只有已完成的窑次才能记录出窑");
        }

        Artwork artwork = artworkRepository.findById(dto.getArtworkId())
            .orElseThrow(() -> new BusinessException("作品不存在"));

        if (!dto.getKilnRunId().equals(artwork.getKilnRunId())) {
            throw new BusinessException("作品不在该窑次中");
        }

        KilnOutRecord record = new KilnOutRecord();
        record.setKilnRunId(dto.getKilnRunId());
        record.setArtworkId(dto.getArtworkId());
        record.setQualityStatus(dto.getQualityStatus());
        record.setNotes(dto.getNotes());
        record.setRecordedBy(userId);
        record.setOutTime(LocalDateTime.now());

        artwork.setStatus("OUT_KILN");
        artworkRepository.save(artwork);

        return kilnOutRecordRepository.save(record);
    }

    @Transactional
    public ArtworkPhoto uploadPhoto(Long artworkId, Long kilnOutRecordId, 
                                     MultipartFile file, String description, Long userId) {
        Artwork artwork = artworkRepository.findById(artworkId)
            .orElseThrow(() -> new BusinessException("作品不存在"));

        String photoUrl = "/uploads/" + System.currentTimeMillis() + "_" + file.getOriginalFilename();

        ArtworkPhoto photo = new ArtworkPhoto();
        photo.setArtworkId(artworkId);
        photo.setKilnOutRecordId(kilnOutRecordId);
        photo.setPhotoUrl(photoUrl);
        photo.setPhotoType("OUT_KILN");
        photo.setDescription(description);
        photo.setUploadedBy(userId);

        return artworkPhotoRepository.save(photo);
    }

    public Page<KilnOutRecord> searchRecords(Map<String, Object> criteria, Pageable pageable) {
        Specification<KilnOutRecord> spec = Specification.where(null);

        if (criteria.containsKey("kilnRunId") && criteria.get("kilnRunId") != null) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("kilnRunId"), criteria.get("kilnRunId")));
        }
        if (criteria.containsKey("artworkId") && criteria.get("artworkId") != null) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("artworkId"), criteria.get("artworkId")));
        }
        if (criteria.containsKey("qualityStatus") && criteria.get("qualityStatus") != null) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("qualityStatus"), criteria.get("qualityStatus")));
        }

        return kilnOutRecordRepository.findAll(spec, pageable);
    }

    public List<ArtworkPhoto> getArtworkPhotos(Long artworkId) {
        return artworkPhotoRepository.findByArtworkId(artworkId);
    }

    public KilnOutRecord getRecord(Long id) {
        return kilnOutRecordRepository.findById(id)
            .orElseThrow(() -> new BusinessException("记录不存在"));
    }
}
