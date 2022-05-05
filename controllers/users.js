const User = require("../models/user");
const Game = require("../models/game")

module.exports = {
  index,
  showProfile,
  update,
  show,
  addFriend,
  removeFriend,
  getName
};

function getName(req, res) {
  res.json(req.user.name)
}

function addFriend(req, res) {
  req.user.friends.push(req.params.id)
  req.user.save()
  .then(()=> {
    res.redirect(`/users/${req.params.id}`)
  })
}

function removeFriend(req, res) {
  let idx = req.user.friends.indexOf(req.params.id)
  req.user.friends.splice(idx, 1)
  req.user.save()
  .then(()=> {
    res.redirect(`/users/${req.params.id}`)
  })
}

function show(req, res) {
  User.findById(req.params.id)
  .then((userInfo) => {
    Game.find({ collectedBy: userInfo._id })
    .then((games) => {
      res.render('users/show', {
        title: 'User Details',
        userInfo,
        user: req.user,
        games
      })
    })
  })
}

function update(req, res) {
  User.findByIdAndUpdate(req.user._id, req.body, {new: true})
  .then(() => {
    res.redirect("/users/profile")
  })
}

function showProfile(req, res) {
  // Let's talk about why we're using User.findById.
  // Ordinarily, you won't see this, as we have access
  // to the user via req.user.  Because we're going to 
  // use .populate later on to find "friends," we're 
  // going to stub it up like this in advance.
  User.findById(req.user._id)
    .populate("friends")
    .then((user) => {
      res.render("users/profile", { title: "Profile Page", user });
    });
}

function index(req, res) {
  User.find({}).then((users) => {
    res.render("users/index", { title: "User Index", user: req.user, users });
  });
}
