// Logging
function log(message) {
    var date = new Date();
    $('pre.log').prepend('[' + date.getTime() + '] ' + message + "\n");
}

$(document).ready(function () {
    log("Starting arena client ...");

    // Initialize Editor
    var editor = ace.edit("ace");
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/javascript");

    // Start Socket
    var socket = io.connect(document.location.protocol + "//" + document.location.host + "/");

    socket.on('error', function () {
        log("Error connecting to server!");
    });
    socket.on('connect', function () {
        log("Connected to Server!");
    });
    socket.on('disconnect', function () {
        log("Disconnected from Server!");
    });
    socket.on('reconnect', function () {
        log("Reconnected to server!");
    });
    socket.on('reconnecting', function () {
        log("Trying to reconnect ...");
    });

    socket.on('player-joined', function () {
        log("A new player has joined the arena!");
    });

    socket.on('exec-remote', function (data) {
        log("Executing remote code ...");
        eval(data);
    });

    $("#local").click(function (e) {
        e.preventDefault();
        log("Executing code on local system...");
        eval(editor.getValue());
    });
    $("#remote").click(function (e) {
        e.preventDefault();
        log("Executing code on remote systems ...");
        socket.emit('exec-remote', editor.getValue());
    });
});

