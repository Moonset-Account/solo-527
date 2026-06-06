package com.ceramic.kiln.service;

import com.ceramic.kiln.dto.DamageClaimCreateDTO;
import com.ceramic.kiln.entity.Artwork;
import com.ceramic.kiln.entity.DamageClaim;
import com.ceramic.kiln.exception.BusinessException;
import com.ceramic.kiln.repository.ArtworkRepository;
import com.ceramic.kiln.repository.DamageClaimRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class DamageClaimService {

    private final DamageClaimRepository damageClaimRepository;
    private final ArtworkRepository artworkRepository;

    @Transactional
    public DamageClaim createClaim(DamageClaimCreateDTO dto, Long userId) {
        Artwork artwork = artworkRepository.findById(dto.getArtworkId())
            .orElseThrow(() -> new BusinessException("作品不存在"));

        DamageClaim claim = new DamageClaim();
        claim.setClaimCode(generateClaimCode());
        claim.setArtworkId(dto.getArtworkId());
        claim.setStudentId(artwork.getStudentId());
        claim.setDamageType(dto.getDamageType());
        claim.setDamageDescription(dto.getDamageDescription());
        claim.setCompensationType(dto.getCompensationType());
        claim.setCompensationAmount(dto.getCompensationAmount());
        claim.setStatus("PENDING");

        return damageClaimRepository.save(claim);
    }

    @Transactional
    public DamageClaim processClaim(Long id, Boolean approved, String notes, Long userId) {
        DamageClaim claim = damageClaimRepository.findById(id)
            .orElseThrow(() -> new BusinessException("赔付申请不存在"));

        if (!"PENDING".equals(claim.getStatus())) {
            throw new BusinessException("只有待处理的申请才能处理");
        }

        claim.setStatus(approved ? "APPROVED" : "REJECTED");
        claim.setProcessedBy(userId);
        claim.setProcessedAt(LocalDateTime.now());
        claim.setProcessNotes(notes);

        return damageClaimRepository.save(claim);
    }

    public Page<DamageClaim> searchClaims(Map<String, Object> criteria, Pageable pageable) {
        Specification<DamageClaim> spec = Specification.where(null);

        if (criteria.containsKey("status") && criteria.get("status") != null) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("status"), criteria.get("status")));
        }
        if (criteria.containsKey("studentId") && criteria.get("studentId") != null) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("studentId"), criteria.get("studentId")));
        }

        return damageClaimRepository.findAll(spec, pageable);
    }

    public DamageClaim getClaim(Long id) {
        return damageClaimRepository.findById(id)
            .orElseThrow(() -> new BusinessException("赔付申请不存在"));
    }

    private String generateClaimCode() {
        return "DC" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")) +
            String.format("%04d", (int)(Math.random() * 10000));
    }
}
