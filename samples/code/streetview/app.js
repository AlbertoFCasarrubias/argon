/// <reference types="@argonjs/argon" />
// set up Argon
var app = Argon.init();
// set our desired reality 
app.reality.request(
    Argon.resolveURL('../streetview-reality/index.html')
);
