package com.decoration.cooperation.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.decoration.cooperation.common.PageQuery;
import com.decoration.cooperation.common.PageResult;
import com.decoration.cooperation.config.JwtUtils;
import com.decoration.cooperation.entity.SysDept;
import com.decoration.cooperation.entity.SysUser;
import com.decoration.cooperation.exception.BusinessException;
import com.decoration.cooperation.mapper.SysDeptMapper;
import com.decoration.cooperation.mapper.SysUserMapper;
import com.decoration.cooperation.service.SysUserService;
import com.decoration.cooperation.vo.LoginVO;
import com.decoration.cooperation.vo.UserInfoVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SysUserServiceImpl extends ServiceImpl<SysUserMapper, SysUser> implements SysUserService {

    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final SysDeptMapper sysDeptMapper;

    @Override
    public SysUser getById(Long id) {
        return super.getById(id);
    }

    @Override
    public LoginVO login(String username, String password) {
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysUser::getUsername, username);
        SysUser user = getOne(wrapper);
        if (user == null) {
            throw new BusinessException("用户名或密码错误");
        }
        if (user.getStatus() != null && user.getStatus() == 0) {
            throw new BusinessException("账号已被禁用");
        }
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BusinessException("用户名或密码错误");
        }
        String token = jwtUtils.generateToken(user.getId(), user.getUsername(), user.getRealName());
        List<String> roles = getUserRoles(user.getId());
        List<String> permissions = getUserPermissions(user.getId());

        LoginVO loginVO = new LoginVO();
        loginVO.setToken(token);
        loginVO.setUserId(user.getId());
        loginVO.setUsername(user.getUsername());
        loginVO.setRealName(user.getRealName());
        loginVO.setAvatar(user.getAvatar());
        loginVO.setRoles(roles);
        loginVO.setPermissions(permissions);
        return loginVO;
    }

    @Override
    public List<String> getUserPermissions(Long userId) {
        return baseMapper.selectPermissionCodesByUserId(userId);
    }

    @Override
    public UserInfoVO getUserInfo(Long userId) {
        SysUser user = getById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        UserInfoVO userInfoVO = new UserInfoVO();
        userInfoVO.setId(user.getId());
        userInfoVO.setUsername(user.getUsername());
        userInfoVO.setRealName(user.getRealName());
        userInfoVO.setPhone(user.getPhone());
        userInfoVO.setEmail(user.getEmail());
        userInfoVO.setAvatar(user.getAvatar());
        userInfoVO.setDeptId(user.getDeptId());
        if (user.getDeptId() != null) {
            SysDept dept = sysDeptMapper.selectById(user.getDeptId());
            if (dept != null) {
                userInfoVO.setDeptName(dept.getDeptName());
            }
        }
        return userInfoVO;
    }

    @Override
    public PageResult<SysUser> listUsers(PageQuery pageQuery) {
        Page<SysUser> page = new Page<>(pageQuery.getCurrent(), pageQuery.getSize());
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(pageQuery.getKeyword())) {
            wrapper.and(w -> w.like(SysUser::getUsername, pageQuery.getKeyword())
                    .or().like(SysUser::getRealName, pageQuery.getKeyword())
                    .or().like(SysUser::getPhone, pageQuery.getKeyword()));
        }
        if (StringUtils.hasText(pageQuery.getStatus())) {
            wrapper.eq(SysUser::getStatus, Integer.parseInt(pageQuery.getStatus()));
        }
        wrapper.orderByDesc(SysUser::getCreateTime);
        Page<SysUser> result = page(page, wrapper);
        return PageResult.of(result);
    }

    @Override
    public List<String> getUserRoles(Long userId) {
        return baseMapper.selectRoleCodesByUserId(userId);
    }
}
