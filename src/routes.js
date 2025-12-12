import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import {
  signToken,
  authGuard,
  verifyPassword
} from "./auth.js";
import { validateText } from "./middleware.js";

const prisma = new PrismaClient();
const router = Router();

/* ================= PUBLIC ================= */

// Get approved thoughts
router.get("/thoughts", async (_, res) => {
  const thoughts = await prisma.thought.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" }
  });
  res.json(thoughts);
});

// Single thought + comments
router.get("/thoughts/:id", async (req, res) => {
  const thought = await prisma.thought.findFirst({
    where: {
      id: Number(req.params.id),
      status: "APPROVED"
    },
    include: {
      comments: { orderBy: { createdAt: "asc" } }
    }
  });

  if (!thought) return res.sendStatus(404);
  res.json(thought);
});

// Submit thought (markdown allowed)
router.post("/submit", validateText, async (req, res) => {
  const { title, content, author } = req.body;

  await prisma.thought.create({
    data: {
      title,
      content,
      author
    }
  });

  res.sendStatus(201);
});

// Submit comment
router.post("/comments/:id", validateText, async (req, res) => {
  const thoughtId = Number(req.params.id);

  const exists = await prisma.thought.findFirst({
    where: { id: thoughtId, status: "APPROVED" }
  });

  if (!exists) return res.sendStatus(404);

  await prisma.comment.create({
    data: {
      content: req.body.content,
      author: req.body.author,
      thoughtId
    }
  });

  res.sendStatus(201);
});

/* ================= ADMIN ================= */

// Admin login
router.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) return res.sendStatus(401);

  const ok = await verifyPassword(password, admin.password);
  if (!ok) return res.sendStatus(401);

  res.json({ token: signToken(admin) });
});

// Pending thoughts
router.get("/admin/pending", authGuard, async (_, res) => {
  res.json(
    await prisma.thought.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" }
    })
  );
});

// Approve thought
router.post("/admin/approve/:id", authGuard, async (req, res) => {
  await prisma.thought.update({
    where: { id: Number(req.params.id) },
    data: {
      status: "APPROVED",
      approvedAt: new Date()
    }
  });
  res.sendStatus(200);
});

// Reject thought
router.post("/admin/reject/:id", authGuard, async (req, res) => {
  await prisma.thought.update({
    where: { id: Number(req.params.id) },
    data: { status: "REJECTED" }
  });
  res.sendStatus(200);
});

// Delete comment
router.delete("/admin/comment/:id", authGuard, async (req, res) => {
  await prisma.comment.delete({
    where: { id: Number(req.params.id) }
  });
  res.sendStatus(204);
});

export default router;