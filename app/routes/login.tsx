import { useState } from "react";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  const response = await fetch(`${request.headers.get("origin") || "http://localhost:3000"}/api/auth/login`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": request.headers.get("Cookie") || "",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const data = await response.json();
    return json({ error: data.error || "登录失败" }, { status: 401 });
  }

  const setCookie = response.headers.get("set-cookie");
  return redirect("/", {
    headers: setCookie ? { "Set-Cookie": setCookie } : {},
  });
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">售后备件借用系统</h1>
        <p className="login-subtitle">请登录您的账号</p>
        
        <Form method="post">
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              name="username"
              className="form-input"
              placeholder="请输入用户名"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="请输入密码"
              required
              disabled={isSubmitting}
            />
          </div>

          {actionData?.error && (
            <p className="error-text mb-4">{actionData.error}</p>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "登录中..." : "登录"}
          </button>
        </Form>

        <div className="mt-4" style={{ fontSize: "12px", color: "#6b7280", textAlign: "center" }}>
          <p>测试账号：</p>
          <p>区域主管: supervisor01 / 123456</p>
          <p>工程师: engineer01 / 123456</p>
          <p>仓库: warehouse01 / 123456</p>
          <p>财务: finance01 / 123456</p>
        </div>
      </div>
    </div>
  );
}
