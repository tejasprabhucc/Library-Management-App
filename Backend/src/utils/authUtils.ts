import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { AppEnvs } from "../core/read-env";

// Hashing password
export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Comparing passwords
export const comparePassword = async (
  hashedPassword: string,
  password: string
) => {
  return await bcrypt.compare(hashedPassword, password);
};

// Generating Access Tokens
export const generateAccessToken = (userId: number, role: string) => {
  return jwt.sign({ userId, role }, AppEnvs.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
};

// Generating Refresh Tokens
export const generateRefreshToken = (userId: number, role: string) => {
  return jwt.sign({ userId, role }, AppEnvs.REFRESH_TOKEN_SECRET, {
    expiresIn: "5d",
  });
};

// Verifying JWT
export const verifyToken = (token: string, secret: string) => {
  return jwt.verify(token, secret);
};
