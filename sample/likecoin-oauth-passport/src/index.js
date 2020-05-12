const path = require("path");
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const passport = require("passport");
const LikeCoinStrategy = require("@matters/passport-likecoin");

const api = require("./route/api");

passport.use(
  new LikeCoinStrategy(
    {
      clientID: process.env.LIKECOIN_OAUTH_ID,
      clientSecret: process.env.LIKECOIN_OAUTH_SECRET,
      callbackURL: "https://3u9qq.sse.codesandbox.io/api/auth/likecoin/callback"
    },
    (accessToken, refreshToken, params, profile, cb) => {
      const likerId = params.user;
      // User.findOrCreate({ likerId }, function(err, user) {
      //   return cb(err, user);
      // });
      cb(null, { accessToken, user: likerId });
    }
  )
);
passport.serializeUser(function(user, done) {
  done(null, JSON.stringify(user));
});
passport.deserializeUser(function(user, done) {
  done(null, JSON.parse(user));
});

const app = express();
app.use(session({ secret: "likecoin-demo" }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use("/api", api);
app.use(express.static("public"));
app.use("/", (req, res) =>
  res.sendFile(path.resolve(__dirname, "./public/index.html"))
);

app.listen(8080);
