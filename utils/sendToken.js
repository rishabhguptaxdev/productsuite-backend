const sendToken = (user, res) => {
  const jwtToken = user.getJwtToken();

  const options = {
    expiresIn: new Date(Date.now() + process.env.COOKIE_TIME * 60 * 1000),
    httpOnly: true,
  };
  user.password = undefined;
  res.status(200).cookie("jwtToken", jwtToken, options).json({
    success: true,
    jwtToken,
    user,
  });
};

module.exports = sendToken;
