package com.gym.config;

import com.gym.entity.Coach;
import com.gym.entity.User;
import com.gym.enums.UserRole;
import com.gym.repository.CoachRepository;
import com.gym.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final CoachRepository coachRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, CoachRepository coachRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.coachRepository = coachRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRealName("系统管理员");
            admin.setRole(UserRole.ADMIN);
            admin.setPhone("13800000000");
            admin.setEmail("admin@gym.com");
            admin.setStatus("ACTIVE");
            userRepository.save(admin);
            log.info("创建管理员账号: admin / admin123");
        }

        if (!userRepository.existsByUsername("receptionist")) {
            User receptionist = new User();
            receptionist.setUsername("receptionist");
            receptionist.setPassword(passwordEncoder.encode("receptionist123"));
            receptionist.setRealName("前台小王");
            receptionist.setRole(UserRole.RECEPTIONIST);
            receptionist.setPhone("13800000001");
            receptionist.setEmail("receptionist@gym.com");
            receptionist.setStatus("ACTIVE");
            userRepository.save(receptionist);
            log.info("创建前台账号: receptionist / receptionist123");
        }

        if (!userRepository.existsByUsername("coach1")) {
            User coach1 = new User();
            coach1.setUsername("coach1");
            coach1.setPassword(passwordEncoder.encode("coach123"));
            coach1.setRealName("张教练");
            coach1.setRole(UserRole.COACH);
            coach1.setPhone("13800000002");
            coach1.setEmail("coach1@gym.com");
            coach1.setStatus("ACTIVE");
            coach1 = userRepository.save(coach1);

            Coach coach = new Coach();
            coach.setUserId(coach1.getId());
            coach.setCoachNo("C001");
            coach.setSpecialty("增肌、力量训练");
            coach.setDescription("5年健身教练经验，国家一级运动员");
            coach.setHireDate(LocalDate.of(2022, 1, 1));
            coachRepository.save(coach);
            log.info("创建教练账号: coach1 / coach123");
        }

        if (!userRepository.existsByUsername("coach2")) {
            User coach2 = new User();
            coach2.setUsername("coach2");
            coach2.setPassword(passwordEncoder.encode("coach123"));
            coach2.setRealName("李教练");
            coach2.setRole(UserRole.COACH);
            coach2.setPhone("13800000003");
            coach2.setEmail("coach2@gym.com");
            coach2.setStatus("ACTIVE");
            coach2 = userRepository.save(coach2);

            Coach coach = new Coach();
            coach.setUserId(coach2.getId());
            coach.setCoachNo("C002");
            coach.setSpecialty("减脂、瑜伽");
            coach.setDescription("3年瑜伽教练经验，擅长产后恢复");
            coach.setHireDate(LocalDate.of(2023, 6, 1));
            coachRepository.save(coach);
            log.info("创建教练账号: coach2 / coach123");
        }
    }
}
