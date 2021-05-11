module.exports = function (app, swig, gestorBD, logger) {

    //W1 Público: Registrarse como usuario
    app.get("/usuario/add", function (req, res) {
        let respuesta = swig.renderFile('views/bregistro.html', {
            identificado: (req.session.usuario !== undefined && req.session.usuario !== null)
        });
        res.send(respuesta);
    });

    app.post('/usuario/add', function (req, res) {
        let contrasenaSegura = app.get('crypto').createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');
        let repContrasenaSegura = app.get('crypto').createHmac('sha256', app.get('clave'))
            .update(req.body.repetirPassword).digest('hex');
        let usuario = {
            nombre: req.body.nombre,
            apellidos: req.body.apellidos,
            email: req.body.email,
            password: contrasenaSegura,
            repetirPassword: repContrasenaSegura,
            dinero: 100,
            rol: "estandar"
        }
        if (validarUsuario(usuario, res)) {
            usuarioYaRegistrado({"email": usuario.email}, function (estaRegistrado) {
                if (estaRegistrado) {
                    res.redirect("/usuario/add?mensaje=Este email ya está registrado. &tipoMensaje=alert-danger");
                } else {
                    gestorBD.insertarUsuario(usuario, function (id) {
                        if (id == null) {
                            logger.error("Registrar usuario: No se pudo insertar el nuevo usuario en la bbdd.");
                            res.redirect("/usuario/add?mensaje=Error al registrar al usuario &tipoMensaje=alert-danger");
                        } else {
                            req.session.usuario = usuario;
                            let respuesta = swig.renderFile('views/opciones.html',
                                {
                                    identificado: (req.session.usuario !== undefined && req.session.usuario !== null),
                                    usuario: usuario
                                });
                            logger.info("Registrar usuario: Usuario "+ usuario.email+" registrado con éxito.");
                            res.send(respuesta);
                        }
                    });
                }
            })
        }
    })

    //W2 Público: Iniciar sesión
    app.get("/identificarse", function (req, res) {
        let respuesta = swig.renderFile('views/bidentificacion.html', {
            identificado: (req.session.usuario !== undefined && req.session.usuario !== null)
        });
        res.send(respuesta);
    });

    app.post("/identificarse", function (req, res) {
        let seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');
        let criterio = {
            email: req.body.email,
            password: seguro
        }
        if (validarCorreo(req.body.email, res)) {
            gestorBD.obtenerUsuarios(criterio, function (usuarios) {
                if (usuarios === null || usuarios.length === 0) {
                    logger.warn("Identificar usuario: Intento de identificación fallido.");
                    req.session.usuario = null;
                    res.redirect("/identificarse" +
                        "?mensaje=Email o password incorrecto" +
                        "&tipoMensaje=alert-danger ");
                } else {
                    req.session.usuario = usuarios[0];
                    let respuesta;
                    // -------- Caso 1: Usuario con perfil de administrador ----------
                    if (req.session.usuario.rol === "admin") {
                        respuesta = swig.renderFile('views/opcionesAdmin.html', {
                            usuario: req.session.usuario,
                            identificado: true
                        });
                    }
                    // -------------- Caso 2: Usuario Estándar ------------------------
                    else {
                        respuesta = swig.renderFile('views/opciones.html', {
                            usuario: req.session.usuario,
                            identificado: true
                        });
                    }
                    logger.info("Identificar usuario: Usuario "+req.session.usuario.email+" identificado con éxito.");
                    res.send(respuesta);
                }
            });
        }
    });

    // W3 Usuario Registrado: Fin de sesión
    app.get('/desconectarse', function (req, res) {
        logger.info("Usuario "+req.session.usuario.email+" desconectado.")
        req.session.usuario = null;
        res.redirect("/identificarse");
    })

    // W4 Administrador: Listado de usuarios
    app.get('/usuario/listado', function (req, res) {
        let criterio = {};
        gestorBD.obtenerUsuarios(criterio, function (lista) {
            if (lista == null) {
                logger.error("Listado de usuarios: No se pudo obtener la lista de usuarios de la bbdd.");
                res.send("Error al listar");
            } else {
                let listaSinAdmin = lista.filter((user) => user.rol !== "admin");
                let respuesta = swig.renderFile('views/listado.html',
                    {
                        listado: listaSinAdmin,
                        usuario: req.session.usuario,
                        identificado: (req.session.usuario !== undefined && req.session.usuario !== null)
                    });
                res.send(respuesta);
            }
        });
    });

    //W5 Administrador: Borrado múltiple de usuarios.
    app.post("/usuario/borrar", function (req, res) {
        let listaCheckBoxes = req.body.box;
        if (listaCheckBoxes !== null && listaCheckBoxes.length > 0 && req.session.usuario.rol === "admin") {
            for (let box in listaCheckBoxes) {
                let criterio = {email: listaCheckBoxes[box]};
                gestorBD.eliminarUsuario(criterio, function (result) {
                    if (result == null) {
                        logger.error("Eliminar usuarios: No se pudo obtener el usuario a borrar de la bbdd.");
                        res.redirect("/usuario/borrar?mensaje=Error al borrar usuarios &tipoMensaje=alert-danger");
                    } else {
                        let criterio2 = {"usuario" : criterio.email};
                        gestorBD.eliminarOferta(criterio2, function(result){
                            if(result == null) {
                                logger.error("Eliminar usuarios: No se pudo obtener las ofertas del usuario a borrar de la bbdd.");
                                res.redirect("/usuario/borrar?mensaje=Error al borrar usuarios &tipoMensaje=alert-danger");
                            } else {
                                let criterio3 = {"emisor" : criterio.email};
                                gestorBD.eliminarMensajes(criterio3, function(result2){
                                    if(result2 == null){
                                        logger.error("Eliminar usuarios: No se pudo obtener los mensajes del usuario a borrar de la bbdd.");
                                        res.redirect("/usuario/borrar?mensaje=Error al borrar usuarios &tipoMensaje=alert-danger");
                                    } else {
                                        let criterio4 = {"vendedor" : criterio.email};
                                        gestorBD.eliminarConversacion(criterio4, function(result3){
                                            if(result3 == null){
                                                logger.error("Eliminar usuarios: No se pudo obtener las conversaciones del usuario a borrar de la bbdd.");
                                                res.redirect("/usuario/borrar?mensaje=Error al borrar usuarios &tipoMensaje=alert-danger");
                                            } else {
                                                let criterio5 = {"interesado" : criterio.email};
                                                gestorBD.eliminarConversacion(criterio5, function(result3){
                                                    if(result3 == null){
                                                        logger.error("Eliminar usuarios: No se pudo obtener las conversaciones del usuario a borrar de la bbdd.");
                                                        res.redirect("/usuario/borrar?mensaje=Error al borrar usuarios &tipoMensaje=alert-danger");
                                                    }
                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                });
            }
            let respuesta = swig.renderFile('views/opcionesAdmin.html', {
                usuario: req.session.usuario,
                identificado: (req.session.usuario !== undefined && req.session.usuario !== null)
            });
            logger.info("Usuarios borrados con éxito.");
            res.send(respuesta);
        } else {
            res.redirect("/usuario/listado");
        }
    });

    function usuarioYaRegistrado(usuario, functionCallback) {
        gestorBD.obtenerUsuarios(usuario, function (usuarios) {
            if (usuarios === null || usuarios.length === 0) {
                functionCallback(false);
            } else {
                logger.warn("Registrar usuario: Intento de registro con un email ya existente.");
                functionCallback(true);
            }
        })
    }

    function validarUsuario(usuario, res) {
        if (usuario.password === null || usuario.password === undefined || usuario.repetirPassword === null || usuario.repetirPassword === undefined) {
            res.redirect("/usuario/add?mensaje=Error en la contraseña: Formato incorrecto. &tipoMensaje=alert-danger");
            return false;
        }
        if (usuario.nombre === null || usuario.nombre === undefined || usuario.nombre.length < 3) {
            res.redirect("/usuario/add?mensaje=Error en el nombre: Deber tener más de 3 caracteres. &tipoMensaje=alert-danger");
            return false;
        }
        if (usuario.apellidos === null || usuario.apellidos === undefined || usuario.apellidos.length < 3) {
            res.redirect("/usuario/add?mensaje=Error en los apellidos: Debe tener más de 3 caracteres. &tipoMensaje=alert-danger");
            return false;
        }
        if (usuario.password !== usuario.repetirPassword) {
            res.redirect("/usuario/add?mensaje=Error con las passwords: no coinciden. &tipoMensaje=alert-danger");
            logger.warn("Registrar usuario: Password y Repetir Password no coinciden.");
            return false;
        }
        return validarCorreo(usuario.email, res);
    }

    function validarCorreo(correo, res) {
        if (correo === null || correo === undefined || correo.length < 4) {
            res.redirect("/identificarse?mensaje=Error en el email: Debe tener más de 4 caracteres e incluir un signo @. &tipoMensaje=alert-danger");
            return false;
        }
        return true;
    }
};
