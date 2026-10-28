import { Router } from "express";
import { z } from "zod";
import { isUserRole } from "../lib/auth.js";
import { badRequest, conflict, unauthorized } from "../lib/errors.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { createAccessToken, createRefreshToken, hashToken, refreshTokenExpiresAt } from "../lib/tokens.js";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../prisma.js";

const email = z.string().trim().email().transform((value) => value.toLowerCase());
const username = z
  .string()
  .trim()
  .transform((value) => value.toLowerCase())
  .pipe(z.string().regex(/^[a-z0-9_]{3,30}$/, "Username must be 3-30 characters using letters, numbers, or underscores"));
const password = z.string().min(8).max(128);
const registerSchema = z.object({
  email,
  password,
  role: z.enum(["CLIENT", "FREELANCER"]),
  displayName: z.string().trim().min(2).max(80),
  username: username.optional()
});
const loginSchema = z
  .object({ email: email.optional(), username: username.optional(), password })
  .refine((input) => Boolean(input.email || input.username), {
    message: "Enter your email or username",
    path: ["username"]
  });
const refreshSchema = z.object({ refreshToken: z.string().min(20) });

const publicUser = (user: { id: string; email: string; username: string | null; role: string; status: string }) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  role: user.role,
  status: user.status
});

// Mobile and older clients may register without a username; derive a readable,
// unique handle from the email so every account can sign in with one.
const usernameFromEmail = (address: string) => {
  const local = address.split("@")[0].toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
  const base = local.length >= 3 ? local : `user_${local || "account"}`;
  return base.slice(0, 24);
};

const uniqueUsername = async (base: string) => {
  let candidate = base;
  for (let suffix = 2; await prisma.user.findUnique({ where: { username: candidate }, select: { id: true } }); suffix += 1) {
    candidate = `${base.slice(0, 27)}_${suffix}`;
  }
  return candidate;
};

const createSession = async (user: { id: string; role: string }) => {
  if (!isUserRole(user.role)) throw new Error("Invalid user role");
  const rawRefreshToken = createRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawRefreshToken),
      expiresAt: refreshTokenExpiresAt()
    }
  });
  return {
    accessToken: createAccessToken(user.id, user.role),
    refreshToken: rawRefreshToken
  };
};

export const authRouter = Router();

authRouter.post("/register", async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const existingEmail = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
    if (existingEmail) throw conflict("An account with this email already exists");

    let accountUsername = input.username ?? usernameFromEmail(input.email);
    const existingUsername = await prisma.user.findUnique({ where: { username: accountUsername }, select: { id: true } });
    if (existingUsername) {
      if (input.username) throw conflict("This username is already taken");
      accountUsername = await uniqueUsername(accountUsername);
    }

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { email: input.email, username: accountUsername, passwordHash: await hashPassword(input.password), role: input.role }
      });
      if (input.role === "CLIENT") {
        await tx.clientProfile.create({ data: { userId: created.id, displayName: input.displayName } });
      } else {
        await tx.freelancerProfile.create({ data: { userId: created.id, displayName: input.displayName } });
      }
      return created;
    });

    res.status(201).json({ data: { user: publicUser(user), ...(await createSession(user)) } });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = input.username
      ? await prisma.user.findUnique({ where: { username: input.username } })
      : await prisma.user.findUnique({ where: { email: input.email! } });
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw unauthorized("Email, username, or password is incorrect");
    }
    if (user.status !== "ACTIVE") throw unauthorized("This account is not active");
    res.json({ data: { user: publicUser(user), ...(await createSession(user)) } });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/refresh", async (req, res, next) => {
  try {
    const input = refreshSchema.parse(req.body);
    const tokenHash = hashToken(input.refreshToken);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });
    if (!stored || stored.revokedAt || stored.expiresAt <= new Date() || stored.user.status !== "ACTIVE") {
      throw unauthorized("Invalid or expired refresh token");
    }

    const nextToken = createRefreshToken();
    await prisma.$transaction([
      prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } }),
      prisma.refreshToken.create({
        data: { userId: stored.userId, tokenHash: hashToken(nextToken), expiresAt: refreshTokenExpiresAt() }
      })
    ]);
    if (!isUserRole(stored.user.role)) throw badRequest("User has an invalid role");
    res.json({ data: { user: publicUser(stored.user), accessToken: createAccessToken(stored.userId, stored.user.role), refreshToken: nextToken } });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", async (req, res, next) => {
  try {
    const input = refreshSchema.safeParse(req.body);
    if (input.success) {
      await prisma.refreshToken.updateMany({ where: { tokenHash: hashToken(input.data.refreshToken), revokedAt: null }, data: { revokedAt: new Date() } });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      include: { clientProfile: true, freelancerProfile: true }
    });
    if (!user) throw unauthorized();
    res.json({ data: { user: { ...publicUser(user), clientProfile: user.clientProfile, freelancerProfile: user.freelancerProfile } } });
  } catch (error) {
    next(error);
  }
});

const deleteAccountSchema = z.object({
  password: z.string().optional()
});

const handleDeleteAccount = async (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => {
  try {
    const input = deleteAccountSchema.parse(req.body ?? {});
    const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
    if (!user) throw unauthorized();
    if (input.password) {
      const match = await verifyPassword(input.password, user.passwordHash);
      if (!match) throw unauthorized("Incorrect password");
    }

    await prisma.user.delete({ where: { id: user.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

authRouter.delete("/me", requireAuth, handleDeleteAccount);
authRouter.delete("/account", requireAuth, handleDeleteAccount);

