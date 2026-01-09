module.exports = (err, req, res, next) => {
  console.error(err);

  // PostgreSQL unique constraint violation
  if (err.code === "23505") {
    return res.status(409).json({
      error: "Conflict",
    });
  }

  const status = err.status || 500;

  res.status(status).json({
    error: err.message || "Server error",
  });
};

