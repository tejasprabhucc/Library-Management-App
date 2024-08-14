import jwt, { Secret, JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { AppEnvs } from "../core/read-env";
import { memberRepository } from "../index";

export interface CustomRequest extends Request {
  token: string | JwtPayload;
}

export const verifyJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) return res.sendStatus(401);

    const decoded = jwt.verify(token, AppEnvs.ACCESS_TOKEN_SECRET);
    (req as CustomRequest).token = decoded;
    const user = await memberRepository.getById((decoded as JwtPayload).id);
    req.userId = user!.id;
    next();
  } catch (err) {
    res.status(401).send("Please authenticate");
  }
};
