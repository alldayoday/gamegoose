### The last piece of functionality we'll be adding to our application will utilize socket.io to implement a live-chat 'room' where users will be able to message one another, see if someone is typing, and hear some fun sounds on certain events (people entering/leaving the 'room').
### Let's talk a little bit about how socket.io works before we start writing code.

### Detour:[Socket.io](https://socket.io/docs/)

### Let's start by creating a module to handle all of our server-side socket.io stuff.  We also need to install the socket.io npm package:
```
touch io.js
npm i socket.io
```
### Include the CDN for the socket.io library in the header:
```html
<script src="https://cdn.socket.io/4.0.0/socket.io.min.js" integrity="sha384-DkkWv9oJFWLIydBXXjkBWnG1/fuVhw8YPBq37uvvD6WSYRFRqr21eY5Dg9ZhmWdy" crossorigin="anonymous"></script>

```
### Head back into the bin/www file and make sure we're loading socket.io when we start the server:
```js
// Require the module here
const io = require('../io')

if (process.env.NODE_ENV !== "production") {
  const https = require('https');
  const fs = require('fs');
  const homedir = require('os').homedir();
  
  const options = {
    key: fs.readFileSync(`${homedir}/certs/localhost/localhost.key`),
    cert: fs.readFileSync(`${homedir}/certs/localhost/localhost.crt`)
  };
  
  server = https.createServer(options, app)
  // Attach socket.io to the https server
  io.attach(server)

} else {
  const http = require('http')
  server = http.createServer(app);
  // Attach socket.io to the http server
  io.attach(server)
}

```
### Inside of the io.js, we'll need to require the module, then we'll export the contents as io:
```js
const io = require('socket.io')()

// defining an empty object to hold a list of 'chatters'
let chatters = {}


io.on('connection', (socket) => {
  // This is where all of our server-side socket.io functionality will exist.  

    // When anyone 'enters the room (loads the page)', add them to the list and play a sound

    // When anyone 'leaves the room (navigates away from the page)', remove them from the list and play a sound

    // When anyone sends a message, send the message to all of the connected clients and play a sound

    // When anyone presses a key while typing a message, display a '(user) is typing...' message to all clients
})

module.exports = io
```
### First, the model.  It's exceptionally simple:
```js
// models/chat.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chatSchema = new Schema({
  username: String,
  avatar: String,
  message: String,
},{
  timestamps: true,
});

module.exports = mongoose.model("Chat", chatSchema);
```
### Next, let's add a UI to our navbar:
```html
<li class="nav-item">
  <a class="nav-link" href="/chatroom">Chat Room</a>
</li>
```
### Let's add our router/controller next:
```js
// server.js
const chatRouter = require('./routes/chats');
.
. // middleware, HOOOOOOO!!!!!
.
app.use('/chatroom', chatRouter);
```
```js
// routes/chats.js
const router = require('express').Router();
const chatsCtrl = require('../controllers/chats');

router.get("/", isLoggedIn, chatsCtrl.chatRoom);

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/auth/google");
}

module.exports = router;
```
```js
// controllers/chats.js
function chatRoom(req, res) {
  res.render("chatroom", {
    title: "Chat Room",
    user: req.user,
  });
}
```
### We know the drill.  Let's write the view next:
```html
<%- include('partials/header') %>

<h3>Live Chat Room</h3>
<p>Users in the room:</p>
<!-- Notice the <ul> here that we'll be appending chatroom users to! -->
<ul id="chatters"></ul>
<input type="text" id="avatar" hidden name="avatar" value="<%= user.avatar %>">
<input type="text" hidden name="username" value="<%= user.name %>" id="username">
<input type="text" id="message">
<a class="btn btn-info" href="#" id="send_message">Send Message</a>
<!-- Oh, this is gonna be COOL!  We're gonna display when someone is typing! -->
<p id="isTyping"></p>
<div id="chatroom"></div>
<!-- This is where we'll loop over the chats with a forEach -->

<!-- We need to bring in a JavaScript file for this!!! -->
<script src="/javascripts/chat.js"></script>
<%- include('partials/footer') %>
```
### Because we'll need to run JavaScript client-side, we'll need to add a script file to be loaded into our view whenever we navigate to the 'chat room' view.  Make sure it lives inside a directory within the public folder named 'javascripts.'
# WARNING:  YOU ARE ABOUT TO SEE CODE THAT YOU USED IN UNIT 1.  DO NOT BE AFRAID!!!
```js
// First, we need to define our socket as the io we've exported on our server
let socket = io()

// OMG, CACHED ELEMENT REFERENCES?!?!? NO WAI!!!!
let message = document.getElementById("message");
let username = document.getElementById("username");
let send_message = document.getElementById("send_message");
let chatroom = document.getElementById("chatroom");
let avatar = document.getElementById("avatar");
let isTyping = document.getElementById("isTyping");
let chatters = document.getElementById("chatters");

// Event listeners (No, you're not having a flashback.  Everything will be ok!)

  // When the JavaScript file is loaded, emit an event with the user's info to the server

  // When 'send message' is clicked, emit a message containing the chat info to the server

  // When a user presses the 'Enter' key, emit a message containing the chat info to the server

  // When a user presses a key while typing in the 'message' element, send the user's name to the server

// Socket events

  // Define/execute a function to get the username from the server so that it can be broadcast on connection

  // When the socket receives an updated chat list, re-render the list of users connected

  // When a user enters the room, play a sound

  // When a user leaves the room, play a sound

  // When someone is typing (something we'll need the server to tell us), adjust the 'isTyping' element to reflect that

  // When a new message is posted, play a sound, update the newMessage element with the message/user info, and add the message to the database (we'll check server-side to make sure the message is only posted once, by checking the id of the user making the post)
```
### We've got quite the list to accomplish...  Let's play around with some of the basic stuff first.  Let's knock out the sounds for when a user enters/exits a room:
```js
// io.js

const io = require('socket.io')()


let chatters = {}

io.on('connection', (socket) => {
  // When anyone 'enters the room (loads the page)', add them to the list and play a sound
  socket.on('register-user', () => {
    io.emit('user-enter')
  });
  // When anyone 'leaves the room (navigates away from the page)', remove them from the list and play a sound
  socket.on('disconnect', () => {
    io.emit('user-exit')
  });
})

module.exports = io

```
### Let's go write the matching socket.on methods on the client-side.  Also, write an `emit` that will trigger the `register-user` on the server (We'll update this later with the user's name):
```js
// chat.js

// When a user enters the room, play a sound
socket.on("user-enter", () => {
  enterAudio.play();
});

// When a user leaves the room, play a sound
socket.on("user-exit", () => {
  exitAudio.play();
});

// Emit when the JavaScript file is loaded
socket.emit('register-user')
```
### See where we're going with this?  Let's add a function that loads the user info when the script loads and emits that to the server:

```js
// chat.js

function getUserName() {
  fetch("/users/getName").then((response) => {
    return response.json().then((data) => {
      socket.emit("register-user", data);
    });
  });
}

getUserName();
```
### Whooooa, there!  That's a route we don't have yet.  Let's go add it to routes/users.js:
```js
router.get("/getName", isLoggedIn, usersCtrl.getName);
```
### Then a matching function:
```js
function getName(req, res) {
  res.json(req.user.name);
}
```
### Seriously?  That may be the shortest controller function ever.  Next, we need to go add the 'register-user' socket listener in io.js.  Let's add an item to update the chatter-list, too!:
```js
socket.on('register-user', (username) => {
  chatters[socket.id] = username;
  io.emit('update-chatter-list', Object.keys(chatters).map(id => chatters[id]));
  io.emit('user-enter')
});

socket.on('disconnect', () => {
  delete chatters[socket.id];
  io.emit('user-exit')
  io.emit('update-chatter-list', Object.keys(chatters).map(id => chatters[id]));
});

```
### Back to chat.js to make the matching listener to update the page:
```js
socket.on("update-chatter-list", (data) => {
  var chatterList = "<li>" + data.join("</li><li>") + "</li>";
  chatters.innerHTML = chatterList;
});
```
### Let's put in our '... is typing...' functionality next, now that we have the user name!:
```js
// chat.js
message.addEventListener("keypress", () => {
  socket.emit("typing", { username: username.value });
});
```
### And we'll match it with a broadcast emitter (this will send it to all clients EXCEPT the one initiating it):
```js
// io.js
  socket.on('typing', (data) => {
    socket.broadcast.emit('typing', {username: data.username})
  })
```
### Now, for the magic to happen we'll need to add a final socket.on to our chat.js and render the '... is typing...' message on the page:
```js
// chat.js

socket.on("typing", (data) => {
  isTyping.innerText = `${data.username} is typing...`;
});
```

### Next, we'll start coding the functionality to send a message using the input field and button.  Add event listeners for both clicking the button and hitting `Enter` while typing.  Both should emit an event containing the relevant data:
```js
send_message.addEventListener("click", () => {
  socket.emit("new_message", {
    username: username.value,
    message: message.value,
    avatar: avatar.value,
  });
  message.value = "";
});

message.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    socket.emit("new_message", {
      username: username.value,
      message: message.value,
      avatar: avatar.value,
    });
    message.value = "";
  }
});
```
### Sweet!  All that's left is posting the message and having the data persist to the database!  Let's start with the client-side event:
```js
// chat.js

socket.on("new_message", (data) => {
  isTyping.innerText = "";
  messageAudio.play();
  let newMessage = document.createElement("p");
  newMessage.innerHTML = `<p><img id="avatar" height="30" src="${data.avatar}" alt=""> ${data.username}: ${data.message}</p>`;
  chatroom.prepend(newMessage);
  fetch("/chatroom", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      avatar: data.avatar,
      username: data.username,
      message: data.message,
    }),
  });
});
```
### That's a route!!!  Let's write it out:
```js
router.post('/', isLoggedIn, chatsCtrl.postChat);
```
### Then the function:
```js
function postChat(req, res) {
  if (req.body.username === req.user.name) {
    Chat.create(req.body).then(() => {
      res.status(201).send("Added");
    });
  } else {
    res.status(208).send("Already added");
  }
}
```
### Notice how we're preventing multiple entries by checking to make sure the person posting is the person currently logged in!  We're handling the data being stored in the database, let's go add the last emitter on the server:
```js
// io.js

  socket.on('new_message', (data) => {
    io.sockets.emit('new_message', {message: data.message, username: data.username, avatar: data.avatar})
  })
```
### The final piece of this application's giant puzzle is to update the chatRoom function to display the last 150 (or so) messages when the chat room is first loaded, that way the user can get in on the most relevant conversation:
```js
function chatRoom(req, res) {
  Chat.find({})
    .sort({ _id: -1 })
    .limit(150)
    .then((chats) => {
      res.render("chatroom", {
        title: "Chat Room",
        user: req.user,
        chats: chats,
      });
    });
}
```
### Then, adjust the `chatroom.ejs` to reflect the data now being passed and loop over the chats:
```html
<!-- This is where we'll loop over the chats with a forEach -->
<% chats.forEach(c => { %>
  <p><img id="avatarPhoto" height="30" src="<%= c.avatar %>" alt=""> <%= c.username %>: <%= c.message %> - (<%= c.createdAt.toLocaleString() %>)</p>
<% }) %> 
```
### IT'S OVER!!!!!!
