package com.decoration.crm.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.decoration.crm.dto.PageQuery;
import com.decoration.crm.entity.SysUser;
import com.decoration.crm.exception.BusinessException;
import com.decoration.crm.mapper.SysUserMapper;
import com.decoration.crm.service.SysUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class SysUserServiceImpl implements SysUserService {

    @Autowired
    private SysUserMapper sysUserMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public IPage<SysUser> getPage(PageQuery query) {
        Page<SysUser> page = new Page<>(query.getPageNum(), query.getPageSize());
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        if (query.getKeyword() != null && !query.getKeyword().isEmpty()) {
            wrapper.and(w -> w.like(SysUser::getUsername, query.getKeyword())
                    .or().like(SysUser::getRealName, query.getKeyword())
                    .or().like(SysUser::getPhone, query.getKeyword()));
        }
        wrapper.orderByDesc(SysUser::getCreatedAt);
        return sysUserMapper.selectPage(page, wrapper);
    }

    @Override
    public List<SysUser> getAll() {
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysUser::getStatus, true)
                .orderByAsc(SysUser::getRealName);
        return sysUserMapper.selectList(wrapper);
    }

    @Override
    public List<SysUser> getByRole(String role) {
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysUser::getRole, role)
                .eq(SysUser::getStatus, true)
                .orderByAsc(SysUser::getRealName);
        return sysUserMapper.selectList(wrapper);
    }

    @Override
    public SysUser getById(Long id) {
        return sysUserMapper.selectById(id);
    }

    @Override
    public SysUser create(SysUser user) {
        SysUser existing = sysUserMapper.selectByUsername(user.getUsername());
        if (existing != null) {
            throw new BusinessException("用户名已存在");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        if (user.getStatus() == null) {
            user.setStatus(true);
        }
        sysUserMapper.insert(user);
        user.setPassword(null);
        return user;
    }

    @Override
    public SysUser update(Long id, SysUser user) {
        SysUser existing = sysUserMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException("用户不存在");
        }
        user.setId(id);
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        } else {
            user.setPassword(null);
        }
        sysUserMapper.updateById(user);
        SysUser updated = sysUserMapper.selectById(id);
        updated.setPassword(null);
        return updated;
    }

    @Override
    public void delete(Long id) {
        sysUserMapper.deleteById(id);
    }

    @Override
    public void updateStatus(Long id, Boolean status) {
        SysUser user = sysUserMapper.selectById(id);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        user.setStatus(status);
        sysUserMapper.updateById(user);
    }
}
