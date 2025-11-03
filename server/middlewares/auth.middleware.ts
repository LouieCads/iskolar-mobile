import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { isSafeInput } from "../utils/validation";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

interface AuthenticatedUser extends JwtPayload {
  id: string;
  email: string;
}

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || typeof authHeader !== "string") {
    res.status(401).json({
      success: false,
      message: "Access token required",
    });
    return;
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ success: false, message: "Access token required" });
    return;
  }

  if (token.length > 4096 || !isSafeInput(token)) {
    res.status(403).json({ success: false, message: "Invalid or expired token" });
    return;
  }

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Access token required",
    });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || typeof decoded === "string" || !decoded) {
      res.status(403).json({
        success: false,
        message: "Invalid or expired token",
      });
      return;
    }

    req.user = decoded as AuthenticatedUser;
    next();
  });
};
