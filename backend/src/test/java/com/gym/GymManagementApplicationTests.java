package com.gym;

import com.gym.entity.*;
import com.gym.enums.BookingStatus;
import com.gym.enums.BookingType;
import com.gym.enums.UserRole;
import com.gym.repository.*;
import com.gym.service.BookingService;
import com.gym.service.NotificationService;
import com.gym.validation.BookingValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
@Rollback
class GymManagementApplicationTests {

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private CoachRepository coachRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MemberPackageRepository memberPackageRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private MemberFreezeRepository memberFreezeRepository;

    @Autowired
    private BodyMeasurementRepository bodyMeasurementRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private BookingValidator bookingValidator;

    private Member testMember;
    private Coach testCoach;
    private User testUser;
    private MemberPackage testPackage;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setUsername("testuser");
        testUser.setPassword("password");
        testUser.setRealName("测试用户");
        testUser.setRole(UserRole.RECEPTIONIST);
        testUser.setStatus("ACTIVE");
        userRepository.save(testUser);

        testMember = new Member();
        testMember.setMemberNo("M001");
        testMember.setName("张三");
        testMember.setPhone("13800138000");
        testMember.setGender("MALE");
        testMember.setStatus("ACTIVE");
        memberRepository.save(testMember);

        User coachUser = new User();
        coachUser.setUsername("coach1");
        coachUser.setPassword("password");
        coachUser.setRealName("李教练");
        coachUser.setRole(UserRole.COACH);
        coachUser.setStatus("ACTIVE");
        userRepository.save(coachUser);

        testCoach = new Coach();
        testCoach.setUserId(coachUser.getId());
        testCoach.setCoachNo("C001");
        testCoach.setSpecialty("减脂塑形");
        coachRepository.save(testCoach);

        testPackage = new MemberPackage();
        testPackage.setMemberId(testMember.getId());
        testPackage.setCoachId(testCoach.getId());
        testPackage.setTotalSessions(10);
        testPackage.setRemainingSessions(10);
        testPackage.setUsedSessions(0);
        testPackage.setPurchaseDate(LocalDate.now());
        testPackage.setExpireDate(LocalDate.now().plusMonths(3));
        testPackage.setStatus("ACTIVE");
        testPackage.setFreezeDays(0);
        memberPackageRepository.save(testPackage);
    }

    @Test
    void testMemberFreezeValidation() {
        MemberFreeze freeze = new MemberFreeze();
        freeze.setMemberId(testMember.getId());
        freeze.setFreezeNo("F001");
        freeze.setFreezeType("TEMPORARY");
        freeze.setStartDate(LocalDate.now());
        freeze.setEndDate(LocalDate.now().plusDays(7));
        freeze.setFreezeDays(7);
        freeze.setStatus("ACTIVE");
        memberFreezeRepository.save(freeze);

        boolean isFrozen = memberFreezeRepository.isMemberFrozenOnDate(
            testMember.getId(), LocalDate.now().plusDays(3)
        );
        assertTrue(isFrozen, "会员在冻结期内应该被标记为冻结状态");

        boolean isNotFrozen = memberFreezeRepository.isMemberFrozenOnDate(
            testMember.getId(), LocalDate.now().plusDays(10)
        );
        assertFalse(isNotFrozen, "会员在冻结期外不应该被标记为冻结状态");

        assertThrows(Exception.class, () -> {
            bookingValidator.validateMemberNotFrozen(testMember.getId(), LocalDate.now().plusDays(3));
        }, "冻结期内预约应该抛出异常");
    }

    @Test
    void testBookingCreationAndSessionDeduction() {
        Booking booking = new Booking();
        booking.setBookingNo("B001");
        booking.setMemberId(testMember.getId());
        booking.setMemberPackageId(testPackage.getId());
        booking.setCoachId(testCoach.getId());
        booking.setBookingType(BookingType.PRIVATE);
        booking.setBookingDate(LocalDate.now().plusDays(1));
        booking.setStartTime(LocalTime.of(10, 0));
        booking.setEndTime(LocalTime.of(11, 0));
        booking.setStatus(BookingStatus.BOOKED);

        Booking savedBooking = bookingRepository.save(booking);
        assertNotNull(savedBooking.getId());
        assertEquals(BookingStatus.BOOKED, savedBooking.getStatus());

        bookingService.complete(savedBooking.getId());

        MemberPackage updatedPackage = memberPackageRepository.findById(testPackage.getId()).orElseThrow();
        assertEquals(9, updatedPackage.getRemainingSessions());
        assertEquals(1, updatedPackage.getUsedSessions());

        Booking completedBooking = bookingRepository.findById(savedBooking.getId()).orElseThrow();
        assertEquals(BookingStatus.COMPLETED, completedBooking.getStatus());
    }

    @Test
    void testNotificationFunctionality() {
        Notification notification = new Notification();
        notification.setNotificationNo("N001");
        notification.setMemberId(testMember.getId());
        notification.setType("PACKAGE_EXPIRING");
        notification.setTitle("课包即将到期提醒");
        notification.setContent("您的课包还有15天到期，请及时续费");
        notification.setIsRead(false);
        notification.setCreatedAt(LocalDateTime.now());

        Notification saved = notificationRepository.save(notification);
        assertNotNull(saved.getId());
        assertFalse(saved.getIsRead());

        notificationService.markAsRead(saved.getId());
        Notification readNotification = notificationRepository.findById(saved.getId()).orElseThrow();
        assertTrue(readNotification.getIsRead());
        assertNotNull(readNotification.getReadAt());

        List<Notification> unread = notificationRepository.findByMemberIdAndIsRead(testMember.getId(), false);
        assertEquals(0, unread.size());
    }

    @Test
    void testBodyMeasurementWithAttachment() {
        BodyMeasurement measurement = new BodyMeasurement();
        measurement.setMemberId(testMember.getId());
        measurement.setMeasureDate(LocalDate.now());
        measurement.setHeight(175.0);
        measurement.setWeight(70.0);
        measurement.setBmi(22.9);
        measurement.setBodyFat(18.5);
        measurement.setMuscleMass(32.0);
        measurement.setWaist(80.0);
        measurement.setHip(95.0);
        measurement.setChest(98.0);
        measurement.setAttachmentUrl("https://example.com/measurements/report.pdf");
        measurement.setRemark("体测数据正常，建议继续保持");

        BodyMeasurement saved = bodyMeasurementRepository.save(measurement);
        assertNotNull(saved.getId());
        assertNotNull(saved.getAttachmentUrl());
        assertEquals(70.0, saved.getWeight());

        List<BodyMeasurement> memberMeasurements = bodyMeasurementRepository.findByMemberIdOrderByMeasureDateDesc(testMember.getId());
        assertEquals(1, memberMeasurements.size());
        assertEquals("https://example.com/measurements/report.pdf", memberMeasurements.get(0).getAttachmentUrl());
    }

    @Test
    void testAuditLogHistoryTracking() {
        long initialCount = auditLogRepository.count();

        testMember.setName("张三三");
        testMember.setPhone("13900139000");
        memberRepository.save(testMember);

        long afterUpdateCount = auditLogRepository.count();
        assertTrue(afterUpdateCount >= initialCount);

        List<com.gym.entity.AuditLog> logs = auditLogRepository.findByTargetTypeOrderByCreatedAtDesc("MEMBER");
        assertFalse(logs.isEmpty());
    }

    @Test
    void testBookingCancellation() {
        Booking booking = new Booking();
        booking.setBookingNo("B002");
        booking.setMemberId(testMember.getId());
        booking.setMemberPackageId(testPackage.getId());
        booking.setCoachId(testCoach.getId());
        booking.setBookingType(BookingType.PRIVATE);
        booking.setBookingDate(LocalDate.now().plusDays(2));
        booking.setStartTime(LocalTime.of(14, 0));
        booking.setEndTime(LocalTime.of(15, 0));
        booking.setStatus(BookingStatus.BOOKED);

        Booking saved = bookingRepository.save(booking);
        bookingService.cancel(saved.getId());

        Booking cancelled = bookingRepository.findById(saved.getId()).orElseThrow();
        assertEquals(BookingStatus.CANCELLED, cancelled.getStatus());

        MemberPackage pkg = memberPackageRepository.findById(testPackage.getId()).orElseThrow();
        assertEquals(10, pkg.getRemainingSessions(), "取消预约不应扣减课时");
    }
}
