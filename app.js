var express = require('express');
var socket_io = require("socket.io");
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var sass = require('node-sass-middleware');

var client = require('redis').createClient(process.env.REDIS_URL);
client.set('clients-connected', 0);

var app = express();

// Socket.io
var io = socket_io();
app.io = io;

// socket.io events
io.on("connection", function (socket) {
    console.log("A user connected");
    client.incr('clients-connected');

    io.sockets.emit('player-joined');

    socket.on('exec-remote', function (data) {
        io.sockets.emit('exec-remote', data);
    });

    socket.on('ctf-request', function () {
        var data = {};

        data.tokenId = "abcdefg";
        data.tokenSeret = "abcdefg";
        data.tokenAlgorithm = "new Function('token', 'secret', 'return token+secret')";

        socket.emit('ctf-challenge', data);
    });

    socket.on('ctf-response', function (data) {
        console.log(data);
    });

});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(sass({
    /* Options */
    src: path.join(__dirname, 'static/scss'),
    dest: path.join(__dirname, 'public/css'),
    debug: true,
    outputStyle: 'compressed',
    prefix: '/css'  // Where prefix is at <link rel="stylesheets" href="prefix/style.css"/>
}));
app.use(express.static(path.join(__dirname, 'public')));


/**
 * Routes
 */

var routes = require('./routes/index');
app.use('/', routes);
var arena = require('./routes/arena');
app.use('/arena', arena);

/**
 * Error Stuff
 */

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
