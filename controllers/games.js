const Game = require('../models/game')
const axios = require('axios')

module.exports = {
  new: newGame,
  search,
  show,
  addToWatchList,
  removeFromWatchList,
  addToCollection,
  removeFromCollection,
  index,
  createReview
}

function createReview(req, res) {
  Game.findById(req.params.id)
  .then((game) => {
    game.reviews.push(req.body)
    game.save()
    .then(()=> {
      res.redirect(`/games/${game.slug}`)
    })
  })
}

function index(req, res) {
  Game.find({ collectedBy: req.user._id })
  .then((games) => {
    res.render("games/index", {
      title: "Game Collection",
      user: req.user,
      games
    })
  })
}

function addToCollection(req, res) {
  req.body.collectedBy = req.user._id
  Game.findOne({ slug: req.body.slug })
  .then((game) => {
    // game is in the database already (someone has already collected it)
    if (game) {
      game.collectedBy.push(req.user._id)
      game.save()
      .then(()=> {
        res.redirect(`/games/${req.body.slug}`)
      })

    // game is NOT in the database already
    } else {
      Game.create(req.body)
      .then(()=> {
        res.redirect(`/games/${req.body.slug}`)
      })
    }
  })
}

function removeFromCollection(req, res) {
  Game.findOne({ slug: req.params.slug })
  .then((game) => {
    let idx = game.collectedBy.indexOf(req.user._id);
    game.collectedBy.splice(idx, 1);
    game.save()
    .then(() => {
      res.redirect(`/games/${req.params.slug}`);
    });
  });
}

function addToWatchList(req, res) {
  req.user.watchList.push(req.body)
  req.user.save()
  .then(() => {
    res.redirect(`/games/${req.body.slug}`)
  })
}

function removeFromWatchList(req, res) {
  let idx = req.user.watchList.findIndex((g) => g.slug === req.params.slug)
  req.user.watchList.splice(idx, 1)
  req.user.save()
  .then(() => {
    res.redirect(`/games/${req.body.slug}`)
  })
}

function show(req, res) {
  axios
  .get(`https://api.rawg.io/api/games/${req.params.slug}`)
  .then((response) => {
    Game.findOne({ slug: response.data.slug })
    .populate("collectedBy")
    .then((game => {
      res.render("games/show", {
        title: "Game Details",
        user: req.user,
        game: response.data,
        collectedBy: game ? game.collectedBy : [""],
        reviews: game ? game.reviews : [""],
        gameId: game ? game._id : ''
      })
    }))
  })
}

function search(req, res) {
  axios
  .get(`https://api.rawg.io/api/games?page_size=5&search=${req.body.query}`)
  .then((response) => {
    console.log(response.data.results)
    res.render("games/new", {
      title: "Game search",
      user: req.user,
      results: response.data.results
    })
  })
}

function newGame(req, res) {
  res.render("games/new", {
    user: req.user,
    title: "Game Search", 
    results: null
  })
}