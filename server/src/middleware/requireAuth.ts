import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { supabase } from "../config/supabase";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authorizationHeader =
      req.headers.authorization;

    if (!authorizationHeader) {
      return res.status(401).json({
        message: "Authentication is required.",
      });
    }

    const [scheme, accessToken] =
      authorizationHeader.split(" ");

    if (
      scheme !== "Bearer" ||
      !accessToken
    ) {
      return res.status(401).json({
        message:
          "Authorization header must use Bearer authentication.",
      });
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return res.status(401).json({
        message:
          "Authentication token is invalid or expired.",
      });
    }

    req.user = user;

    return next();
  } catch (error) {
    console.error(
      "Authentication middleware failed:",
      error,
    );

    return res.status(401).json({
      message:
        "Authentication token could not be verified.",
    });
  }
}