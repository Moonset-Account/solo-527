package com.finance.approval.security;

import com.finance.approval.entity.SysRole;
import com.finance.approval.entity.SysUser;
import com.finance.approval.entity.SysUserRole;
import com.finance.approval.repository.SysRoleRepository;
import com.finance.approval.repository.SysUserRepository;
import com.finance.approval.repository.SysUserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final SysUserRepository sysUserRepository;
    private final SysUserRoleRepository sysUserRoleRepository;
    private final SysRoleRepository sysRoleRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        SysUser user = sysUserRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        List<SysUserRole> userRoles = sysUserRoleRepository.findByUserId(user.getId());
        List<Long> roleIds = userRoles.stream()
                .map(SysUserRole::getRoleId)
                .collect(Collectors.toList());

        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        if (!roleIds.isEmpty()) {
            List<SysRole> roles = sysRoleRepository.findByIdIn(roleIds);
            authorities = roles.stream()
                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getRoleCode().name()))
                    .collect(Collectors.toList());
        }

        return new User(user.getUsername(), user.getPassword(), user.getEnabled(), true, true, true, authorities);
    }
}
