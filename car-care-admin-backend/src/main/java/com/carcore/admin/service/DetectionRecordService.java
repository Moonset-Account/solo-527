package com.carcore.admin.service;

import com.carcore.admin.common.BusinessException;
import com.carcore.admin.common.CodeGenerator;
import com.carcore.admin.common.PageResult;
import com.carcore.admin.entity.DetectionRecord;
import com.carcore.admin.entity.DetectionRecordItem;
import com.carcore.admin.entity.Member;
import com.carcore.admin.entity.Technician;
import com.carcore.admin.repository.DetectionRecordItemRepository;
import com.carcore.admin.repository.DetectionRecordRepository;
import com.carcore.admin.repository.MemberRepository;
import com.carcore.admin.repository.TechnicianRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DetectionRecordService {

    private final DetectionRecordRepository detectionRecordRepository;
    private final DetectionRecordItemRepository detectionRecordItemRepository;
    private final MemberRepository memberRepository;
    private final TechnicianRepository technicianRepository;
    private final CodeGenerator codeGenerator;

    public DetectionRecordService(DetectionRecordRepository detectionRecordRepository, DetectionRecordItemRepository detectionRecordItemRepository, MemberRepository memberRepository, TechnicianRepository technicianRepository, CodeGenerator codeGenerator) {
        this.detectionRecordRepository = detectionRecordRepository;
        this.detectionRecordItemRepository = detectionRecordItemRepository;
        this.memberRepository = memberRepository;
        this.technicianRepository = technicianRepository;
        this.codeGenerator = codeGenerator;
    }

    public DetectionRecord getById(Long id) {
        DetectionRecord record = detectionRecordRepository.findById(id)
                .orElseThrow(() -> new BusinessException("检测记录不存在"));
        enrichRecord(record);
        return record;
    }

    public DetectionRecord getByRecordNo(String recordNo) {
        DetectionRecord record = detectionRecordRepository.findByRecordNo(recordNo)
                .orElseThrow(() -> new BusinessException("检测记录不存在"));
        enrichRecord(record);
        return record;
    }

    public List<DetectionRecordItem> getRecordItems(Long recordId) {
        return detectionRecordItemRepository.findByRecordId(recordId);
    }

    public PageResult<DetectionRecord> page(String recordNo, Long memberId, Integer status,
                                            LocalDate startDate, LocalDate endDate,
                                            int pageNum, int pageSize) {
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize, Sort.by(Sort.Direction.DESC, "createTime"));
        Page<DetectionRecord> page = detectionRecordRepository.findByConditions(
                recordNo, memberId, status, startDate, endDate, pageable);
        
        List<DetectionRecord> records = page.getContent();
        enrichRecords(records);
        
        return PageResult.of(records, page.getTotalElements(), pageNum, pageSize);
    }

    @Transactional
    public DetectionRecord create(DetectionRecord record, List<DetectionRecordItem> items) {
        record.setRecordNo(codeGenerator.generateDetectionRecordNo());
        record.setStatus(1);
        
        if (record.getCheckDate() == null) {
            record.setCheckDate(LocalDate.now());
        }
        
        BigDecimal totalAmount = BigDecimal.ZERO;
        if (items != null) {
            for (DetectionRecordItem item : items) {
                if (item.getUnitPrice() != null) {
                    totalAmount = totalAmount.add(item.getUnitPrice());
                }
            }
        }
        record.setTotalAmount(totalAmount);
        
        DetectionRecord saved = detectionRecordRepository.save(record);
        
        if (items != null && !items.isEmpty()) {
            for (DetectionRecordItem item : items) {
                item.setRecordId(saved.getId());
                detectionRecordItemRepository.save(item);
            }
        }
        
        return saved;
    }

    @Transactional
    public DetectionRecord update(DetectionRecord record) {
        DetectionRecord existing = getById(record.getId());
        existing.setResultSummary(record.getResultSummary());
        existing.setStatus(record.getStatus());
        return detectionRecordRepository.save(existing);
    }

    @Transactional
    public void updateRecordItems(Long recordId, List<DetectionRecordItem> items) {
        detectionRecordItemRepository.deleteByRecordId(recordId);
        if (items != null && !items.isEmpty()) {
            for (DetectionRecordItem item : items) {
                item.setRecordId(recordId);
                detectionRecordItemRepository.save(item);
            }
        }
        
        DetectionRecord record = getById(recordId);
        BigDecimal totalAmount = BigDecimal.ZERO;
        if (items != null) {
            for (DetectionRecordItem item : items) {
                if (item.getUnitPrice() != null) {
                    totalAmount = totalAmount.add(item.getUnitPrice());
                }
            }
        }
        record.setTotalAmount(totalAmount);
        detectionRecordRepository.save(record);
    }

    @Transactional
    public void updateStatus(Long id, Integer status) {
        DetectionRecord record = getById(id);
        record.setStatus(status);
        detectionRecordRepository.save(record);
    }

    private void enrichRecord(DetectionRecord record) {
        memberRepository.findById(record.getMemberId()).ifPresent(m -> record.setMemberName(m.getName()));
        if (record.getCheckTechnicianId() != null) {
            technicianRepository.findById(record.getCheckTechnicianId()).ifPresent(t -> record.setTechnicianName(t.getName()));
        }
    }

    private void enrichRecords(List<DetectionRecord> records) {
        List<Long> memberIds = records.stream().map(DetectionRecord::getMemberId).distinct().toList();
        List<Long> techIds = records.stream().map(DetectionRecord::getCheckTechnicianId).filter(id -> id != null).distinct().toList();
        
        Map<Long, String> memberMap = memberRepository.findAllById(memberIds).stream()
                .collect(Collectors.toMap(Member::getId, Member::getName));
        Map<Long, String> techMap = technicianRepository.findAllById(techIds).stream()
                .collect(Collectors.toMap(Technician::getId, Technician::getName));
        
        for (DetectionRecord record : records) {
            record.setMemberName(memberMap.get(record.getMemberId()));
            if (record.getCheckTechnicianId() != null) {
                record.setTechnicianName(techMap.get(record.getCheckTechnicianId()));
            }
        }
    }
}
