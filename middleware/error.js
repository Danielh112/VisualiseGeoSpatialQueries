module.exports = function (err, req, res, next) {
  console.log(err);
  res.status(err.status || 400);
  res.json({
    error: {
      message: err.message
    }
  });
}
