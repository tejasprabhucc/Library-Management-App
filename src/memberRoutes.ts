import express, { Request, Response, NextFunction } from "express";
import { memberRepository } from "./index";
import { verifyToken } from "./middlewares/authMiddleware"; // Assumed path for your JWT middleware

const memberRoutes = express.Router();

// Middleware to verify JWT
memberRoutes.use(verifyToken);

// Get member by ID
memberRoutes.get(
  "/:id",

  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await memberRepository.getById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json({ user });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// Delete member by ID
memberRoutes.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = await memberRepository.getById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Add your logic to delete the user here
    await memberRepository.delete(id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update member by ID
memberRoutes.patch("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const userData = req.body;
    const user = await memberRepository.getById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Add your logic to update the user here
    await memberRepository.update(id, userData);
    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export { memberRoutes };
