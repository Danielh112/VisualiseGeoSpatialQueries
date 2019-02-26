module.exports = function (err, req, res, next) {
  res.status(err.status || 400);
  res.json({
    error: {
      message: err.message
    }
  });
}
