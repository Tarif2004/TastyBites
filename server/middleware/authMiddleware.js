import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    /*
      Expected:

      Authorization: Bearer YOUR_JWT_TOKEN
    */

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === "YOUR_LONG_RANDOM_SECRET") {
      console.error("[AUTH] CRITICAL: JWT_SECRET env var is not set or is still the placeholder. Set it in Vercel Environment Variables.");
    }

    /* Verify JWT */

    const decoded = jwt.verify(
      token,
      jwtSecret || "tastybites_fallback_secret_do_not_use_in_prod"
    );

    /*
      Find the user.

      We only select fields needed by
      authentication.
    */

    const user = await User.findById(decoded.id).select(
      "_id name email role"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    /*
      Attach user to request.

      Controllers can now use:

      req.user
    */

    req.user = user;

    next();

  } catch (error) {

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Authentication token expired",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    console.error(
      "Authentication middleware error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};  

export default protect;