import {
  CustomRequest,
  CustomResponse,
  HTTPServer,
  RequestProcessor,
} from "./server";
import { BookRepository } from "./repositories/book.repository";
import { IBook } from "./models/book.model";
import { AppEnvs } from "./core/read-env";
import mysql from "mysql2/promise";
import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import { NextFunction } from "express";

const server = new HTTPServer(3000);
const db = initializeDatabase();
const bookRepo = new BookRepository(db!);

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

async function getAllBooks(request: CustomRequest, response: CustomResponse) {
  const baseUrl = `http://${request.headers.host}`;
  const url = new URL(request.url ?? "", baseUrl);
  const limit = Number(url.searchParams.get("limit")) || 10;
  const offset = Number(url.searchParams.get("offset")) || 0;
  const search = url.searchParams.get("searchText") || "";

  if (isNaN(limit) || isNaN(offset) || limit <= 0 || offset < 0) {
    response.writeHead(400, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Invalid limit or offset" }));
    return;
  }

  try {
    const books = await bookRepo.list({ limit, offset, search });
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify(books));
  } catch (error) {
    console.error("Error fetching books:", error);
    response.writeHead(500, { "Content-Type": "text/plain" });
    response.end((error as Error).message);
  }
}

async function getBookById(request: CustomRequest, response: CustomResponse) {
  const baseUrl = `http://${request.headers.host}`;
  const url = new URL(request.url ?? "", baseUrl);
  const bookId = Number(url.searchParams.get("id"));

  try {
    const book = await bookRepo.getById(bookId);
    if (book) {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify(book));
    } else {
      response.writeHead(404, { "Content-Type": "text/plain" });
      response.end("Book not found");
    }
  } catch (error) {
    if (!response.headersSent) {
      console.error("Error fetching book:", error);
      response.writeHead(500, { "Content-Type": "text/plain" });
      response.end((error as Error).message);
    }
  }
}

async function createBook(request: CustomRequest, response: CustomResponse) {
  if (!request.body) {
    response.writeHead(400, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "No body provided" }));
    return;
  }
  try {
    const book: IBook = await request.body;
    const result = await bookRepo.create(book);

    response.writeHead(201, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ message: "Book created", result }));
  } catch (error) {
    console.error("Error inserting book:", error);
    if (!response.headersSent) {
      response.writeHead(500, { "Content-Type": "application/text" });
      response.end((error as Error).message);
    }
  }
}

async function updateBook(request: CustomRequest, response: CustomResponse) {
  const baseUrl = `http://${request.headers.host}`;
  const url = new URL(request.url ?? "", baseUrl);
  const bookId = Number(url.searchParams.get("id"));

  if (isNaN(bookId) || bookId <= 0) {
    response.writeHead(404, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Invalid book ID" }));
    return;
  }

  try {
    const updatedBookData = await request.body;
    const updatedBook = await bookRepo.update(bookId, updatedBookData);
    if (updatedBook) {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify(updatedBook));
    } else {
      response.writeHead(404, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "Book not found" }));
    }
  } catch (error) {
    if (!response.headersSent) {
      console.error("Error updating books:", error);
      response.writeHead(500, { "Content-Type": "text/plain" });
      response.end((error as Error).message);
    }
  }
}

async function deleteBook(request: CustomRequest, response: CustomResponse) {
  const baseUrl = `http://${request.headers.host}`;
  const url = new URL(request.url ?? "", baseUrl);
  const bookId = Number(url.searchParams.get("id"));

  if (isNaN(bookId) || bookId <= 0) {
    response.writeHead(404, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Invalid book ID" }));
    return;
  }

  try {
    const deletedBook = await bookRepo.delete(bookId);
    if (deletedBook) {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify(deletedBook));
    } else {
      response.writeHead(404, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "Book not found" }));
    }
  } catch (error) {
    if (!response.headersSent) {
      console.error("Error deleting books:", error);
      response.writeHead(500, { "Content-Type": "text/plain" });
      response.end((error as Error).message);
    }
  }
}

const validateBookDataMiddleware: RequestProcessor = async (
  request: CustomRequest,
  response: CustomResponse,
  next: NextFunction
) => {
  if (request.method === "POST" || request.method === "PATCH") {
    const body = await request.body;
    console.log(body);
    try {
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
        response.writeHead(400, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: "Invalid book data format" }));
        return;
      }
    } catch (error) {
      response.writeHead(400, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "Invalid JSON body" }));
      return;
    }
  }
  next();
};

server.use("/library", (request: CustomRequest, response: CustomResponse) => {
  const baseUrl = `http://${request.headers.host}`;
  const url = new URL(request.url ?? "", baseUrl);
  const path = { path: url.pathname };
  console.log("Path: ", path);
  response.end(JSON.stringify(path));
});
// Middleware to add headers
server.use(
  (request: CustomRequest, response: CustomResponse, next: NextFunction) => {
    response.setHeader("Content-Type", "application/json");
    response.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
    next();
  }
);

// Middleware to parse JSON bodies
server.use(
  (request: CustomRequest, response: CustomResponse, next: NextFunction) => {
    if (request.method === "POST" || request.method === "PATCH") {
      request.body = new Promise((resolve, reject) => {
        let bodyData = "";
        request.on("data", (chunk: any) => {
          bodyData += chunk.toString();
        });

        request.on("end", async () => {
          try {
            let json = JSON.parse(bodyData);
            resolve(json);
            next();
          } catch (error) {
            response.writeHead(400, { "Content-Type": "application/json" });
            reject(new Error("No data found"));
          }
        });
      });
    } else {
      next();
    }
  }
);

// Book Routes
server.get("/books", getAllBooks);
server.get("/book", getBookById);
server.post("/book", validateBookDataMiddleware, createBook);
server.patch("/book", validateBookDataMiddleware, updateBook);
server.delete("/book", deleteBook);
