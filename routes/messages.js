const router = require("express").Router();
const messagesCtrl = require("../controllers/messages")

router.get("/", isLoggedIn, messagesCtrl.index)
router.get("/:id", isLoggedIn, messagesCtrl.show)
router.post("/", isLoggedIn, messagesCtrl.create)
router.post("/:id", isLoggedIn, messagesCtrl.reply)

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/auth/google");
}

module.exports = router;
