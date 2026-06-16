package com.badminton.arena.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.badminton.arena.dto.LoginDTO;
import com.badminton.arena.entity.SysUser;
import com.badminton.arena.vo.LoginVO;

public interface SysUserService extends IService<SysUser> {

    LoginVO login(LoginDTO loginDTO);

    SysUser register(SysUser user);

    LoginVO getCurrentUserInfo();
}
