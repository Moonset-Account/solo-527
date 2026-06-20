package com.decoration.crm.config;

import com.decoration.crm.entity.SysUser;
import com.decoration.crm.mapper.SysUserMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private SysUserMapper sysUserMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        try {
            initAdminUser();
        } catch (Exception e) {
            System.out.println("数据初始化跳过: " + e.getMessage());
        }
    }

    private void initAdminUser() {
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysUser::getUsername, "admin");
        SysUser admin = sysUserMapper.selectOne(wrapper);
        
        if (admin == null) {
            SysUser newAdmin = new SysUser();
            newAdmin.setUsername("admin");
            newAdmin.setPassword(passwordEncoder.encode("123456"));
            newAdmin.setRealName("系统管理员");
            newAdmin.setRole("ADMIN");
            newAdmin.setStatus(true);
            sysUserMapper.insert(newAdmin);
            System.out.println("管理员账号创建成功: admin / 123456");
        } else {
            admin.setPassword(passwordEncoder.encode("123456"));
            sysUserMapper.updateById(admin);
            System.out.println("管理员密码已重置为: 123456");
        }
    }
}
