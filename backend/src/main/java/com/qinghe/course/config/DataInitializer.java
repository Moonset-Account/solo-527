package com.qinghe.course.config;

import com.qinghe.course.entity.*;
import com.qinghe.course.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final SysUserRepository sysUserRepository;
    private final CourseRepository courseRepository;
    private final CourseClassRepository courseClassRepository;
    private final CouponRepository couponRepository;
    private final CourseOrderRepository courseOrderRepository;
    private final LearningProgressRepository learningProgressRepository;
    private final RefundRequestRepository refundRequestRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final DistributionCommissionRepository distributionCommissionRepository;
    private final ClassMaterialRepository classMaterialRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        initAdminUser();
        initStudentUser();
        initCourses();
        initCoupons();
        initTestOrders();
        initRefundRequests();
        initAssignments();
        initCommissions();
    }

    private void initAdminUser() {
        if (sysUserRepository.findByUsername("admin").isPresent()) {
            return;
        }
        SysUser admin = new SysUser();
        admin.setUsername("admin");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setNickname("超级管理员");
        admin.setPhone("13800138000");
        admin.setEmail("admin@qinghe.com");
        admin.setRole("ADMIN");
        admin.setStatus("ACTIVE");
        sysUserRepository.save(admin);
        log.info("初始化管理员账号: admin / admin123");

        SysUser operator = new SysUser();
        operator.setUsername("operator");
        operator.setPassword(passwordEncoder.encode("operator123"));
        operator.setNickname("运营专员");
        operator.setPhone("13800138001");
        operator.setRole("OPERATOR");
        operator.setStatus("ACTIVE");
        sysUserRepository.save(operator);
        log.info("初始化运营专员账号: operator / operator123");
    }

    private void initStudentUser() {
        if (sysUserRepository.findByUsername("student").isPresent()) {
            return;
        }
        SysUser student = new SysUser();
        student.setUsername("student");
        student.setPassword(passwordEncoder.encode("student123"));
        student.setNickname("学员小王");
        student.setPhone("13900139000");
        student.setRole("STUDENT");
        student.setStatus("ACTIVE");
        sysUserRepository.save(student);
        log.info("初始化学员账号: student / student123");

        SysUser student2 = new SysUser();
        student2.setUsername("student2");
        student2.setPassword(passwordEncoder.encode("student123"));
        student2.setNickname("学员小李");
        student2.setPhone("13900139002");
        student2.setRole("STUDENT");
        student2.setStatus("ACTIVE");
        sysUserRepository.save(student2);
        log.info("初始化学员账号2: student2 / student123");
    }

    private void initCourses() {
        if (courseRepository.count() > 0) {
            return;
        }

        Course course1 = new Course();
        course1.setTitle("职场进阶：从入门到精通的项目管理");
        course1.setSubtitle("PMP认证+实战案例+教练带教");
        course1.setDescription("系统学习项目管理知识体系，掌握五大过程组十大知识领域，通过真实项目案例提升实战能力。");
        course1.setCoverUrl("");
        course1.setPrice(new BigDecimal("1999.00"));
        course1.setOriginalPrice(new BigDecimal("2999.00"));
        course1.setTotalHours(48);
        course1.setTotalLessons(36);
        course1.setCategory("项目管理");
        course1.setTags(List.of("PMP", "项目管理", "职场进阶"));
        course1.setStatus("ACTIVE");
        course1.setCreatedBy(1L);
        courseRepository.save(course1);

        Course course2 = new Course();
        course2.setTitle("产品经理实战训练营");
        course2.setSubtitle("需求分析+原型设计+用户研究");
        course2.setDescription("从零开始学习产品经理核心技能，覆盖B端和C端产品设计方法，配套真实项目实战。");
        course2.setPrice(new BigDecimal("2599.00"));
        course2.setOriginalPrice(new BigDecimal("3599.00"));
        course2.setTotalHours(60);
        course2.setTotalLessons(45);
        course2.setCategory("产品运营");
        course2.setTags(List.of("产品经理", "需求分析", "原型设计"));
        course2.setStatus("ACTIVE");
        course2.setCreatedBy(1L);
        courseRepository.save(course2);

        Course course3 = new Course();
        course3.setTitle("数据分析与商业决策");
        course3.setSubtitle("Excel进阶+SQL+Python数据分析");
        course3.setDescription("掌握数据分析核心方法论，学会用数据驱动业务决策，提升职场竞争力。");
        course3.setPrice(new BigDecimal("1599.00"));
        course3.setOriginalPrice(new BigDecimal("2299.00"));
        course3.setTotalHours(40);
        course3.setTotalLessons(30);
        course3.setCategory("数据分析");
        course3.setTags(List.of("数据分析", "SQL", "Python"));
        course3.setStatus("ACTIVE");
        course3.setCreatedBy(1L);
        courseRepository.save(course3);

        log.info("初始化 3 门课程");

        CourseClass class1 = new CourseClass();
        class1.setCourseId(course1.getId());
        class1.setClassName("项目管理 2026 春期班");
        class1.setStartDate(LocalDate.of(2026, 3, 1));
        class1.setEndDate(LocalDate.of(2026, 6, 30));
        class1.setCapacity(50);
        class1.setEnrolledCount(2);
        class1.setTeacherName("张老师");
        class1.setAssistantName("李助教");
        class1.setStatus("RUNNING");
        class1.setCreatedBy(1L);
        courseClassRepository.save(class1);

        CourseClass class2 = new CourseClass();
        class2.setCourseId(course2.getId());
        class2.setClassName("产品经理 3 期");
        class2.setStartDate(LocalDate.of(2026, 4, 15));
        class2.setEndDate(LocalDate.of(2026, 8, 15));
        class2.setCapacity(40);
        class2.setEnrolledCount(1);
        class2.setTeacherName("王老师");
        class2.setAssistantName("赵助教");
        class2.setStatus("RUNNING");
        class2.setCreatedBy(1L);
        courseClassRepository.save(class2);

        CourseClass class3 = new CourseClass();
        class3.setCourseId(course3.getId());
        class3.setClassName("数据分析 入门班");
        class3.setStartDate(LocalDate.of(2026, 5, 1));
        class3.setEndDate(LocalDate.of(2026, 7, 31));
        class3.setCapacity(60);
        class3.setEnrolledCount(0);
        class3.setStatus("PENDING");
        class3.setCreatedBy(1L);
        courseClassRepository.save(class3);

        log.info("初始化 3 个班级");

        ClassMaterial m1 = new ClassMaterial();
        m1.setClassId(class1.getId());
        m1.setTitle("PMBOK指南（第六版）PDF");
        m1.setFileName("PMBOK-Guide-6th.pdf");
        m1.setFileUrl("/files/pmbok.pdf");
        m1.setFileSize(5242880L);
        m1.setFileType("pdf");
        m1.setDescription("项目管理知识体系指南");
        m1.setSortOrder(1);
        m1.setCreatedBy(1L);
        classMaterialRepository.save(m1);

        ClassMaterial m2 = new ClassMaterial();
        m2.setClassId(class1.getId());
        m2.setTitle("项目章程模板.docx");
        m2.setFileName("项目章程模板.docx");
        m2.setFileUrl("/files/template.docx");
        m2.setFileSize(204800L);
        m2.setFileType("docx");
        m2.setDescription("可直接使用的项目章程模板");
        m2.setSortOrder(2);
        m2.setCreatedBy(1L);
        classMaterialRepository.save(m2);

        log.info("初始化 2 份营期资料");
    }

    private void initCoupons() {
        if (couponRepository.count() > 0) {
            return;
        }

        Coupon c1 = new Coupon();
        c1.setCode("NEWUSER100");
        c1.setName("新人专享券");
        c1.setType("FIXED");
        c1.setDiscountValue(new BigDecimal("100.00"));
        c1.setMinAmount(new BigDecimal("500.00"));
        c1.setTotalCount(1000);
        c1.setUsedCount(56);
        c1.setStartTime(LocalDateTime.of(2026, 1, 1, 0, 0));
        c1.setEndTime(LocalDateTime.of(2026, 12, 31, 23, 59));
        c1.setStatus("ACTIVE");
        c1.setCreatedBy(1L);
        couponRepository.save(c1);

        Coupon c2 = new Coupon();
        c2.setCode("VIP20");
        c2.setName("VIP 会员 8 折券");
        c2.setType("PERCENT");
        c2.setDiscountValue(new BigDecimal("20.00"));
        c2.setMinAmount(BigDecimal.ZERO);
        c2.setTotalCount(500);
        c2.setUsedCount(23);
        c2.setStartTime(LocalDateTime.of(2026, 1, 1, 0, 0));
        c2.setEndTime(LocalDateTime.of(2026, 6, 30, 23, 59));
        c2.setStatus("ACTIVE");
        c2.setCreatedBy(1L);
        couponRepository.save(c2);

        Coupon c3 = new Coupon();
        c3.setCode("VIP30");
        c3.setName("夏季特惠 7 折");
        c3.setType("PERCENT");
        c3.setDiscountValue(new BigDecimal("30.00"));
        c3.setMinAmount(BigDecimal.ZERO);
        c3.setTotalCount(200);
        c3.setUsedCount(0);
        c3.setStartTime(LocalDateTime.of(2026, 7, 1, 0, 0));
        c3.setEndTime(LocalDateTime.of(2026, 8, 31, 23, 59));
        c3.setStatus("INACTIVE");
        c3.setCreatedBy(1L);
        couponRepository.save(c3);

        log.info("初始化 3 张优惠券");
    }

    private void initTestOrders() {
        if (courseOrderRepository.count() > 0) {
            return;
        }

        Long studentId = sysUserRepository.findByUsername("student").get().getId();
        Long student2Id = sysUserRepository.findByUsername("student2").get().getId();

        CourseOrder order1 = new CourseOrder();
        order1.setOrderNo("QH2026060100001");
        order1.setUserId(studentId);
        order1.setCourseId(1L);
        order1.setClassId(1L);
        order1.setCouponId(1L);
        order1.setOriginalAmount(new BigDecimal("1999.00"));
        order1.setDiscountAmount(new BigDecimal("100.00"));
        order1.setFinalAmount(new BigDecimal("1899.00"));
        order1.setPaymentMethod("ALIPAY");
        order1.setPaidAt(LocalDateTime.of(2026, 6, 1, 10, 30));
        order1.setStatus("PAID");
        courseOrderRepository.save(order1);

        LearningProgress p1 = new LearningProgress();
        p1.setUserId(studentId);
        p1.setCourseId(1L);
        p1.setClassId(1L);
        p1.setTotalHours(48);
        p1.setConsumedHours(new BigDecimal("12.5"));
        p1.setCompletedLessons(8);
        p1.setLastStudyAt(LocalDateTime.of(2026, 6, 10, 20, 0));
        p1.setCompletionRate(new BigDecimal("26.04"));
        p1.setStatus("IN_PROGRESS");
        learningProgressRepository.save(p1);

        CourseOrder order2 = new CourseOrder();
        order2.setOrderNo("QH2026060500002");
        order2.setUserId(student2Id);
        order2.setCourseId(2L);
        order2.setClassId(2L);
        order2.setOriginalAmount(new BigDecimal("2599.00"));
        order2.setDiscountAmount(BigDecimal.ZERO);
        order2.setFinalAmount(new BigDecimal("2599.00"));
        order2.setPaymentMethod("WECHAT");
        order2.setPaidAt(LocalDateTime.of(2026, 6, 5, 14, 20));
        order2.setStatus("PAID");
        courseOrderRepository.save(order2);

        LearningProgress p2 = new LearningProgress();
        p2.setUserId(student2Id);
        p2.setCourseId(2L);
        p2.setClassId(2L);
        p2.setTotalHours(60);
        p2.setConsumedHours(new BigDecimal("45.0"));
        p2.setCompletedLessons(35);
        p2.setLastStudyAt(LocalDateTime.of(2026, 6, 8, 21, 30));
        p2.setCompletionRate(new BigDecimal("75.00"));
        p2.setStatus("IN_PROGRESS");
        learningProgressRepository.save(p2);

        CourseOrder order3 = new CourseOrder();
        order3.setOrderNo("QH2026060800003");
        order3.setUserId(studentId);
        order3.setCourseId(3L);
        order3.setOriginalAmount(new BigDecimal("1599.00"));
        order3.setDiscountAmount(BigDecimal.ZERO);
        order3.setFinalAmount(new BigDecimal("1599.00"));
        order3.setStatus("PENDING");
        courseOrderRepository.save(order3);

        log.info("初始化 3 个订单 + 2 条学习进度");
    }

    private void initRefundRequests() {
        if (refundRequestRepository.count() > 0) {
            return;
        }

        Long studentId = sysUserRepository.findByUsername("student").get().getId();

        RefundRequest r1 = new RefundRequest();
        r1.setOrderId(1L);
        r1.setUserId(studentId);
        r1.setRefundAmount(new BigDecimal("949.50"));
        r1.setRefundReason("个人原因无法继续学习，申请退还剩余部分费用");
        r1.setConsumedHours(new BigDecimal("12.5"));
        r1.setHoursWrittenBack(false);
        r1.setReminderSent(false);
        r1.setStatus("PENDING");
        r1.setCreatedAt(LocalDateTime.of(2026, 6, 5, 9, 0));
        refundRequestRepository.save(r1);

        RefundRequest r2 = new RefundRequest();
        r2.setOrderId(2L);
        r2.setUserId(studentId);
        r2.setRefundAmount(new BigDecimal("599.00"));
        r2.setRefundReason("课程内容不符合预期");
        r2.setConsumedHours(new BigDecimal("45.0"));
        r2.setHoursWrittenBack(false);
        r2.setReminderSent(true);
        r2.setReminderSentAt(LocalDateTime.of(2026, 6, 9, 10, 0));
        r2.setStatus("PENDING");
        r2.setCreatedAt(LocalDateTime.of(2026, 6, 2, 11, 30));
        refundRequestRepository.save(r2);

        RefundRequest r3 = new RefundRequest();
        r3.setOrderId(3L);
        r3.setUserId(studentId);
        r3.setRefundAmount(new BigDecimal("1599.00"));
        r3.setRefundReason("误操作购买");
        r3.setConsumedHours(BigDecimal.ZERO);
        r3.setHoursWrittenBack(true);
        r3.setReminderSent(false);
        r3.setProcessedBy(1L);
        r3.setProcessedAt(LocalDateTime.of(2026, 6, 9, 15, 0));
        r3.setProcessRemark("未消耗课时，全额退款");
        r3.setStatus("APPROVED");
        r3.setCreatedAt(LocalDateTime.of(2026, 6, 8, 16, 0));
        refundRequestRepository.save(r3);

        log.info("初始化 3 条退款申请（2条待处理 + 1条已通过）");
    }

    private void initAssignments() {
        if (assignmentRepository.count() > 0) {
            return;
        }

        Assignment a1 = new Assignment();
        a1.setClassId(1L);
        a1.setLessonId(1L);
        a1.setTitle("第一周作业：项目章程撰写");
        a1.setDescription("根据课程所学知识，为一个虚拟项目撰写完整的项目章程。");
        a1.setDueDate(LocalDateTime.of(2026, 6, 15, 23, 59));
        a1.setCreatedBy(1L);
        assignmentRepository.save(a1);

        Assignment a2 = new Assignment();
        a2.setClassId(1L);
        a2.setLessonId(3L);
        a2.setTitle("第二周作业：WBS分解");
        a2.setDescription("选择一个你熟悉的项目，完成WBS分解，要求至少3层。");
        a2.setDueDate(LocalDateTime.of(2026, 6, 22, 23, 59));
        a2.setCreatedBy(1L);
        assignmentRepository.save(a2);

        Long studentId = sysUserRepository.findByUsername("student").get().getId();

        AssignmentSubmission sub1 = new AssignmentSubmission();
        sub1.setAssignmentId(a1.getId());
        sub1.setUserId(studentId);
        sub1.setContent("项目名称：在线教育平台升级项目\n项目背景：...\n项目目标：...\n（以下省略...）");
        sub1.setSubmittedAt(LocalDateTime.of(2026, 6, 12, 20, 30));
        sub1.setStatus("SUBMITTED");
        assignmentSubmissionRepository.save(sub1);

        Long student2Id = sysUserRepository.findByUsername("student2").get().getId();

        AssignmentSubmission sub2 = new AssignmentSubmission();
        sub2.setAssignmentId(a1.getId());
        sub2.setUserId(student2Id);
        sub2.setContent("企业内部管理系统建设项目章程\n一、项目概述\n...");
        sub2.setScore(new BigDecimal("92.00"));
        sub2.setComment("结构清晰，考虑全面，特别是风险识别部分做得很好。建议增加对资源分配的具体描述。");
        sub2.setReviewedBy(1L);
        sub2.setReviewedAt(LocalDateTime.of(2026, 6, 13, 10, 0));
        sub2.setStatus("REVIEWED");
        assignmentSubmissionRepository.save(sub2);

        log.info("初始化 2 个作业 + 2 份提交（1份待点评 + 1份已点评）");
    }

    private void initCommissions() {
        if (distributionCommissionRepository.count() > 0) {
            return;
        }

        Long distributorId = sysUserRepository.findByUsername("student").get().getId();

        DistributionCommission c1 = new DistributionCommission();
        c1.setOrderId(1L);
        c1.setDistributorId(distributorId);
        c1.setOrderAmount(new BigDecimal("1899.00"));
        c1.setCommissionRate(new BigDecimal("15.00"));
        c1.setCommissionAmount(new BigDecimal("284.85"));
        c1.setStatus("PENDING");
        distributionCommissionRepository.save(c1);

        DistributionCommission c2 = new DistributionCommission();
        c2.setOrderId(2L);
        c2.setDistributorId(distributorId);
        c2.setOrderAmount(new BigDecimal("2599.00"));
        c2.setCommissionRate(new BigDecimal("10.00"));
        c2.setCommissionAmount(new BigDecimal("259.90"));
        c2.setSettledAt(LocalDateTime.of(2026, 6, 8, 14, 0));
        c2.setStatus("SETTLED");
        c2.setRemark("正常结算");
        distributionCommissionRepository.save(c2);

        log.info("初始化 2 条佣金记录（1条待结算 + 1条已结算）");
    }
}
