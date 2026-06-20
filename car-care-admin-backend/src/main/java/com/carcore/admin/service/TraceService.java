package com.carcore.admin.service;

import com.carcore.admin.common.BusinessException;
import com.carcore.admin.dto.TraceQueryDTO;
import com.carcore.admin.entity.*;
import com.carcore.admin.repository.*;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TraceService {

    private final RepairOrderRepository repairOrderRepository;
    private final MemberPackageOrderRepository packageOrderRepository;
    private final MemberPackageRepository memberPackageRepository;
    private final DetectionRecordRepository detectionRecordRepository;
    private final TestDriveRecordRepository testDriveRecordRepository;
    private final WorkstationRepository workstationRepository;
    private final TechnicianRepository technicianRepository;
    private final MemberRepository memberRepository;
    private final PackageBenefitRepository packageBenefitRepository;

    public TraceService(RepairOrderRepository repairOrderRepository, MemberPackageOrderRepository packageOrderRepository, MemberPackageRepository memberPackageRepository, DetectionRecordRepository detectionRecordRepository, TestDriveRecordRepository testDriveRecordRepository, WorkstationRepository workstationRepository, TechnicianRepository technicianRepository, MemberRepository memberRepository, PackageBenefitRepository packageBenefitRepository) {
        this.repairOrderRepository = repairOrderRepository;
        this.packageOrderRepository = packageOrderRepository;
        this.memberPackageRepository = memberPackageRepository;
        this.detectionRecordRepository = detectionRecordRepository;
        this.testDriveRecordRepository = testDriveRecordRepository;
        this.workstationRepository = workstationRepository;
        this.technicianRepository = technicianRepository;
        this.memberRepository = memberRepository;
        this.packageBenefitRepository = packageBenefitRepository;
    }

    @Cacheable(value = "trace", key = "'packageOrder:' + #packageOrderId", unless = "#result == null")
    public Map<String, Object> tracePackageOrder(Long packageOrderId) {
        MemberPackageOrder order = packageOrderRepository.findById(packageOrderId)
                .orElseThrow(() -> new BusinessException("套餐订单不存在"));
        
        Map<String, Object> result = new HashMap<>();
        result.put("packageOrder", order);
        
        memberRepository.findById(order.getMemberId())
                .ifPresent(m -> result.put("member", m));
        
        if (order.getPackageId() != null) {
            MemberPackage pkg = memberPackageRepository.findById(order.getPackageId()).orElse(null);
            if (pkg != null) {
                result.put("memberPackage", pkg);
                result.put("benefits", packageBenefitRepository.findByPackageIdOrderBySortOrderAsc(pkg.getId()));
                
                if (pkg.getSourceDetectionRecordId() != null) {
                    detectionRecordRepository.findById(pkg.getSourceDetectionRecordId())
                            .ifPresent(dr -> result.put("sourceDetectionRecord", dr));
                }
            }
        }
        
        if (order.getSourceDetectionRecordId() != null) {
            detectionRecordRepository.findById(order.getSourceDetectionRecordId())
                    .ifPresent(dr -> result.put("detectionRecord", dr));
        }
        
        List<RepairOrder> repairOrders = repairOrderRepository.findByConditions(
                null, null, null, null, order.getId(), null, null, null,
                null, null, null, null).getContent();
        result.put("repairOrders", repairOrders);
        
        return result;
    }

    @Cacheable(value = "trace", key = "'techWorkstation:' + #repairOrderId", unless = "#result == null")
    public Map<String, Object> traceTechnicianAndWorkstation(Long repairOrderId) {
        RepairOrder order = repairOrderRepository.findById(repairOrderId)
                .orElseThrow(() -> new BusinessException("维修单不存在"));
        
        Map<String, Object> result = new HashMap<>();
        result.put("repairOrder", order);
        
        if (order.getTechnicianId() != null) {
            technicianRepository.findById(order.getTechnicianId())
                    .ifPresent(t -> result.put("technician", t));
        }
        
        if (order.getWorkstationId() != null) {
            workstationRepository.findById(order.getWorkstationId())
                    .ifPresent(w -> result.put("workstation", w));
        }
        
        List<TestDriveRecord> testDrives = testDriveRecordRepository.findByRepairOrderId(repairOrderId);
        result.put("testDriveRecords", testDrives);
        
        for (TestDriveRecord tdr : testDrives) {
            if (tdr.getTechnicianId() != null) {
                technicianRepository.findById(tdr.getTechnicianId())
                        .ifPresent(t -> tdr.setTechnicianName(t.getName()));
            }
            if (tdr.getWorkstationId() != null) {
                workstationRepository.findById(tdr.getWorkstationId())
                        .ifPresent(w -> tdr.setWorkstationName(w.getStationName()));
            }
        }
        
        return result;
    }

    @Cacheable(value = "trace", key = "'testDrive:' + #testDriveId", unless = "#result == null")
    public Map<String, Object> traceTestDrive(Long testDriveId) {
        TestDriveRecord testDrive = testDriveRecordRepository.findById(testDriveId)
                .orElseThrow(() -> new BusinessException("试驾记录不存在"));
        
        Map<String, Object> result = new HashMap<>();
        result.put("testDrive", testDrive);
        
        memberRepository.findById(testDrive.getMemberId())
                .ifPresent(m -> {
                    testDrive.setMemberName(m.getName());
                    result.put("member", m);
                });
        
        if (testDrive.getTechnicianId() != null) {
            technicianRepository.findById(testDrive.getTechnicianId())
                    .ifPresent(t -> {
                        testDrive.setTechnicianName(t.getName());
                        result.put("technician", t);
                    });
        }
        
        if (testDrive.getWorkstationId() != null) {
            workstationRepository.findById(testDrive.getWorkstationId())
                    .ifPresent(w -> {
                        testDrive.setWorkstationName(w.getStationName());
                        result.put("workstation", w);
                    });
        }
        
        if (testDrive.getRepairOrderId() != null) {
            repairOrderRepository.findById(testDrive.getRepairOrderId())
                    .ifPresent(ro -> {
                        testDrive.setRepairOrderNo(ro.getOrderNo());
                        result.put("repairOrder", ro);
                    });
        }
        
        return result;
    }

    public Map<String, Object> trace(TraceQueryDTO dto) {
        return switch (dto.getTraceType()) {
            case "PACKAGE_ORDER" -> tracePackageOrder(dto.getSourceId());
            case "TECHNICIAN_WORKSTATION" -> traceTechnicianAndWorkstation(dto.getSourceId());
            case "TEST_DRIVE" -> traceTestDrive(dto.getSourceId());
            default -> throw new BusinessException("不支持的溯源类型");
        };
    }

    @Cacheable(value = "trace", key = "'repairOrderSources:' + #repairOrderId", unless = "#result == null")
    public Map<String, Object> getRepairOrderSources(Long repairOrderId) {
        RepairOrder order = repairOrderRepository.findById(repairOrderId)
                .orElseThrow(() -> new BusinessException("维修单不存在"));
        
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> traceChain = new ArrayList<>();
        
        if (order.getPackageOrderId() != null) {
            Map<String, Object> packageTrace = tracePackageOrder(order.getPackageOrderId());
            result.put("packageTrace", packageTrace);
        }
        
        if (order.getDetectionRecordId() != null) {
            detectionRecordRepository.findById(order.getDetectionRecordId())
                    .ifPresent(dr -> result.put("detectionRecord", dr));
        }
        
        Map<String, Object> techWorkstationTrace = traceTechnicianAndWorkstation(repairOrderId);
        result.put("techWorkstationTrace", techWorkstationTrace);
        
        List<TestDriveRecord> testDrives = testDriveRecordRepository.findByRepairOrderId(repairOrderId);
        result.put("testDriveRecords", testDrives);
        
        return result;
    }
}
