module.exports = function (app, gestorBD) {

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

    app.post("/api/autenticar", function (req, res) {
        let seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');
        let criterio = {
            email: req.body.email,
            password: seguro
        }
        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
            if (usuarios == null || usuarios.length == 0) {
                res.status(401); //Unauthorized
                res.json({
                    autenticado: false
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

    });

    //Este método  crea un mensaje para la oferta X. Si no hay ninguna conversacion previa crea una
    app.post("/api/mensajes/:id/nuevo", function (req, res) {
        let mensaje = {
            "mensaje": req.body.mensaje,
            "leido": false,
            "fecha": new Date(Date.now()).toTimeString(),
            "emisor": req.session.usuario
        }
        let criterio = {
            "oferta": gestorBD.mongo.ObjectID(req.params.id),
            "interesado": req.session.usuario
        };

        gestorBD.obtenerConversacion(criterio, function (conversaciones) {
            if (conversaciones == null) {
                res.status(500);
                res.json({
                    error: "se ha producido un error"
                })
            } else if (conversaciones.length == 0) {
                nuevaConversacion(criterio, mensaje, req, res);
            } else {
                let mensaje = {
                    "mensaje": req.body.mensaje,
                    "leido": false,
                    "fecha": new Date(Date.now()).toTimeString(),
                    "emisor": req.session.usuario,
                    "conversacion": gestorBD.mongo.ObjectID(conversaciones[0]._id)
                }
                gestorBD.insertarMensaje(mensaje, function (id) {
                    if (id == null) {
                        res.status(500);
                        res.json({
                            error: "se ha producido un error"
                        })
                    } else {
                        res.status(200);
                        res.send(JSON.stringify(mensaje));
                    }
                })
            }
        });
    });

    //Este método saca todos los mensajes de una oferta en las que el interesado sea el usuario en sesion.
    app.get("/api/mensajes/:id", function (req, res) {
        let criterio = {
            "oferta": gestorBD.mongo.ObjectID(req.params.id),
            "interesado": req.session.usuario
        };

        gestorBD.obtenerConversacion(criterio, function (mensajes) {
            if (mensajes == null) {
                res.status(500);
                res.json({
                    error: "se ha producido un error"
                })
            } else {
                res.status(200);
                res.send(JSON.stringify(mensajes));
            }
        })
    })

    //Este método marca como leido un mensaje
    app.get("/api/mensaje/:id/leido", function (req, res) {
        let criterio = {
            "_id": gestorBD.mongo.ObjectID(req.params.id)
        };

        gestorBD.obtenerMensajes(criterio, function (mensajes) {
            if (mensajes == null) {
                res.status(500);
                res.json({
                    error: "se ha producido un error"
                })
            } else {
                let mensaje = mensajes[0];
                mensaje.leido = true;
                gestorBD.modificarMensaje(criterio, mensaje, function (msg) {
                    if (mensajes == null) {
                        res.status(500);
                        res.json({
                            error: "se ha producido un error"
                        })
                    } else {
                        res.status(200);
                        res.send(JSON.stringify(msg));
                    }
                })
            }
        })
    })

    //Este método borra todos los mensajes de una oferta (una conversacion)
    app.delete("/api/mensajes/:id", function (req, res) {
        let criterio = {
            "oferta": gestorBD.mongo.ObjectID(req.params.id),
            "interesado": req.session.usuario
        };
        gestorBD.eliminarConversacion(criterio, function (result) {
            if (result == null) {
                res.status(500);
                res.json({
                    error: "se ha producido un error"
                })
            } else {
                res.status(201);
                res.send("Conversación eliminada");
            }
        })
    });

    function nuevaConversacion(criterio,mensaje, req, res) {
        let criterioOfertaAChatear = {"_id": criterio.oferta};
        gestorBD.obtenerOfertas(criterioOfertaAChatear, function (ofertas) {
            if (ofertas == null) {
                res.status(500);
                res.json({
                    error: "se ha producido un error"
                })
            } else {
                let conversacion = {
                    "vendedor": ofertas[0].usuario,
                    "interesado": criterio.interesado,
                    "oferta": criterio.oferta
                }
                gestorBD.insertarConversacion(conversacion, function (result) {
                    if (conversacion == null) {
                        res.status(500);
                        res.json({
                            error: "se ha producido un error"
                        })
                    } else {
                        gestorBD.insertarMensaje(mensaje, function (id) {
                            if (id == null) {
                                res.status(500);
                                res.json({
                                    error: "se ha producido un error"
                                })
                            } else {
                                res.status(200);
                                res.send(JSON.stringify(mensaje));
                            }
                        })
                    }
                })
            }
        })
    }
}
