package com.decoration.cooperation.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.decoration.cooperation.common.PageQuery;
import com.decoration.cooperation.common.PageResult;
import com.decoration.cooperation.entity.SysUser;
import com.decoration.cooperation.vo.LoginVO;
import com.decoration.cooperation.vo.UserInfoVO;

import java.util.List;

public interface SysUserService extends IService<SysUser> {

    SysUser getById(Long id);

    LoginVO login(String username, String password);

    List<String> getUserPermissions(Long userId);

    UserInfoVO getUserInfo(Long userId);

    PageResult<SysUser> listUsers(PageQuery pageQuery);

    List<String> getUserRoles(Long userId);
}
