const { Router } = require("express");
const passport = require("passport");
const axios = require("axios");

const router = Router();

router.get("/auth/likecoin", passport.authenticate("likecoin"));

router.get(
  "/auth/likecoin/callback",
  passport.authenticate("likecoin", { failureRedirect: "/login" }),
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect("/");
  }
);

router.get("/users/self", async (req, res) => {
  try {
    const { data } = await axios.get("https://api.like.co/users/profile", {
      headers: { Authorization: `Bearer ${req.user.accessToken}` }
    });
    res.json(data);
  } catch (err) {
    res.status(401).send(err.toString());
  }
});

router.post("/users/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

module.exports = router;
