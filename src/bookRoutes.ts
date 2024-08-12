import express, { Request, Response, NextFunction } from "express";
import { bookRepository } from "./index";
import { validateBookDataMiddleware } from "./middlewares/bookMiddlewares";
import { IBook } from "./models/book.model";

const bookRoutes = express();
// Route to get all books
bookRoutes.get("/books", async (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 10;
  const offset = Number(req.query.offset) || 0;
  const search = String(req.query.searchText || "");

  if (isNaN(limit) || isNaN(offset) || limit <= 0 || offset < 0) {
    return res.status(400).json({ error: "Invalid limit or offset" });
  }

  try {
    const books = await bookRepository.list({ limit, offset, search });
    res.status(200).json(books);
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).send((error as Error).message);
  }
});

// Route to get a book by ID
bookRoutes.get("/book", async (req: Request, res: Response) => {
  const bookId = Number(req.query.id);

  if (isNaN(bookId) || bookId <= 0) {
    return res.status(400).json({ error: "Invalid book ID" });
  }

  try {
    const book = await bookRepository.getById(bookId);
    if (book) {
      res.status(200).json(book);
    } else {
      res.status(404).send("Book not found");
    }
  } catch (error) {
    console.error("Error fetching book:", error);
    res.status(500).send((error as Error).message);
  }
});

// Route to create a new book
bookRoutes.post(
  "/book",
  validateBookDataMiddleware,
  async (req: Request, res: Response) => {
    if (!req.body) {
      return res.status(400).json({ error: "No body provided" });
    }

    try {
      const book: IBook = req.body;
      const result = await bookRepository.create(book);

      res.status(201).json({ message: "Book created", result });
    } catch (error) {
      console.error("Error inserting book:", error);
      res.status(500).send((error as Error).message);
    }
  }
);

// Route to update a book
bookRoutes.patch(
  "/book",
  validateBookDataMiddleware,
  async (req: Request, res: Response) => {
    const bookId = Number(req.query.id);

    if (isNaN(bookId) || bookId <= 0) {
      return res.status(400).json({ error: "Invalid book ID" });
    }

    try {
      const updatedBookData = req.body;
      const updatedBook = await bookRepository.update(bookId, updatedBookData);
      if (updatedBook) {
        res.status(200).json(updatedBook);
      } else {
        res.status(404).json({ error: "Book not found" });
      }
    } catch (error) {
      console.error("Error updating books:", error);
      res.status(500).send((error as Error).message);
    }
  }
);

// Route to delete a book
bookRoutes.delete("/book", async (req: Request, res: Response) => {
  const bookId = Number(req.query.id);

  if (isNaN(bookId) || bookId <= 0) {
    return res.status(400).json({ error: "Invalid book ID" });
  }

  try {
    const deletedBook = await bookRepository.delete(bookId);
    if (deletedBook) {
      res.status(200).json(deletedBook);
    } else {
      res.status(404).json({ error: "Book not found" });
    }
  } catch (error) {
    console.error("Error deleting books:", error);
    res.status(500).send((error as Error).message);
  }
});

export { bookRoutes };
