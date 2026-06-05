package com.property.security;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.property.common.UserContext;
import com.property.entity.SysUser;
import com.property.mapper.SysUserMapper;
import com.property.utils.JwtUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private SysUserMapper sysUserMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader(jwtUtils.getHeader());

        if (authHeader != null && authHeader.startsWith(jwtUtils.getPrefix())) {
            String token = authHeader.substring(jwtUtils.getPrefix().length()).trim();

            if (!jwtUtils.isTokenExpired(token)) {
                Long userId = jwtUtils.getUserIdFromToken(token);
                String role = jwtUtils.getRoleFromToken(token);

                if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    SysUser user = sysUserMapper.selectOne(
                            new LambdaQueryWrapper<SysUser>()
                                    .eq(SysUser::getId, userId)
                                    .eq(SysUser::getStatus, 1)
                    );

                    if (user != null) {
                        UserContext.setUser(user);

                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(
                                        user,
                                        null,
                                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role))
                                );
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                }
            }
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            UserContext.clear();
        }
    }
}
