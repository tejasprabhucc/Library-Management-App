import express, { Request, Response, NextFunction } from "express";
import { BookRepository } from "./repositories/book.repository";
import { IBook } from "./models/book.model";
import { AppEnvs } from "./core/read-env";
import mysql from "mysql2/promise";
import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import cors from "cors";
import cookieParser from "cookie-parser";
import { MemberRepository } from "./repositories/member.repository";
import { bookRoutes } from "./bookRoutes";
import { memberRoutes } from "./memberRoutes";
import { verifyJWT } from "./middlewares/authMiddlewa";

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
app.use(cors({ origin: "*" }));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

// Middleware to add headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  next();
});

app.post("/register", verifyJWT, () => {});
app.post("/login", verifyJWT, () => {});

app.use("/member", verifyJWT, memberRoutes);
app.use("/books", verifyJWT, bookRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
