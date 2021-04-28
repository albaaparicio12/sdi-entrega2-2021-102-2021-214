//Módulos
let express = require('express');
let app = express();

var expressSession = require('express-session');
app.use(expressSession({
    secret: 'abcdefg',
    resave: true,
    saveUninitialized: true
}));
let swig = require('swig');
let crypto = require('crypto');
let mongo = require('mongodb');
let bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let gestorBD = require("./modules/gestorBD.js");
gestorBD.init(app,mongo);

// routerUsuarioSession
var routerUsuarioSession = express.Router();
routerUsuarioSession.use(function(req, res, next) {
    console.log("routerUsuarioSession");
    if ( req.session.usuario ) {
        // dejamos correr la petición
        next();
    } else {
        console.log("va a : "+req.session.destino)
        res.redirect("/identificarse");
    }
});

//Aplicar routerUsuarioSession
//app.use("/canciones/agregar",routerUsuarioSession);

app.use(express.static('public'));

//Variables
app.set('port', 8081);
app.set('clave','abcdefg');
app.set('crypto',crypto);
//AQUI TIENE QUE IR app.set('db', "...")

require("./routes/rusuarios.js")(app, swig, gestorBD); // (app, param1, param2, etc.)

app.listen(app.get('port'), function() {
    console.log('Servidor activo');
});