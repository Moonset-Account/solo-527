"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "./Toast";

interface LoginFormProps {
  redirectTo: string;
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [realName, setRealName] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState("");
  const { login, register, loading } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isRegister) {
      if (!realName) {
        showToast("请输入真实姓名", "error");
        return;
      }
      const result = await register(username, password, realName, phone, village);
      if (result.success) {
        showToast("注册成功", "success");
        setTimeout(() => (window.location.href = redirectTo), 500);
      } else {
        showToast(result.error || "注册失败", "error");
      }
    } else {
      const result = await login(username, password);
      if (result.success) {
        showToast("登录成功", "success");
        setTimeout(() => (window.location.href = redirectTo), 500);
      } else {
        showToast(result.error || "登录失败", "error");
      }
    }
  };

  return (
    <div className="card p-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">
        {isRegister ? "用户注册" : "用户登录"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            用户名
          </label>
          <input
            type="text"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="请输入用户名"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            密码
          </label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码（至少6位）"
            required
            minLength={6}
          />
        </div>

        {isRegister && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                真实姓名
              </label>
              <input
                type="text"
                className="input"
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
                placeholder="请输入真实姓名"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                联系电话
              </label>
              <input
                type="tel"
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入联系电话"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                所属村庄
              </label>
              <input
                type="text"
                className="input"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="请输入所属村庄"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={loading}
        >
          {loading ? "处理中..." : isRegister ? "注册" : "登录"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          className="text-sm text-primary-600 hover:underline"
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister ? "已有账号？立即登录" : "没有账号？立即注册"}
        </button>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
        <p className="font-medium mb-2">测试账号：</p>
        <p>管理员：admin / 123456</p>
        <p>农户：farmer / 123456</p>
      </div>
    </div>
  );
}
