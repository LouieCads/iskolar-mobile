import { Response } from "express";

export function tooMany(res: Response, message: string) {
  return res.status(429).json({ success: false, message });
}



