var express = require('express');
var socket_io = require("socket.io");
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var sass = require('node-sass-middleware');
var uuid = require('node-uuid');

var redis = require('redis').createClient(process.env.REDIS_URL);

// Setup Redis
redis.set('clients:connected', 0);
redis.setnx('clients:counted', 0);

var app = express();

// Socket.io
var io = socket_io();
app.io = io;

// socket.io events
io.on("connection", function (socket) {

    // Client connected
    redis.incr('clients:connected');
    redis.incr('clients:counted');
    io.sockets.emit('player-joined');

    // Client disconnected
    socket.on('disconnect', function () {
        redis.decr('clients:connected');
        io.emit('player-left');
    });

    // Broadcast remote Code
    socket.on('exec-remote', function (data) {
        io.sockets.emit('exec-remote', data);
    });

    // Request CTF Package by Client
    socket.on('ctf-request', function () {
        // Generate Challenge Package
        var data = {};
        data.id = uuid.v1();

        // Generate Secret
        data.secret = uuid.v4();
        redis.hset('challenges:' + data.id, 'secret', data.secret);

        // Setting Algorithm
        data.algorithm = "new Function('token', 'secret', 'return token+secret')";

        // Calculate and store expected Response
        var algorithm = eval(data.algorithm);
        var expectedResult = algorithm(data.id, data.secret);
        redis.hset('challenges:' + data.id, 'expected-result', expectedResult);

        // Send Event
        socket.emit('ctf-challenge', data);
    });

    // Received CTF Response by Client
    socket.on('ctf-response', function (data) {
        // Create answer
        var answer = {};

        if (redis.hexists('challenges:' + data.id, 'secret')) {
            // Challenge exists

            // Check result
            redis.hget('challenges:' + data.id, 'expected-result', function (err, expectedResult) {
                console.log('Expected Result: ' + expectedResult);
                console.log('Received Result: ' + data.result);
                if (expectedResult == data.result) {
                    // Result is corrrect
                    answer.success = true;
                    answer.message = "Answer is correct";
                } else {
                    // Result is incorrect
                    answer.success = false;
                    answer.message = "Answer is incorrect";
                }
                socket.emit('ctf-answer', answer);
            });
        }
        else {
            // Challenge does not exist
            answer.success = false;
            answer.message = "Challenge does not exist";
            socket.emit('ctf-answer', answer);
        }
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
