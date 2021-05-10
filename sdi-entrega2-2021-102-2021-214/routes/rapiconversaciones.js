module.exports = function (app, gestorBD) {

    //Este método  crea un mensaje para la oferta X. Si no hay ninguna conversacion previa crea una
    app.post("/api/mensajes/:id/nuevo", function (req, res) {
        let mensaje = {
            "mensaje": req.body.mensaje,
            "leido": false,
            "fecha": new Date(Date.now()).toTimeString(),
            "emisor": req.session.usuario
        }
        let criterioOferta = {"_id": gestorBD.mongo.ObjectID(req.params.id)};
        gestorBD.obtenerOfertas(criterioOferta, function (ofertas) {
            if (ofertas == null) {
                res.status(500);
                res.json({
                    error: "se ha producido un error"
                })
            } else {
                let criterioConversacion = criterioConversacionEsVendedor(ofertas[0],req);
                gestorBD.obtenerConversacion(criterioConversacion, function (conversaciones) {
                    if (conversaciones == null) {
                        res.status(500);
                        res.json({
                            error: "se ha producido un error"
                        })
                    } else if (conversaciones.length === 0) {
                        nuevaConversacion(criterioConversacion, mensaje, req, res);
                    } else {
                        conversacionId = {"conversacion": gestorBD.mongo.ObjectID(conversaciones[0]._id)}
                        insertarMensajeNuevo(mensaje, conversacionId, res);
                    }
                });
            }
        });
    });

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
                });
            }
        })
    });

    //Este método saca todos los mensajes de una oferta en las que el interesado sea el usuario en sesion.
    app.get("/api/mensajes/:id", function (req, res) {
        let criterioOferta = {"_id": gestorBD.mongo.ObjectID(req.params.id)};
        gestorBD.obtenerOfertas(criterioOferta, function (ofertas) {
            if (ofertas == null) {
                res.status(500);
                res.json({
                    error: "se ha producido un error"
                })
            } else {
                gestorBD.obtenerConversacion(criterioConversacionEsVendedor(ofertas[0],req), function (conversaciones) {
                    if (conversaciones == null) {
                        res.status(500);
                        res.json({
                            error: "se ha producido un error"
                        })
                    } else if (conversaciones.length === 0) {
                        res.status(200);
                        res.send(JSON.stringify([])); //Le pasamos una conversación vacía.
                    } else {
                        let criterioMensajes = {"conversacion": gestorBD.mongo.ObjectID(conversaciones[0]._id)};
                        gestorBD.obtenerMensajes(criterioMensajes, function (mensajes) {
                            if (mensajes == null) {
                                res.status(500);
                                res.json({
                                    error: "se ha producido un error"
                                })
                            } else {
                                marcarMensajesComoLeido(conversaciones[0]._id, req, res);
                            }
                        });
                    }
                });
            }
        });
    });

    app.delete("/api/conversacion/:id", function (req, res) {
        let criterio = {
            "_id": gestorBD.mongo.ObjectID(req.params.id)
        };
        gestorBD.obtenerConversacion(criterio, function (conversaciones) {
            if (conversaciones == null) {
                res.status(500);
                res.json({
                    error: "se ha producido un error"
                })
            } else {
                let criterioAux = {
                    "conversacion": conversaciones[0]._id
                }
                gestorBD.eliminarMensajes(criterioAux, function (mensajes) {
                    if (mensajes == null) {
                        res.status(500);
                        res.json({
                            error: "se ha producido un error"
                        })
                    } else {
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
                    }
                })
            }
        })
    });

    app.get("/api/conversaciones", function (req, res) {
        let criterio = {interesado: req.session.usuario};
        let criterioAux = {vendedor: req.session.usuario};

        gestorBD.obtenerConversacion(criterio, function (conversaciones) {
            if (conversaciones == null) {
                res.send("Error");
            } else {
                gestorBD.obtenerConversacion(criterioAux, function (conversacionesAux) {
                    if (conversacionesAux == null) {
                        res.send("Error");
                    } else {
                        //aqui se unirían las listas conversaciones y conversacionesAux
                        let totalConversaciones = conversacionesAux.concat(conversaciones);
                        res.status(200);
                        res.send(JSON.stringify(totalConversaciones));
                    }
                })
            }
        });
    });

    function nuevaConversacion(criterio, mensaje, req, res) {
        let conversacion = {
            "vendedor": criterio.oferta.usuario,
            "interesado": criterio.interesado,
            "oferta": criterio.oferta
        }
        gestorBD.insertarConversacion(conversacion, function (result) {
            if (result === null) {
                res.status(500);
                res.json({
                    error: "se ha producido un error"
                })
            } else {
                conversacionId = {"conversacion": result}
                insertarMensajeNuevo(mensaje, conversacionId, res);
            }
        })

    }

    function marcarMensajesComoLeido(idConversacion, req, res) {
        let criterioNoLeido = {$and: [{"leido": false}, {"conversacion": gestorBD.mongo.ObjectID(idConversacion)}, {"emisor": {$ne: req.session.usuario}}]};
        let mensajeLeido = {"leido": true}
        gestorBD.modificarMensaje(criterioNoLeido, mensajeLeido, function (msg) {
            if (msg == null) {
                res.status(500);
                res.json({
                    error: "se ha producido un error"
                })
            } else {
                let criterioTotalMensajes = {"conversacion": gestorBD.mongo.ObjectID(idConversacion)}
                gestorBD.obtenerMensajes(criterioTotalMensajes, function (mensajes) {
                    if (mensajes == null) {
                        res.status(500);
                        res.json({
                            error: "se ha producido un error"
                        })
                    } else {

                        res.status(200);
                        res.send(JSON.stringify(mensajes));
                    }
                });
            }
        });
    }

    function insertarMensajeNuevo(mensaje, conversacionId, res) {
        let mensajeNuevo = Object.assign(mensaje, conversacionId);
        gestorBD.insertarMensaje(mensajeNuevo, function (id) {
            if (id == null) {
                res.status(500);
                res.json({
                    error: "se ha producido un error"
                })
            } else {
                res.status(200);
                res.send(JSON.stringify(mensajeNuevo));
            }
        })
    }

    function criterioConversacionEsVendedor(oferta,req) {
        let criterioConversacion;
        if (oferta.usuario === req.session.usuario) {
            criterioConversacion = {"oferta": oferta, "vendedor": req.session.usuario};
        } else {
            criterioConversacion = {"oferta": oferta, "interesado": req.session.usuario};
        }
        return criterioConversacion;
    }
}