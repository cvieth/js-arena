// Initialize Editor
var editor = ace.edit("ace");
editor.setTheme("ace/theme/monokai");
editor.getSession().setMode("ace/mode/javascript");

// Start Socket
var socket = io.connect("http://js-arena-staging-pr-1.herokuapp.com/");
socket.on('receive', function (data) {
    console.log(data);
    eval(data);
});

$(document).ready(function () {
    $("#send").click(function () {
        socket.emit('send', editor.getValue());
    });
});