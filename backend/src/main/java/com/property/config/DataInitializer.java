package com.property.config;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.property.entity.SysUser;
import com.property.mapper.SysUserMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Profile("default")
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private SysUserMapper sysUserMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        String testPassword = "123456";
        String encodedPassword = passwordEncoder.encode(testPassword);

        List<SysUser> users = sysUserMapper.selectList(
                new LambdaQueryWrapper<SysUser>()
                        .in(SysUser::getUsername, "admin", "property01", "maint01", "inspector01", "owner01")
        );

        for (SysUser user : users) {
            if (!passwordEncoder.matches(testPassword, user.getPassword())) {
                user.setPassword(encodedPassword);
                sysUserMapper.updateById(user);
                log.info("已重置用户 {} 的密码为 123456", user.getUsername());
            }
        }

        log.info("测试账号密码检查完成，所有账号密码均为: 123456");
    }
}
