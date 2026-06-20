package com.decoration.crm.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.decoration.crm.dto.PageQuery;
import com.decoration.crm.entity.SysUser;
import java.util.List;

public interface SysUserService {
    IPage<SysUser> getPage(PageQuery query);
    List<SysUser> getAll();
    List<SysUser> getByRole(String role);
    SysUser getById(Long id);
    SysUser create(SysUser user);
    SysUser update(Long id, SysUser user);
    void delete(Long id);
    void updateStatus(Long id, Boolean status);
}
