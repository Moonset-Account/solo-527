package com.gym.config;

import com.gym.common.enums.CourseTypeEnum;
import com.gym.common.enums.RoleEnum;
import com.gym.entity.*;
import com.gym.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CoachRepository coachRepository;
    private final CoursePackageRepository coursePackageRepository;
    private final MemberRepository memberRepository;
    private final MemberPackageRepository memberPackageRepository;
    private final GroupClassRepository groupClassRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            User admin = createUser("admin", "admin123", "系统管理员", "13800138000", RoleEnum.ADMIN);
            User manager = createUser("manager", "manager123", "店长", "13800138001", RoleEnum.MANAGER);
            User coachUser1 = createUser("coach1", "coach123", "张教练", "13800138002", RoleEnum.COACH);
            User coachUser2 = createUser("coach2", "coach123", "李教练", "13800138003", RoleEnum.COACH);
            createUser("reception", "reception123", "前台小王", "13800138004", RoleEnum.RECEPTION);

            Coach coach1 = createCoach("张教练", "13800138002", "男", "增肌、力量训练、体能提升", "高级教练", coachUser1);
            Coach coach2 = createCoach("李教练", "13800138003", "女", "减脂塑形、普拉提、产后恢复", "中级教练", coachUser2);

            CoursePackage pkg1 = createCoursePackage("基础私教课10节", CourseTypeEnum.PERSONAL, 10, new BigDecimal("3000"), 90);
            CoursePackage pkg2 = createCoursePackage("精英私教课30节", CourseTypeEnum.PERSONAL, 30, new BigDecimal("8100"), 180);
            CoursePackage pkg3 = createCoursePackage("VIP私教课50节", CourseTypeEnum.PERSONAL, 50, new BigDecimal("12500"), 365);
            CoursePackage pkg4 = createCoursePackage("团课月卡", CourseTypeEnum.GROUP, 20, new BigDecimal("399"), 30);
            CoursePackage pkg5 = createCoursePackage("团课季卡", CourseTypeEnum.GROUP, 60, new BigDecimal("999"), 90);

            Member member1 = createMember("M001", "王小明", "13900000001", "男", LocalDate.of(1990, 5, 15));
            Member member2 = createMember("M002", "李小红", "13900000002", "女", LocalDate.of(1995, 8, 20));
            Member member3 = createMember("M003", "张三", "13900000003", "男", LocalDate.of(1988, 3, 10));

            createMemberPackage(member1, pkg2, coach1, 30, new BigDecimal("8100"));
            createMemberPackage(member2, pkg1, coach2, 10, new BigDecimal("3000"));
            createMemberPackage(member3, pkg3, coach1, 50, new BigDecimal("12500"));

            createGroupClass("动感单车", coach1, LocalDateTime.now().plusDays(1).withHour(9).withMinute(0), LocalDateTime.now().plusDays(1).withHour(10).withMinute(0), 20);
            createGroupClass("瑜伽放松", coach2, LocalDateTime.now().plusDays(1).withHour(18).withMinute(0), LocalDateTime.now().plusDays(1).withHour(19).withMinute(0), 15);
            createGroupClass("力量训练", coach1, LocalDateTime.now().plusDays(2).withHour(19).withMinute(0), LocalDateTime.now().plusDays(2).withHour(20).withMinute(0), 12);
            createGroupClass("普拉提塑形", coach2, LocalDateTime.now().plusDays(3).withHour(10).withMinute(0), LocalDateTime.now().plusDays(3).withHour(11).withMinute(0), 15);
        }
    }

    private User createUser(String username, String password, String realName, String phone, RoleEnum role) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRealName(realName);
        user.setPhone(phone);
        user.setRole(role);
        user.setEnabled(true);
        return userRepository.save(user);
    }

    private Coach createCoach(String name, String phone, String gender, String specialty, String level, User user) {
        Coach coach = new Coach();
        coach.setName(name);
        coach.setPhone(phone);
        coach.setGender(gender);
        coach.setSpecialty(specialty);
        coach.setLevel(level);
        coach.setActive(true);
        coach.setHireDate(LocalDate.now().minusYears(1));
        coach.setBaseSalary(new BigDecimal("5000"));
        coach.setCommissionRate(new BigDecimal("0.3"));
        coach.setUser(user);
        return coachRepository.save(coach);
    }

    private CoursePackage createCoursePackage(String name, CourseTypeEnum type, Integer totalSessions, BigDecimal price, Integer validDays) {
        CoursePackage pkg = new CoursePackage();
        pkg.setName(name);
        pkg.setType(type);
        pkg.setTotalSessions(totalSessions);
        pkg.setPrice(price);
        pkg.setOriginalPrice(price.multiply(new BigDecimal("1.1")));
        pkg.setValidDays(validDays);
        pkg.setActive(true);
        pkg.setShowOnApp(true);
        pkg.setDescription(name + "，专业教练一对一指导");
        return coursePackageRepository.save(pkg);
    }

    private Member createMember(String memberNo, String name, String phone, String gender, LocalDate birthday) {
        Member member = new Member();
        member.setMemberNo(memberNo);
        member.setName(name);
        member.setPhone(phone);
        member.setGender(gender);
        member.setBirthday(birthday);
        member.setJoinDate(LocalDate.now().minusMonths(3));
        member.setStatus(com.gym.common.enums.MemberStatusEnum.ACTIVE);
        member.setTotalRemainingSessions(0);
        return memberRepository.save(member);
    }

    private void createMemberPackage(Member member, CoursePackage coursePackage, Coach coach, Integer totalSessions, BigDecimal paidAmount) {
        MemberPackage mp = new MemberPackage();
        mp.setMember(member);
        mp.setCoursePackage(coursePackage);
        mp.setCoach(coach);
        mp.setTotalSessions(totalSessions);
        mp.setUsedSessions(0);
        mp.setRemainingSessions(totalSessions);
        mp.setPaidAmount(paidAmount);
        mp.setPurchaseDate(LocalDate.now().minusDays(7));
        mp.setStartDate(LocalDate.now().minusDays(7));
        mp.setExpireDate(LocalDate.now().plusDays(coursePackage.getValidDays()));
        mp.setActive(true);
        memberPackageRepository.save(mp);

        member.setTotalRemainingSessions(member.getTotalRemainingSessions() + totalSessions);
        member.setAssignedCoach(coach);
        memberRepository.save(member);
    }

    private void createGroupClass(String name, Coach coach, LocalDateTime startTime, LocalDateTime endTime, Integer maxCapacity) {
        GroupClass gc = new GroupClass();
        gc.setName(name);
        gc.setCoach(coach);
        gc.setStartTime(startTime);
        gc.setEndTime(endTime);
        gc.setMaxCapacity(maxCapacity);
        gc.setBookedCount(0);
        gc.setLocation("操房" + (coach.getId() % 3 + 1));
        gc.setDescription(name + "课程");
        gc.setCancelled(false);
        groupClassRepository.save(gc);
    }
}
