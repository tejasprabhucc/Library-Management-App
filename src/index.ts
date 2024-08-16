import express, { Request, Response, NextFunction } from "express";
import { AppEnvs } from "./core/read-env";
import mysql from "mysql2/promise";
import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import cors from "cors";
import cookieParser from "cookie-parser";
import { BookRepository } from "./repositories/book.repository";
import { MemberRepository } from "./repositories/member.repository";
import { bookRoutes } from "./bookRoutes";
import { memberRoutes } from "./memberRoutes";
import { CustomRequest, verifyJWT } from "./middlewares/authMiddlewa";
import {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
} from "./utils/authUtils";
import { IMember } from "./models/member.model";
import jwt from "jsonwebtoken";

const app = express();
const port = 3000;
const db = initializeDatabase();

export const memberRepository = new MemberRepository(db!);
export const bookRepository = new BookRepository(db!);

function initializeDatabase() {
  try {
    const pool = mysql.createPool(AppEnvs.DATABASE_URL);
    const db: MySql2Database<Record<string, never>> = drizzle(pool);
    console.log("Database connected successfully.");
    return db;
  } catch (error) {
    console.error("Database connection failed: ", error);
  }
}

// Middleware to parse JSON bodies
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

app.post("/register", async (req, res) => {
  try {
    const {
      name,
      age,
      phoneNumber,
      email,
      address,
      password,
      role = "user",
    } = req.body;

    const hashedPassword = await hashPassword(password);

    await memberRepository.create({
      name,
      age,
      phoneNumber,
      email,
      address,
      password: hashedPassword,
      role,
    });
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(400).end((err as Error).message);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await memberRepository.getByEmail(email);
    if (!user) return res.status(400).json({ message: "User not found" });

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);

    const updatedUser = await memberRepository.updateToken(
      user.id,
      refreshToken
    );

    res.cookie(`refreshToken_${user.id}`, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.json({ accessToken });
  } catch (err) {
    res.status(400).end((err as Error).message);
  }
});

app.post("/logout", verifyJWT, (req, res) => {
  res.clearCookie(`refreshToken_${(req as CustomRequest).user.userId}`);
  res.status(200).json({ message: "Logged out successfully" });
});

app.post("/refresh", verifyJWT, async (req: Request, res: Response) => {
  const userId = (req as CustomRequest).user.userId;
  const refreshToken = req.cookies[`refreshToken_${userId}`];

  if (!refreshToken) {
    return res.sendStatus(401);
  }

  try {
    const user = await memberRepository.getById(userId!);

    if (!user || user.refreshToken !== refreshToken) {
      return res.sendStatus(403);
    }

    jwt.verify(
      refreshToken as string,
      AppEnvs.REFRESH_TOKEN_SECRET,
      (err, user) => {
        if (err) return res.sendStatus(403);

        const { id, role } = user as IMember;
        const newAccessToken = generateAccessToken(id, role);
        res.json({ accessToken: newAccessToken });
      }
    );
  } catch (err) {
    res.sendStatus(500);
  }
});

app.use("/member", verifyJWT, memberRoutes);
app.use("/books", verifyJWT, bookRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
