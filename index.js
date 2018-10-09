const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const uuid = require('uuid');

const app = express();

//Initializing running port of the server
const PORT = 4000;

//Applying middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

//Getting static assets
app.use(express.static('public'));

//Starting the server
app.listen(PORT, () => {
    console.log(`Server started on ${PORT}`);
});


//Defining a variab;e to store session ids alongside csrf tokens
const sessionIDs = {};

//Getting the root (login page)
app.get('/', (req, res) => {
  
    let sessionID = req.cookies['session-id'];

    if (sessionID && sessionIDs[sessionID]) {
        res.sendFile('public/html/home.html', {root: __dirname});
    } else {
        res.sendFile('public/html/index.html', {root: __dirname});
    }
});

//Getting the home page (transfer page)
app.post('/home', (req, res) => {

    const username = req.body.username;
    const password = req.body.password;

    if (username === 'admin' && password === 'admin') {

        //Generating session id and csrf token using universally unique identifier
        const SESSION_ID = uuid.v1(); //timestamp
        const CSRF_TOKEN = uuid.v4(); //random

        sessionIDs[SESSION_ID] = CSRF_TOKEN;

        //Setting session id to header as a cookie
        res.setHeader('Set-Cookie', [`session-id=${SESSION_ID}`, `time=${Date.now()}`]);
        res.sendFile('public/html/home.html', {root: __dirname});

    } else {
        const error = {status: 401, message: 'Invalid Credentials'};
        res.status(401).json(error);
    }
});

//Getting the csrf token for the session id
app.post('/token', (req, res) => {

    const sessionID = req.cookies['session-id'];

    if (sessionIDs[sessionID]) {
        const response = {token: sessionIDs[sessionID]};
        res.json(response);
    } else {
        const error = {status: 400, message: 'Invalid Session ID'};
        res.json(error);
    }
});

//Submitting the form
app.post('/transfer', (req, res) => {

    const csrfToken = req.body.csrfToken;
    const sessionID = req.cookies['session-id'];

    if (sessionIDs[sessionID] && sessionIDs[sessionID] === csrfToken) {
        res.sendFile('public/html/success.html', {root: __dirname});
    } else {
        res.sendFile('public/html/error.html', {root: __dirname});
    }
});

//Logging out
app.post('/logout', (req, res) => {

    const sessionID = req.cookies['session-id'];
    delete sessionIDs[sessionID];

    //Clearing the cookies
    res.clearCookie("session-id");
    res.clearCookie("time");

    res.sendFile('public/html/index.html', {root: __dirname});
});

//Redirecting if home and logout are explicitly called
app.get('/:var(home|logout)?', (req, res) => {
    res.redirect('/');
});