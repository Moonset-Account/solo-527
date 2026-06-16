<template>
  <el-container style="height: 100vh">
    <el-aside width="220px" style="background-color: #304156">
      <div style="height: 60px; line-height: 60px; text-align: center; color: #fff; font-size: 18px; font-weight: bold">
        PM Workstation
      </div>
      <el-menu
        :default-active="$route.path"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item index="/">
          <el-icon><Odometer /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-sub-menu index="/requirements">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>需求管理</span>
          </template>
          <el-menu-item index="/requirements">需求列表</el-menu-item>
          <el-menu-item index="/requirements/create">提交需求</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/process">
          <el-icon><Setting /></el-icon>
          <span>流程配置</span>
        </el-menu-item>
        <el-menu-item index="/roles">
          <el-icon><User /></el-icon>
          <span>角色权限</span>
        </el-menu-item>
        <el-menu-item index="/todos">
          <el-icon><List /></el-icon>
          <span>待办事项</span>
        </el-menu-item>
        <el-menu-item index="/meetings">
          <el-icon><ChatDotRound /></el-icon>
          <span>会议纪要</span>
        </el-menu-item>
        <el-menu-item index="/reminders">
          <el-icon><Bell /></el-icon>
          <span>提醒规则</span>
        </el-menu-item>
        <el-menu-item index="/reports">
          <el-icon><DataAnalysis /></el-icon>
          <span>协作报表</span>
        </el-menu-item>
        <el-menu-item index="/imports">
          <el-icon><Upload /></el-icon>
          <span>批量导入</span>
        </el-menu-item>
        <el-menu-item index="/audit-logs">
          <el-icon><Notebook /></el-icon>
          <span>审计日志</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import {
  Odometer,
  Document,
  Setting,
  User,
  List,
  ChatDotRound,
  Bell,
  DataAnalysis,
  Upload,
  Notebook
} from '@element-plus/icons-vue'
</script>

<style>
body {
  margin: 0;
  padding: 0;
}
</style>
