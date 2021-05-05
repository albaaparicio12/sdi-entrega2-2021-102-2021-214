//Módulos
let express = require('express');
let app = express();

let jwt = require('jsonwebtoken');
app.set('jwt',jwt);

var expressSession = require('express-session');
app.use(expressSession({
    secret: 'abcdefg',
    resave: true,
    saveUninitialized: true
}));

let mongo = require('mongodb');
let swig = require('swig');
let crypto = require('crypto');
let bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let gestorBD = require("./modules/gestorBD.js");
gestorBD.init(app,mongo);

// routerUsuarioToken
let routerUsuarioToken = express.Router();
routerUsuarioToken.use(function(req, res, next) {
    // obtener el token, vía headers (opcionalmente GET y/o POST).
    let token = req.headers['token'] || req.body.token || req.query.token;
    if (token != null) {
        // verificar el token
        jwt.verify(token, 'secreto', function(err, infoToken) {
            if (err || (Date.now()/1000 - infoToken.tiempo) > 240 ){
                res.status(403); // Forbidden
                res.json({
                    acceso : false,
                    error: 'Token invalido o caducado'
                });
                // También podríamos comprobar que intoToken.usuario existe
                return;

            } else {
                // dejamos correr la petición
                res.usuario = infoToken.usuario;
                next();
            }
        });

    } else {
        res.status(403); // Forbidden
        res.json({
            acceso : false,
            mensaje: 'No hay Token'
        });
    }
});
// Aplicar routerUsuarioToken
app.use('/api/cancion', routerUsuarioToken);

// routerUsuarioSession
var routerUsuarioSession = express.Router();
routerUsuarioSession.use(function(req, res, next) {
    console.log("routerUsuarioSession");
    if ( req.session.usuario ) {
        let respuesta = {identificado: true};
        next();
    } else {
        req.session.destino = req.originalUrl;
        console.log("va a : "+req.session.destino)
        res.redirect("/identificarse");
    }
});

//Aplicar routerUsuarioSession
app.use("/oferta/destacadas",routerUsuarioSession);
app.use("/oferta/",routerUsuarioSession);

//routerUsuarioAdmin
let routerUsuarioAdmin = express.Router();
routerUsuarioAdmin.use(function(req, res, next) {
    console.log("routerUsuarioAdmin");
    if ( req.session.usuario.email === "admin@email.com" ) {
        next();
    } else {
        console.log("va a : "+req.session.destino);
        res.redirect("/identificarse");
    }
});

//Aplicar routerUsuarioAdmin
app.use("/usuario/listado",routerUsuarioAdmin);
app.use("/usuario/borrar",routerUsuarioAdmin);

app.use(express.static('public'));

//Variables
app.set('port', 8081);
app.set('clave','abcdefg');
app.set('crypto',crypto);
app.set('db', "mongodb://admin:sdi@wallapop-shard-00-00.j68zr.mongodb.net:27017,wallapop-shard-00-01.j68zr.mongodb.net:27017,wallapop-shard-00-02.j68zr.mongodb.net:27017/wallapop?ssl=true&replicaSet=atlas-v2jild-shard-0&authSource=admin&retryWrites=true&w=majority");

require("./routes/rusuarios.js")(app, swig, gestorBD); // (app, param1, param2, etc.)
require("./routes/rofertas.js")(app, swig, gestorBD);
require("./routes/rapiofertas.js")(app, gestorBD);

app.listen(app.get('port'), function() {
    console.log('Servidor activo');
});