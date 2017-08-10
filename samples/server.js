var express = require('express');
var http = require('http');
var https = require('https');
var pem = require('pem');

const httpPort = process.env.PORT||1337;

pem.createCertificate({ days:1, selfSigned:true }, function(err, keys) {
    // Create middleware for a static server
    var app = express();
    // app.all('*', (req, res, next) => {
    //     // always redirect to https
    //     if (req.secure) return next();
    //     res.redirect('https://' + req.hostname + ':' + httpsServer.address().port + req.url);
    // });
    app.use(express.static('_site/.'));

    // Create an HTTPS service
    var httpsServer = https.createServer({
        key: keys.serviceKey,
        cert: keys.certificate
    }, app).listen(0);

    // Create an http service
    http.createServer(app).listen(httpPort);

    console.log(`serving on http://localhost:${httpPort}`);
});