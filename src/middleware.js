export const validateText = (req, res, next) => {
  const { content } = req.body;
  if (!content || content.length < 3 || content.length > 5000) {
    return res.status(400).json({ error: "Invalid content length" });
  }
  next();
};