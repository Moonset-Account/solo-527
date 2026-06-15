package com.qinghe.topic.service;

import com.qinghe.topic.entity.SysUser;
import com.qinghe.topic.enums.UserRole;
import com.qinghe.topic.mapper.SysUserMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final SysUserMapper sysUserMapper;

    public List<SysUser> listAll() {
        return sysUserMapper.selectList(null);
    }

    public List<SysUser> listByRole(Integer role) {
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        if (role != null) {
            wrapper.eq(SysUser::getRole, role);
        }
        wrapper.eq(SysUser::getStatus, 1);
        return sysUserMapper.selectList(wrapper);
    }

    public SysUser getById(Long id) {
        return sysUserMapper.selectById(id);
    }

    public SysUser login(String username, String password) {
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysUser::getUsername, username);
        SysUser user = sysUserMapper.selectOne(wrapper);
        if (user == null) {
            return null;
        }
        if (!user.getPassword().equals(password)) {
            return null;
        }
        if (user.getStatus() != 1) {
            return null;
        }
        return user;
    }

    public List<SysUser> listCreators() {
        return listByRole(UserRole.CREATOR.getCode());
    }

    public List<SysUser> listReviewers() {
        return listByRole(UserRole.REVIEWER.getCode());
    }

    public List<SysUser> listOperators() {
        return listByRole(UserRole.OPERATOR.getCode());
    }
}
