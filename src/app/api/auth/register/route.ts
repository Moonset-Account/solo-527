import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { UserRole } from "@/lib/types";
import prisma from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { validate, registerSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = validate(registerSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { username, password, realName, phone, village } = validation.data!;

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "用户名已存在" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        realName,
        phone,
        village,
        role: UserRole.EXTERNAL,
      },
    });

    const token = signToken({
      userId: user.id,
      username: user.username,
      role: user.role as UserRole,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            realName: user.realName,
            role: user.role,
            phone: user.phone,
            village: user.village,
          },
        },
        message: "注册成功",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
