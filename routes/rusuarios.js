module.exports = function(app, swig, gestorBD) {
    app.get("/usuario/add", function(req, res) {
        let respuesta = swig.renderFile('views/bregistro.html',{
            identificado: (req.session.usuario !== undefined && req.session.usuario !== null)? true : false
        });
        res.send(respuesta);
    });

    app.post('/usuario/add', function(req, res) {
        let contraseñaSegura = app.get('crypto').createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');
        let repContraseñaSegura = app.get('crypto').createHmac('sha256', app.get('clave'))
            .update(req.body.repetirPassword).digest('hex');
        let usuario = {
            nombre : req.body.nombre,
            apellidos : req.body.apellidos,
            email : req.body.email,
            password: contraseñaSegura,
            repetirPassword : repContraseñaSegura,
            dinero : 100,
            rol : "estandar"
        }
        if(req.body.password != req.body.repetirPassword){
            res.redirect("/usuario/add?mensaje=Error con las passwords, no coinciden &tipoMensaje=alert-danger");
        }
        else {
            usuarioYaRegistrado({"email": usuario.email}, function (estaRegistrado) {
                if (estaRegistrado) {
                    res.redirect("/usuario/add?mensaje=Este email ya está registrado &tipoMensaje=alert-danger");
                } else {
                    gestorBD.insertarUsuario(usuario, function (id) {
                        if (id == null) {
                            res.redirect("/usuario/add?mensaje=Error al registrar al usuario &tipoMensaje=alert-danger");
                        } else {
                            req.session.usuario = usuario;
                            let respuesta = swig.renderFile('views/opciones.html',
                                {
                                    identificado: (req.session.usuario !== undefined && req.session.usuario !== null)? true : false,
                                    usuario : usuario
                                });
                            res.send(respuesta);
                        }
                    });
                }
            })
        }

    })

    app.get("/identificarse", function(req, res) {
        let respuesta = swig.renderFile('views/bidentificacion.html',{
            identificado: (req.session.usuario !== undefined && req.session.usuario !== null)? true : false
        });
        res.send(respuesta);
    });

    app.post("/identificarse", function(req, res) {
        let seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');
        let criterio = {
            email : req.body.email,
            password : seguro
        }
        gestorBD.obtenerUsuarios(criterio, function(usuarios) {
            if (usuarios == null || usuarios.length == 0) {
                req.session.usuario = null;
                res.redirect("/identificarse" +
                    "?mensaje=Email o password incorrecto"+
                    "&tipoMensaje=alert-danger ");
            } else {
                req.session.usuario = usuarios[0];
                let respuesta;
                if(req.session.usuario.email == "admin@email.com"){
                    respuesta = swig.renderFile('views/opcionesAdmin.html',{
                        usuario : req.session.usuario,
                        identificado: (req.session.usuario !== undefined && req.session.usuario !== null)? true : false
                    });
                } else {
                    respuesta =swig.renderFile('views/opciones.html',{
                        usuario : req.session.usuario,
                        identificado: (req.session.usuario !== undefined && req.session.usuario !== null)? true : false
                    });
                }
                res.send(respuesta);
            }
        });
    });

    app.get('/desconectarse', function (req, res) {
        req.session.usuario = null;
        res.redirect("/identificarse");
    })

    app.get('/usuario/listado', function (req, res){
        let criterio = {};
        gestorBD.obtenerUsuarios(criterio, function(lista){
            if(lista == null){
                res.send("Error al listar");
            } else {
                let listaSinAdmin = lista.filter((user) => user.email !== "admin@email.com");
                let respuesta = swig.renderFile('views/listado.html',
                    {
                        listado : listaSinAdmin,
                        usuario : req.session.usuario,
                        identificado: (req.session.usuario !== undefined && req.session.usuario !== null)? true : false
                    });
                res.send(respuesta);
            }
        });
    });

    app.post("/usuario/borrar", function (req,res){
        let listaCheckBoxes = req.body.box;
        if(listaCheckBoxes !== null || listaCheckBoxes.length > 0) {
            for (let box in listaCheckBoxes) {
                let criterio = {email: listaCheckBoxes[box]};
                gestorBD.eliminarUsuario(criterio, function (result) {
                    if (result == null) {
                        res.redirect("/usuario/borrar?mensaje=Error al borrar usuarios &tipoMensaje=alert-danger");
                    } else {
                        let respuesta = swig.renderFile('views/opcionesAdmin.html',{
                            usuario : req.session.usuario,
                            identificado: (req.session.usuario !== undefined && req.session.usuario !== null)? true : false
                        });
                        res.send(respuesta);
                    }
                });
            }
        }else{
            let respuesta = swig.renderFile('views/listado.html',{
                usuario : req.session.usuario,
                identificado: (req.session.usuario !== undefined && req.session.usuario !== null)? true : false
            });
            res.send(respuesta);
        }
    });

    function usuarioYaRegistrado(usuario, functionCallback){
        gestorBD.obtenerUsuarios(usuario,function(usuarios){
            if(usuarios == null || usuarios.length == 0){
                functionCallback(false);
            } else {
                functionCallback(true);
            }
        })
    }
};
