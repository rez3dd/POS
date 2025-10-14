// src/middlewares/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type JwtUser = { id: number; role: "ADMIN" | "STAFF" | "CUSTOMER" };

export interface RequestWithUser extends Request {
  user?: JwtUser;
}

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export function requireAuth(req: RequestWithUser, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtUser;
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function requireRole(roles: Array<JwtUser["role"]>) {
  return (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Unauthenticated" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}
