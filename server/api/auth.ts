import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { logAction } from "../audit.js";
import { z } from "zod";

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const { username, password } = parsed.data;

    const result = await pool.query(
      `SELECT id, username, password_hash, real_name, email, role, region, is_active 
       FROM users WHERE username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = result.rows[0];
    
    if (!user.is_active) {
      return res.status(403).json({ error: "Account is disabled" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      await logAction(req, {
        action: "login_failed",
        resourceType: "user",
        resourceId: user.id,
        newValue: { username },
      });
      return res.status(401).json({ error: "Invalid username or password" });
    }

    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      username: user.username,
      real_name: user.real_name,
      role: user.role,
      region: user.region,
    };

    await logAction(req, {
      userId: user.id,
      action: "login",
      resourceType: "user",
      resourceId: user.id,
    });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        real_name: user.real_name,
        email: user.email,
        role: user.role,
        region: user.region,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.post("/logout", async (req, res) => {
  const userId = req.session.userId;
  
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });

  if (userId) {
    await logAction(req, {
      userId,
      action: "logout",
      resourceType: "user",
      resourceId: userId,
    });
  }
});

authRouter.get("/me", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json({ user: req.session.user });
});
