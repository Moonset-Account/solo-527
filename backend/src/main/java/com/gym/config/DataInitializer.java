package com.gym.config;

import com.gym.common.enums.RoleEnum;
import com.gym.entity.User;
import com.gym.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            createUser("admin", "admin123", "系统管理员", "13800138000", RoleEnum.ADMIN);
            createUser("manager", "manager123", "店长", "13800138001", RoleEnum.MANAGER);
            createUser("coach1", "coach123", "张教练", "13800138002", RoleEnum.COACH);
            createUser("coach2", "coach123", "李教练", "13800138003", RoleEnum.COACH);
            createUser("reception", "reception123", "前台小王", "13800138004", RoleEnum.RECEPTION);
        }
    }

    private void createUser(String username, String password, String realName, String phone, RoleEnum role) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRealName(realName);
        user.setPhone(phone);
        user.setRole(role);
        user.setEnabled(true);
        userRepository.save(user);
    }
}
