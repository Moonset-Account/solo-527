package com.qinghe.topic.controller;

import com.qinghe.topic.common.Result;
import com.qinghe.topic.entity.SysUser;
import com.qinghe.topic.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Tag(name = "用户管理")
@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "用户登录")
    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody Map<String, String> params) {
        String username = params.get("username");
        String password = params.get("password");
        SysUser user = userService.login(username, password);
        if (user == null) {
            return Result.error("用户名或密码错误");
        }
        user.setPassword(null);
        Map<String, Object> result = new HashMap<>();
        result.put("token", "mock-token-" + user.getId());
        result.put("userInfo", user);
        return Result.success(result);
    }

    @Operation(summary = "用户列表")
    @GetMapping("/list")
    public Result<List<SysUser>> list(@RequestParam(required = false) Integer role) {
        return Result.success(userService.listByRole(role));
    }

    @Operation(summary = "创作者列表")
    @GetMapping("/creators")
    public Result<List<SysUser>> listCreators() {
        return Result.success(userService.listCreators());
    }

    @Operation(summary = "审核员列表")
    @GetMapping("/reviewers")
    public Result<List<SysUser>> listReviewers() {
        return Result.success(userService.listReviewers());
    }

    @Operation(summary = "运营人员列表")
    @GetMapping("/operators")
    public Result<List<SysUser>> listOperators() {
        return Result.success(userService.listOperators());
    }

    @Operation(summary = "用户详情")
    @GetMapping("/{id}")
    public Result<SysUser> getById(@PathVariable Long id) {
        SysUser user = userService.getById(id);
        if (user != null) {
            user.setPassword(null);
        }
        return Result.success(user);
    }
}
