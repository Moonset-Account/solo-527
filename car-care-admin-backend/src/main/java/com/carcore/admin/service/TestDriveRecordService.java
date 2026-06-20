package com.carcore.admin.service;

import com.carcore.admin.common.BusinessException;
import com.carcore.admin.common.CodeGenerator;
import com.carcore.admin.common.PageResult;
import com.carcore.admin.entity.Member;
import com.carcore.admin.entity.Technician;
import com.carcore.admin.entity.TestDriveRecord;
import com.carcore.admin.entity.Workstation;
import com.carcore.admin.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TestDriveRecordService {

    private final TestDriveRecordRepository testDriveRecordRepository;
    private final MemberRepository memberRepository;
    private final TechnicianRepository technicianRepository;
    private final WorkstationRepository workstationRepository;
    private final RepairOrderRepository repairOrderRepository;
    private final CodeGenerator codeGenerator;

    public TestDriveRecordService(TestDriveRecordRepository testDriveRecordRepository, MemberRepository memberRepository, TechnicianRepository technicianRepository, WorkstationRepository workstationRepository, RepairOrderRepository repairOrderRepository, CodeGenerator codeGenerator) {
        this.testDriveRecordRepository = testDriveRecordRepository;
        this.memberRepository = memberRepository;
        this.technicianRepository = technicianRepository;
        this.workstationRepository = workstationRepository;
        this.repairOrderRepository = repairOrderRepository;
        this.codeGenerator = codeGenerator;
    }

    public TestDriveRecord getById(Long id) {
        TestDriveRecord record = testDriveRecordRepository.findById(id)
                .orElseThrow(() -> new BusinessException("试驾记录不存在"));
        enrichRecord(record);
        return record;
    }

    public TestDriveRecord getByDriveNo(String driveNo) {
        TestDriveRecord record = testDriveRecordRepository.findByDriveNo(driveNo)
                .orElseThrow(() -> new BusinessException("试驾记录不存在"));
        enrichRecord(record);
        return record;
    }

    public PageResult<TestDriveRecord> page(String driveNo, Long memberId, Long technicianId,
                                             Long workstationId, Long repairOrderId, Integer status,
                                             LocalDateTime startTime, LocalDateTime endTime,
                                             int pageNum, int pageSize) {
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize, Sort.by(Sort.Direction.DESC, "createTime"));
        Page<TestDriveRecord> page = testDriveRecordRepository.findByConditions(
                driveNo, memberId, technicianId, workstationId, repairOrderId,
                status, startTime, endTime, pageable);
        
        List<TestDriveRecord> records = page.getContent();
        enrichRecords(records);
        
        return PageResult.of(records, page.getTotalElements(), pageNum, pageSize);
    }

    @Transactional
    public TestDriveRecord create(TestDriveRecord record) {
        record.setDriveNo(codeGenerator.generateTestDriveNo());
        record.setStatus(1);
        return testDriveRecordRepository.save(record);
    }

    @Transactional
    public TestDriveRecord update(TestDriveRecord record) {
        TestDriveRecord existing = getById(record.getId());
        existing.setDriveRoute(record.getDriveRoute());
        existing.setDriveDistance(record.getDriveDistance());
        existing.setDriveResult(record.getDriveResult());
        existing.setProblemsFound(record.getProblemsFound());
        return testDriveRecordRepository.save(existing);
    }

    @Transactional
    public TestDriveRecord startDrive(Long id) {
        TestDriveRecord record = getById(id);
        if (record.getStatus() != 1) {
            throw new BusinessException("只有待试驾的记录才能开始");
        }
        record.setStatus(2);
        record.setDriveStartTime(LocalDateTime.now());
        return testDriveRecordRepository.save(record);
    }

    @Transactional
    public TestDriveRecord endDrive(Long id, String driveResult, String problemsFound) {
        TestDriveRecord record = getById(id);
        if (record.getStatus() != 2) {
            throw new BusinessException("只有试驾中的记录才能结束");
        }
        record.setStatus(3);
        record.setDriveEndTime(LocalDateTime.now());
        record.setDriveResult(driveResult);
        record.setProblemsFound(problemsFound);
        return testDriveRecordRepository.save(record);
    }

    @Transactional
    public void cancelDrive(Long id) {
        TestDriveRecord record = getById(id);
        if (record.getStatus() == 3) {
            throw new BusinessException("已完成的试驾不能取消");
        }
        record.setStatus(0);
        testDriveRecordRepository.save(record);
    }

    private void enrichRecord(TestDriveRecord record) {
        memberRepository.findById(record.getMemberId()).ifPresent(m -> record.setMemberName(m.getName()));
        technicianRepository.findById(record.getTechnicianId()).ifPresent(t -> record.setTechnicianName(t.getName()));
        
        if (record.getWorkstationId() != null) {
            workstationRepository.findById(record.getWorkstationId()).ifPresent(w -> record.setWorkstationName(w.getStationName()));
        }
        
        if (record.getRepairOrderId() != null) {
            repairOrderRepository.findById(record.getRepairOrderId()).ifPresent(r -> record.setRepairOrderNo(r.getOrderNo()));
        }
    }

    private void enrichRecords(List<TestDriveRecord> records) {
        List<Long> memberIds = records.stream().map(TestDriveRecord::getMemberId).distinct().toList();
        List<Long> techIds = records.stream().map(TestDriveRecord::getTechnicianId).distinct().toList();
        
        Map<Long, String> memberMap = memberRepository.findAllById(memberIds).stream()
                .collect(Collectors.toMap(Member::getId, Member::getName));
        Map<Long, String> techMap = technicianRepository.findAllById(techIds).stream()
                .collect(Collectors.toMap(Technician::getId, Technician::getName));
        
        for (TestDriveRecord record : records) {
            record.setMemberName(memberMap.get(record.getMemberId()));
            record.setTechnicianName(techMap.get(record.getTechnicianId()));
        }
    }
}
