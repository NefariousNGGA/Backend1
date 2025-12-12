import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export const hashPassword = (password) =>
  bcrypt.hash(password, 10);

export const verifyPassword = (password, hash) =>
  bcrypt.compare(password, hash);

export const signToken = (admin) =>
  jwt.sign({ id: admin.id }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });

export const authGuard = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.sendStatus(401);

  const token = header.split(" ")[1];
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.sendStatus(403);
  }
};
