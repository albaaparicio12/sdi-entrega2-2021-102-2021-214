module.exports = function (app, gestorBD) {

    //S3 Usuario identificado: Enviar mensajes a una oferta
    //Este método  crea un mensaje para la oferta X. Si no hay ninguna conversacion previa crea una.
    //En el caso de que el usuario sea propietario de la oferta, el mensaje se añade a la conversación. Si
    //la conversación no está previamente creada dará error (ya que no puedes iniciar una conversación contigo mismo)
    app.post("/api/mensajes/:id/nuevo", function (req, res) {
        let mensaje = {
            "mensaje": req.body.mensaje,
            "leido": false,
            "fecha": new Date(Date.now()).toTimeString(),
            "emisor": req.session.usuario
        }
        validarMensajeNuevo(mensaje, function (errores) {
            if (errores !== null && errores.length > 0) {
                res.status(403); //Forbidden
                res.json({
                    errores: errores
                })
            } else {
                let criterioOferta = {"_id": gestorBD.mongo.ObjectID(req.params.id)};
                gestorBD.obtenerOfertas(criterioOferta, function (ofertas) {
                    if (ofertas == null) {
                        res.status(500);
                        res.json({
                            error: "se ha producido un error"
                        })
                    } else {
                        let criterioConversacion = criterioConversacionEsVendedor(ofertas[0], req);
                        gestorBD.obtenerConversacion(criterioConversacion, function (conversaciones) {
                                if (conversaciones == null) {
                                    res.status(500);
                                    res.json({
                                        error: "se ha producido un error"
                                    })
                                } else if (conversaciones.length === 0) {
                                    validarSiEsPropietarioOferta(req.session.usuario, ofertas[0], function (errores) {
                                        if (errores !== null && errores.length > 0) {
                                            res.status(403); //Forbidden
                                            res.json({
                                                errores: errores
                                            })
                                        } else {
                                            nuevaConversacion(criterioConversacion, mensaje, req, res);
                                        }
                                    })
                                } else {
                                    let conversacionId = {"conversacion": gestorBD.mongo.ObjectID(conversaciones[0]._id)}
                                    insertarMensajeNuevo(mensaje, conversacionId, res);
                                }
                            }
                        );
                    }
                })

            }
        });
    });

    //S4 Usuario identificado: Obtener los mensajes de una conversación
    //Este método saca todos los mensajes de una oferta en las que el interesado sea el usuario en sesion.
    //Si no tiene una conversación previa en esa oferta devuelve un Array vacío.
    app.get("/api/mensajes/:id", function (req, res) {
        let criterioOferta = {"_id": gestorBD.mongo.ObjectID(req.params.id)};
        gestorBD.obtenerOfertas(criterioOferta, function (ofertas) {
            if (ofertas == null) {
                res.status(500);
                res.json({
                    error: "se ha producido un error"
                })
            } else {
                gestorBD.obtenerConversacion(criterioConversacionEsVendedor(ofertas[0], req), function (conversaciones) {
                    if (conversaciones == null) {
                        res.status(500);
                        res.json({
                            error: "se ha producido un error"
                        })
                    } else if (conversaciones.length === 0) {
                        res.status(200);
                        res.send(JSON.stringify([])); //Le pasamos una conversación vacía.
                    } else {
                        validarSiEsVendedorOInteresadoConversacion(req.session.usuario, conversaciones[0], function (errores) {
                            if (errores !== null && errores.length > 0) {
                                res.status(403); //Forbidden
                                res.json({
                                    errores: errores
                                })
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
            }
        });
    });

    //S5: Obtener el listado de conversaciones
    //Este método te devuelve la lista de conversaciones del usuario en sesión
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
                        let totalConversaciones = conversacionesAux.concat(conversaciones);
                        for (let i = 0; i < totalConversaciones.length; i++) {
                            totalConversaciones[i].noLeidos = actualizarLeidos(totalConversaciones[i]);
                        }
                        res.status(200);
                        res.send(JSON.stringify(totalConversaciones));
                    }
                })
            }
        });
    });

    //S6: Eliminar una conversación
    //Este método elimina una conversación y todos los mensajes de esta
    app.delete("/api/conversacion/:id", function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};
        gestorBD.obtenerConversacion(criterio, function (conversaciones) {
            if (conversaciones == null) {
                res.status(500);
                res.json({
                    error: "se ha producido un error"
                })
            } else {
                validarSiEsVendedorOInteresadoConversacion(req.session.usuario, conversaciones[0], function (errores) {
                    if (errores !== null && errores.length > 0) {
                        res.status(403); //Forbidden
                        res.json({
                            errores: errores
                        })
                    } else {
                        let criterioAux = {"conversacion": conversaciones[0]._id}
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
            }
        })
    });

    //S7: Marcar mensaje como leído
    //Este método marca como leido un mensaje
    app.put("/api/mensaje/:id/leido", function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};
        let errores = [];
        validarUsuario(req.session.usuario, errores);
        if (req.params.id == null || typeof req.params.id === 'undefined') {
            res.status(500);
            res.json({
                error: "Error: no se ha detectado ningún mensaje."
            })
        }
        gestorBD.obtenerMensajes(criterio, function (mensajes) {
            if (mensajes == null) {
                res.status(500);
                res.json({
                    error: "Error: no se ha encontrado el mensaje."
                })
            } else {
                if (mensajes[0].emisor == null || typeof mensajes[0].emisor === 'undefined')
                    errores.push("Error en el mensaje: no se ha detectado ningun emisor.");
                gestorBD.obtenerConversacion({"_id": gestorBD.mongo.ObjectID(mensajes[0].conversacion)}, function (conversaciones) {
                    if (conversaciones == null || conversaciones.length === 0) {
                        errores.push("Error en el mensaje: no pertenece a ninguna conversación.")
                    } else {
                        validarSiEsVendedorOInteresadoConversacion(req.session.usuario, conversaciones[0], function (erroresConversacion) {
                            if (erroresConversacion != null && erroresConversacion.length > 0) {
                                errores = errores.concat(erroresConversacion);
                            }
                        });
                        if (errores !== null && errores.length > 0) {
                            res.status(403); //Forbidden
                            res.json({
                                errores: errores
                            })
                        } else {
                            let mensaje = mensajes[0];
                            mensaje.leido = true;
                            gestorBD.modificarMensaje(criterio, mensaje, function (msg) {
                                if (msg == null) {
                                    res.status(500);
                                    res.json({
                                        error: "se ha producido un error"
                                    })
                                } else {
                                    res.status(200);
                                    res.json({
                                        mensaje: "mensaje marcado como leído",
                                        _id: req.params.id
                                    })
                                }
                            });
                        }
                    }
                });

            }
        })
    });

    function actualizarLeidos(conversacion) {
        let criterio1 = {
            "conversacion": gestorBD.mongo.ObjectID(conversacion.id),
            "leido": false
        };
        let criterio2 = {"_id": gestorBD.mongo.ObjectID(conversacion.id)};
        gestorBD.obtenerConversacion(criterio2, function (conversacion) {
            if (conversacion == null) {

            } else {
                gestorBD.obtenerMensajes(criterio1, function (mensajes) {
                    if (mensajes == null) {

                    } else {
                        return mensajes.length;
                    }
                })
            }
        })
    }

    function getTotalNoLeidos(conversacion, req, res) {
        let criterio = {
            "conversacion": gestorBD.mongo.ObjectID(conversacion.id)
        };
        let counter = 0;
        gestorBD.obtenerMensajes(criterio, function (mensajes) {
            if (mensajes == null) {
                res.send("Error");
            } else {
                for (i = 0; i < mensajes.length; i++) {
                    if (mensajes[i].leido == true) {
                        counter = counter + 1;
                    }
                }
                return counter;
            }
        })
    }

    function nuevaConversacion(criterio, mensaje, req, res) {
        let conversacion = {
            "vendedor": criterio.oferta.usuario,
            "interesado": criterio.interesado,
            "oferta": criterio.oferta,
            "noLeidos": 0
        }
        gestorBD.insertarConversacion(conversacion, function (result) {
            if (result === null) {
                res.status(500);
                res.json({
                    error: "se ha producido un error"
                })
            } else {
                let conversacionId = {"conversacion": result}
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

    function criterioConversacionEsVendedor(oferta, req) {
        let criterioConversacion;
        if (oferta.usuario === req.session.usuario) {
            criterioConversacion = {"oferta": oferta, "vendedor": req.session.usuario};
        } else {
            criterioConversacion = {"oferta": oferta, "interesado": req.session.usuario};
        }
        return criterioConversacion;
    }

    function validarSiEsVendedorOInteresadoMensaje(usuario, idMensaje, functionCallback) {
        let errores = [];
        validarUsuario(usuario, errores);
        if (idMensaje == null || typeof idMensaje === 'undefined')
            errores.push("Error: no se ha detectado ningun mensaje.");
        gestorBD.obtenerMensajes({"_id": gestorBD.mongo.ObjectID(idMensaje)}, function (mensajes) {
            if (mensajes == null || mensajes.length === 0) {
                errores.push("Error: no se ha encontrado el mensaje.");
            } else {
                if (mensajes[0].emisor == null || typeof mensajes[0].emisor === 'undefined')
                    errores.push("Error en el mensaje: no se ha detectado ningun emisor.");
                gestorBD.obtenerConversacion({"_id": gestorBD.mongo.ObjectID(mensajes[0].conversacion)}, function (conversaciones) {
                    if (conversaciones == null || conversaciones.length === 0) {
                        errores.push("Error en el mensaje: no pertenece a ninguna conversación.")
                    } else {
                        validarSiEsVendedorOInteresadoConversacion(usuario, conversaciones[0], function (erroresConversacion) {
                            if (erroresConversacion != null && erroresConversacion.length > 0) {
                                errores = errores.concat(erroresConversacion);
                            }
                        });
                    }
                });
            }
        });

        functionCallback(errores);
    }

    function validarSiEsVendedorOInteresadoConversacion(usuario, conversacion, functionCallback) {
        let errores = [];
        validarUsuario(usuario, errores);
        if (conversacion == null || typeof conversacion === 'undefined')
            errores.push("Error: no se ha detectado ninguna conversación.");
        if (conversacion.vendedor == null || typeof conversacion.vendedor === 'undefined')
            errores.push("Error en la conversación: no se ha detectado ningun vendedor.");
        if (conversacion.interesado == null || typeof conversacion.interesado === 'undefined')
            errores.push("Erroren la conversación: no se ha detectado ningun comprador.");
        if (conversacion.interesado !== usuario && conversacion.vendedor !== usuario)
            errores.push("Error - No tiene permisos para realizar esta acción.");
        functionCallback(errores);
    }

    function validarUsuario(usuario, errores) {
        if (usuario == null || typeof usuario === 'undefined')
            errores.push("Error: no se ha detectado ningún usuario.");
    }

    function validarSiEsPropietarioOferta(usuario, oferta, functionCallback) {
        let errores = [];
        if (usuario === oferta.usuario)
            errores.push("Error: no puedes enviar mensajes a tu propia oferta.")
        functionCallback(errores);
    }

    function validarMensajeNuevo(mensaje, functionCallback) {
        let errores = [];
        if (mensaje.mensaje == null || typeof mensaje.mensaje === 'undefined' || mensaje.mensaje.length <= 0)
            errores.push("Error en el mensaje: no se ha detectado ningún mensaje.");
        if (mensaje.fecha == null || typeof mensaje.fecha === 'undefined')
            errores.push("Error en la fecha del mensaje: se ha detectado un formato incorrecto.");
        if (mensaje.emisor == null || typeof mensaje.emisor === 'undefined')
            errores.push("Error en el emisor del mensaje: se ha detectado un formato incorrecto.");

        functionCallback(errores);
    }
}