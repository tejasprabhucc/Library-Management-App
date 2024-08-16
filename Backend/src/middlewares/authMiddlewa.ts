import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { AppEnvs } from "../core/read-env";

type userData = { userId: number; role: string };
export interface CustomRequest extends Request {
  user: userData;
}

export const verifyJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.sendStatus(401);

    const decoded = jwt.verify(
      token,
      AppEnvs.ACCESS_TOKEN_SECRET,
      (err, user) => {
        if (err) {
          return res.sendStatus(403);
        }
        (req as CustomRequest).user = user as userData;
        const refreshToken =
          req.cookies[`refreshToken_${(user as userData).userId}`];
        if (!refreshToken) return res.sendStatus(403);

        jwt.verify(
          refreshToken,
          AppEnvs.REFRESH_TOKEN_SECRET,
          (refreshErr: any) => {
            if (refreshErr) {
              return res.status(403).json({ message: "Invalid refresh token" });
            }
          }
        );
        next();
      }
    );
  } catch (err) {
    res.status(401).send("Authentication Failed");
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (roles.includes((req as CustomRequest).user.role)) {
      next();
    } else {
      res.sendStatus(403);
    }
  };
};
