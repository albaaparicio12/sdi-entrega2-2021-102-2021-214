module.exports = function (app, gestorBD) {

    //S2 Usuario identificado: Mostrar listado de ofertas disponibles (Sólo las ofertas de los otros
    // usuarios)
    app.get("/api/ofertas", function (req, res) {
        gestorBD.obtenerOfertas({}, function (ofertas) {
            if (ofertas == null) {
                res.status(500);
                res.json({
                    error: "Se ha producido un error al cargar las ofertas"
                })
            } else {
                let user = req.session.usuario;
                let listaSinUser = ofertas.filter((oferta) => oferta.usuario !== user);
                res.status(200);
                res.send(JSON.stringify(listaSinUser));
            }
        });
    });

    //S1 Identificarse como usuario vía token
    app.post("/api/autenticar", function (req, res) {
        let seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');
        let criterio = {
            email: req.body.email,
            password: seguro
        }
        validarUsuario(criterio, function (errores) {
            if (errores !== null && errores.length > 0) {
                res.status(403); //Forbidden
                res.json({
                    errores: errores
                })
            } else {
                gestorBD.obtenerUsuarios(criterio, function (usuarios) {
                    if (usuarios == null || usuarios.length === 0) {
                        res.status(401); //Unauthorized
                        res.json({
                            autenticado: false,
                            error: "Email o contraseña incorrectos."
                        })
                    } else {
                        req.session.usuario = criterio.email;
                        let token = app.get('jwt').sign(
                            {usuario: criterio.email, tiempo: Date.now() / 1000},
                            "secreto");
                        res.status(200);
                        res.json({
                            autenticado: true,
                            token: token
                        });
                    }
                });
            }
        });
    });

    function validarUsuario(usuario, functionCallback) {
        let errores = [];
        if (usuario == null || typeof usuario === 'undefined')
            errores.push("Error: no se ha detectado ningún usuario.");
        if (usuario.email == null || typeof usuario.email === 'undefined' || usuario.email.length < 4)
            errores.push("Error: email incorrecto");

        functionCallback(errores);
    }
}
