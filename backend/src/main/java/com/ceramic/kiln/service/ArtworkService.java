package com.ceramic.kiln.service;

import com.ceramic.kiln.dto.*;
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

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ArtworkService {

    private final ArtworkRepository artworkRepository;
    private final StudentRepository studentRepository;
    private final ClayRepository clayRepository;
    private final GlazeRepository glazeRepository;
    private final KilnRunRepository kilnRunRepository;
    private final UserRepository userRepository;

    @Transactional
    public Artwork submitArtworkExternal(ExternalArtworkSubmitDTO dto) {
        Student student = studentRepository.findByPhone(dto.getStudentPhone())
            .orElseGet(() -> {
                Student s = new Student();
                s.setName(dto.getStudentName());
                s.setPhone(dto.getStudentPhone());
                s.setEmail(dto.getStudentEmail());
                return studentRepository.save(s);
            });

        Clay clay = clayRepository.findByCode(dto.getClayCode())
            .orElseThrow(() -> new BusinessException("泥料不存在: " + dto.getClayCode()));

        Glaze glaze = null;
        if (dto.getGlazeCode() != null) {
            glaze = glazeRepository.findByCode(dto.getGlazeCode())
                .orElseThrow(() -> new BusinessException("釉料不存在: " + dto.getGlazeCode()));
        }

        Artwork artwork = new Artwork();
        artwork.setArtworkCode(generateArtworkCode());
        artwork.setStudentId(student.getId());
        artwork.setClayId(clay.getId());
        artwork.setGlazeId(glaze != null ? glaze.getId() : null);
        artwork.setName(dto.getName());
        artwork.setDescription(dto.getDescription());
        artwork.setWeight(dto.getWeight());
        artwork.setStatus("SUBMITTED");
        artwork.setSubmissionSource("EXTERNAL");

        return artworkRepository.save(artwork);
    }

    @Transactional
    public Artwork submitArtworkInternal(ArtworkSubmitDTO dto, Long userId) {
        Student student = studentRepository.findById(dto.getStudentId())
            .orElseThrow(() -> new BusinessException("学员不存在"));

        Clay clay = clayRepository.findById(dto.getClayId())
            .orElseThrow(() -> new BusinessException("泥料不存在"));

        Glaze glaze = null;
        if (dto.getGlazeId() != null) {
            glaze = glazeRepository.findById(dto.getGlazeId()).orElse(null);
        }

        Artwork artwork = new Artwork();
        artwork.setArtworkCode(generateArtworkCode());
        artwork.setStudentId(student.getId());
        artwork.setClayId(clay.getId());
        artwork.setGlazeId(glaze != null ? glaze.getId() : null);
        artwork.setName(dto.getName());
        artwork.setDescription(dto.getDescription());
        artwork.setWeight(dto.getWeight());
        artwork.setStatus("REVIEWED");
        artwork.setSubmissionSource("INTERNAL");
        artwork.setSubmittedBy(userId);
        artwork.setReviewedBy(userId);
        artwork.setReviewedAt(LocalDateTime.now());

        return artworkRepository.save(artwork);
    }

    @Transactional
    public Artwork reviewArtwork(Long id, ArtworkReviewDTO dto, Long userId) {
        Artwork artwork = artworkRepository.findById(id)
            .orElseThrow(() -> new BusinessException("作品不存在"));

        if (!"SUBMITTED".equals(artwork.getStatus())) {
            throw new BusinessException("作品状态不允许审核");
        }

        artwork.setStatus(dto.getPass() ? "REVIEWED" : "REJECTED");
        artwork.setReviewedBy(userId);
        artwork.setReviewedAt(LocalDateTime.now());
        artwork.setReviewNotes(dto.getNotes());

        return artworkRepository.save(artwork);
    }

    @Transactional
    public Artwork assignToKilnRun(Long artworkId, Long kilnRunId, Long userId) {
        Artwork artwork = artworkRepository.findById(artworkId)
            .orElseThrow(() -> new BusinessException("作品不存在"));

        if (!"REVIEWED".equals(artwork.getStatus())) {
            throw new BusinessException("只有审核通过的作品才能安排入窑");
        }

        KilnRun kilnRun = kilnRunRepository.findById(kilnRunId)
            .orElseThrow(() -> new BusinessException("窑次不存在"));

        if (!"APPROVED".equals(kilnRun.getStatus())) {
            throw new BusinessException("只有已审批的窑次才能安排作品");
        }

        Clay clay = clayRepository.findById(artwork.getClayId()).orElseThrow();
        if (!clay.getTemperatureZone().equals(kilnRun.getTemperatureZone())) {
            throw new BusinessException("TEMPERATURE_ZONE_CONFLICT", 
                "作品泥料温区(" + clay.getTemperatureZone() + ")与窑次温区(" + kilnRun.getTemperatureZone() + ")冲突");
        }

        if (artwork.getGlazeId() != null) {
            Glaze glaze = glazeRepository.findById(artwork.getGlazeId()).orElseThrow();
            if (!glaze.getTemperatureZone().equals(kilnRun.getTemperatureZone())) {
                throw new BusinessException("TEMPERATURE_ZONE_CONFLICT",
                    "作品釉料温区(" + glaze.getTemperatureZone() + ")与窑次温区(" + kilnRun.getTemperatureZone() + ")冲突");
            }
        }

        if (kilnRun.getUsedCapacity() >= kilnRun.getMaxCapacity()) {
            throw new BusinessException("窑次容量已满");
        }

        artwork.setKilnRunId(kilnRunId);
        artwork.setStatus("SCHEDULED");
        artworkRepository.save(artwork);

        kilnRun.setUsedCapacity(kilnRun.getUsedCapacity() + 1);
        kilnRunRepository.save(kilnRun);

        return artwork;
    }

    @Transactional
    public Artwork withdrawFromKilnRun(Long artworkId, Long userId) {
        Artwork artwork = artworkRepository.findById(artworkId)
            .orElseThrow(() -> new BusinessException("作品不存在"));

        if (artwork.getKilnRunId() == null) {
            throw new BusinessException("作品未安排入窑");
        }

        KilnRun kilnRun = kilnRunRepository.findById(artwork.getKilnRunId())
            .orElseThrow(() -> new BusinessException("窑次不存在"));

        if ("FIRING".equals(kilnRun.getStatus()) || "COMPLETED".equals(kilnRun.getStatus())) {
            throw new BusinessException("烧制中或已完成的窑次不能撤回作品");
        }

        kilnRun.setUsedCapacity(Math.max(0, kilnRun.getUsedCapacity() - 1));
        kilnRunRepository.save(kilnRun);

        artwork.setKilnRunId(null);
        artwork.setStatus("REVIEWED");
        artwork.setPositionInKiln(null);

        return artworkRepository.save(artwork);
    }

    public Page<Artwork> searchArtworks(Map<String, Object> criteria, Pageable pageable) {
        Specification<Artwork> spec = Specification.where(null);

        if (criteria.containsKey("status") && criteria.get("status") != null) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("status"), criteria.get("status")));
        }
        if (criteria.containsKey("studentId") && criteria.get("studentId") != null) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("studentId"), criteria.get("studentId")));
        }
        if (criteria.containsKey("kilnRunId") && criteria.get("kilnRunId") != null) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("kilnRunId"), criteria.get("kilnRunId")));
        }
        if (criteria.containsKey("submissionSource") && criteria.get("submissionSource") != null) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("submissionSource"), criteria.get("submissionSource")));
        }
        if (criteria.containsKey("keyword") && criteria.get("keyword") != null) {
            String keyword = "%" + criteria.get("keyword") + "%";
            spec = spec.and((root, query, cb) -> 
                cb.or(
                    cb.like(root.get("name"), keyword),
                    cb.like(root.get("artworkCode"), keyword)
                ));
        }

        return artworkRepository.findAll(spec, pageable);
    }

    public Artwork getArtwork(Long id) {
        return artworkRepository.findById(id)
            .orElseThrow(() -> new BusinessException("作品不存在"));
    }

    private String generateArtworkCode() {
        return "AW" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")) + 
            String.format("%04d", (int)(Math.random() * 10000));
    }

    public List<Artwork> getArtworksByKilnRunId(Long kilnRunId) {
        return artworkRepository.findByKilnRunId(kilnRunId);
    }
}
