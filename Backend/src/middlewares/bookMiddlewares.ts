import { Request, Response, NextFunction } from "express";
import { IBook } from "../models/book.model";

// Middleware to validate book data
export const validateBookDataMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.method === "POST" || req.method === "PATCH") {
    const body = req.body;

    // Define the expected keys and their types
    const isValidBook = (data: any): data is Omit<IBook, "id"> => {
      return (
        typeof data.title === "string" &&
        typeof data.author === "string" &&
        typeof data.publisher === "string" &&
        typeof data.genre === "string" &&
        typeof data.isbnNo === "string" &&
        typeof data.numOfPages === "number" &&
        typeof data.totalNumOfCopies === "number" &&
        typeof data.availableNumOfCopies === "number"
      );
    };

    // Check if the body is valid
    if (!isValidBook(body)) {
      return res.status(400).json({ error: "Invalid book data format" });
    }
  }
  next();
};
