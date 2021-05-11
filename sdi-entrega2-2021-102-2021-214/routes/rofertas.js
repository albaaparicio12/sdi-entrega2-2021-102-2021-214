module.exports = function (app, swig, gestorBD) {
    app.get("/oferta/add", function (req, res) {
        let respuesta = swig.renderFile('views/bofertaNueva.html', {
            identificado: (req.session.usuario !== undefined && req.session.usuario !== null),
            usuario: req.session.usuario
        });
        res.send(respuesta);
    });

    app.post('/oferta/add', function (req, res) {
        let oferta = {
            usuario: req.session.usuario.email,
            titulo: req.body.titulo,
            detalles: req.body.detalles,
            fecha: new Date(Date.now()).toUTCString(),
            precio: req.body.precio,
            disponible: "Comprar",
            comprador: null,
            destacada: req.body.boxDestacada
        }
        if (validarOferta(oferta, res)) {
            gestorBD.insertarOferta(oferta, function (id) {
                if (id == null) {
                    res.redirect("/oferta/add?mensaje=Error al insertar la oferta &tipoMensaje=alert-danger");
                } else {
                    if (oferta.destacada === "true") {
                        pagarOfertaDestacada(req, res);
                    } else {
                        res.redirect("/oferta/listado");
                    }
                }
            });
        }
    });

    app.get("/oferta/borrar/:id", function (req, res) {
        let criterio = {$and: [{"_id": gestorBD.mongo.ObjectID(req.params.id)}, {"disponible": "Comprar"}]};
        let criterioU = {"usuario": req.session.usuario.email};
        gestorBD.obtenerOfertas({"_id": gestorBD.mongo.ObjectID(req.params.id)}, function (ofertas) {
            if (ofertas == null || ofertas.length === 0) {
                res.send("Error al obtener la oferta.");
            } else {
                if (ofertas[0].usuario !== req.session.usuario.email) {
                    res.redirect("/oferta/listado?mensaje=Error: No eres dueño de la oferta seleccionada. &tipoMensaje=alert-danger");
                } else {
                    if (validarUsuarioYOferta(req.session.usuario.email, req.params.id, res)) {
                        gestorBD.eliminarOferta(criterio, function (result) {
                            if (result === false) {
                                res.redirect("/oferta/borrar?mensaje=Error al borrar la oferta. &tipoMensaje=alert-danger");
                            } else {
                                gestorBD.obtenerOfertas(criterioU, function (lista) {
                                    if (lista == null) {
                                        res.send("Error al listar ofertas");
                                    } else {
                                        let respuesta = swig.renderFile('views/listadoOfertas.html',
                                            {
                                                listado: lista,
                                                identificado: (req.session.usuario !== undefined && req.session.usuario !== null),
                                                usuario: req.session.usuario
                                            });
                                        res.send(respuesta);
                                    }
                                });
                            }
                        });
                    }
                }
            }
        });

    });

    app.get('/oferta/listado', function (req, res) {
        let criterio = {"usuario": req.session.usuario.email};
        gestorBD.obtenerOfertas(criterio, function (lista) {
            if (lista == null) {
                res.send("Error al listar ofertas");
            } else {
                let respuesta = swig.renderFile('views/listadoOfertas.html',
                    {
                        listado: lista,
                        identificado: (req.session.usuario !== undefined && req.session.usuario !== null),
                        usuario: req.session.usuario
                    });
                res.send(respuesta);
            }
        });
    });

    app.get("/oferta/destacadas", function (req, res) {
        let criterio = {"destacada": "true"};

        gestorBD.obtenerOfertas(criterio, function (lista) {
            if (lista == null) {
                res.send("Error al listar ofertas");
            } else {
                let respuesta = swig.renderFile('views/listadoDestacadas.html',
                    {
                        listado: lista,
                        identificado: (req.session.usuario !== undefined && req.session.usuario !== null),
                        usuario: req.session.usuario
                    });
                res.send(respuesta);
            }
        });
    })

    app.get("/oferta/tienda", function (req, res) {
        let criterio = {};
        if (req.query.busqueda != null) {
            criterio = {"titulo": new RegExp(req.query.busqueda, 'i')};
        }

        let pg = parseInt(req.query.pg);
        if (req.query.pg == null) {
            pg = 1;
        }

        gestorBD.obtenerOfertasPg(criterio, pg, function (ofertas, total) {
            if (ofertas == null) {
                res.send("Error al listar ");
            } else {
                let ultimaPg = total / 5;
                if (total % 5 > 0) { // Sobran decimales
                    ultimaPg = ultimaPg + 1;
                }
                let paginas = []; // paginas mostrar
                for (let i = pg - 2; i <= pg + 2; i++) {
                    if (i > 0 && i <= ultimaPg) {
                        paginas.push(i);
                    }
                }
                let listaSinOfertasUsuario = ofertas.filter((oferta) => oferta.usuario !== req.session.usuario.email);
                let respuesta = swig.renderFile('views/tienda.html',
                    {
                        ofertas: listaSinOfertasUsuario,
                        paginas: paginas,
                        actual: pg,
                        usuario: req.session.usuario,
                        identificado: (req.session.usuario !== undefined && req.session.usuario !== null)
                    });
                res.send(respuesta);
            }
        });
    });

    app.get("/oferta/comprar/:id", function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};

        gestorBD.obtenerOfertas(criterio, function (ofertas) {
            if (ofertas == null) {
                res.send("Error al comprar oferta");
            } else {
                if (validarOferta(ofertas[0], res)) {
                    comprarOferta(ofertas[0], criterio, req, res);
                }
            }
        });
    });

    app.get("/oferta/compras/", function (req, res) {
        let criterio = {"comprador": req.session.usuario.email};

        gestorBD.obtenerOfertas(criterio, function (lista) {
            if (lista == null) {
                res.send("Error al listar ofertas");
            } else {
                let respuesta = swig.renderFile('views/listadoCompras.html',
                    {
                        listado: lista,
                        identificado: (req.session.usuario !== undefined && req.session.usuario !== null),
                        usuario: req.session.usuario
                    });
                res.send(respuesta);
            }
        });
    })

    app.get("/oferta/mensajes", function (req, res) {
        let criterio = {vendedor: req.session.usuario};
        let criterioAux = {interesado: req.session.usuario};

        gestorBD.obtenerMensajes(criterio, function (mensajes) {
            if (mensajes == null) {
                res.send("Error al obtener sus mensajes.")
            } else {
                gestorBD.obtenerMensajes(criterioAux, function (mensajes2) {
                    if (mensajes2 == null) {
                        res.send("error");
                    } else {
                        let totalConversaciones = mensajes.concat(mensajes2);
                        let respuesta = swig.renderFile('views/listaMensajes.html',
                            {
                                identificado: (req.session.usuario !== undefined && req.session.usuario !== null),
                                usuario: req.session.usuario,
                                mensajes: totalConversaciones
                            });
                        res.send(respuesta);
                    }
                })
            }
        })
    })

    app.get("/oferta/mensaje/:id", function (req, res) {
        let criterio = {oferta: gestorBD.mongo.ObjectID(req.params.id)};
        let criterioAux = {"_id": gestorBD.mongo.ObjectID(req.params.id)};

        gestorBD.obtenerMensajes(criterio, function (mensajes) {
            if (mensajes == null) {
                res.send("Error");
            } else {
                gestorBD.obtenerOfertas(criterioAux, function (ofertas) {
                    if (ofertas == null) {
                        res.send("Error");
                    } else {
                        let respuesta = swig.renderFile('views/mensajeNuevo.html',
                            {
                                identificado: (req.session.usuario !== undefined && req.session.usuario !== null),
                                usuario: req.session.usuario,
                                mensajes: mensajes,
                                oferta: ofertas[0]
                            });
                        res.send(respuesta);
                    }
                })
            }
        });
    });

    app.get("/oferta/conversaciones", function (req, res) {
        let criterio = {interesado: req.session.usuario.email};
        let criterioAux = {vendedor: req.session.usuario.email};

        gestorBD.obtenerConversacion(criterio, function (conversaciones) {
            if (conversaciones == null) {
                res.send("Error");
            } else {
                gestorBD.obtenerConversacion(criterioAux, function (conversacionesAux) {
                    if (conversacionesAux == null) {
                        res.send("Error");
                    } else {
                        let conversacionesTotal = conversaciones.concat(conversacionesAux);
                        let respuesta = swig.renderFile('views/conversaciones.html',
                            {
                                identificado: (req.session.usuario !== undefined && req.session.usuario !== null),
                                usuario: req.session.usuario,
                                conversaciones: conversacionesTotal
                            });
                        res.send(respuesta);
                    }
                })
            }
        });
    });

    app.post("/oferta/mensaje/:id", function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};

        gestorBD.obtenerOfertas(criterio, function (ofertas) {
            if (ofertas == null) {
                res.redirect("/oferta/conversaciones?mensaje=Error al enviar el mensaje &tipoMensaje=alert-danger");
            } else {
                let mensaje = {
                    oferta: ofertas[0],
                    vendedor: ofertas[0].usuario,
                    interesado: req.session.usuario,
                    mensaje: req.body.texto,
                    fecha: new Date(Date.now()).toUTCString(),
                    leido: false
                }
                if (validarMensaje(mensaje, res)) {
                    gestorBD.insertarMensaje(mensaje, function (id) {
                        if (id == null) {
                            res.send("Error");
                        } else {
                            res.redirect("/oferta/mensajes");
                        }
                    })
                }
            }
        });
    })

    app.get("/oferta/destacar/:id", function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};
        gestorBD.obtenerOfertas(criterio, function (ofertas) {
            if (ofertas == null || ofertas.length === 0) {
                res.send("Error al obtener la oferta.");
            } else {
                if (ofertas[0].usuario !== req.session.usuario.email) {
                    res.redirect("/oferta/listado?mensaje=Error: No eres dueño de la oferta seleccionada. &tipoMensaje=alert-danger");
                } else {
                    if (validarUsuarioYOferta(req.session.usuario.email, req.params.id, res)) {
                        if (ofertas[0].destacada === "true") {
                            res.redirect("/oferta/listado?mensaje=Error - Ya está destacada&tipoMensaje=alert-danger");
                        } else {
                            let oferta = ofertas[0];
                            destacarOferta(oferta, criterio, req, res);
                        }
                    }
                }
            }
        });
    });

    app.get('/oferta/*', function (req, res) {
        res.redirect("/oferta/listado");
    });

    function comprarOferta(oferta, criterio, req, res) {
        if (validarSiPuedoComprarOferta(oferta, req, res)) {
            let ofertaNueva = {
                disponible: "Vendido",
                comprador: req.session.usuario.email
            }
            gestorBD.modificarOferta(criterio, ofertaNueva, function (result) {
                if (result == null) {
                    res.send("Error al modificar la oferta");
                } else {
                    let nuevoDinero = {dinero: req.session.usuario.dinero - oferta.precio};
                    modificarSaldoUser(nuevoDinero, req, res);
                }
            });
        }
    }

    function pagarOfertaDestacada(req, res) {
        let usuario = req.session.usuario;
        if (usuario.dinero >= 20) {
            let dinero = {"dinero": usuario.dinero - 20};
            modificarSaldoUser(dinero, req, res);
        } else {
            res.redirect("/oferta/add?mensaje=Error - No tienes suficiente dinero!&tipoMensaje=alert-danger");
        }
    }

    function destacarOferta(oferta, criterio, req, res) {
        oferta.destacada = "true";
        let usuario = req.session.usuario;
        if (usuario.dinero < 20) {
            res.redirect("/oferta/listado?mensaje=Error - No tienes suficiente dinero!&tipoMensaje=alert-danger");
        }
        gestorBD.modificarOferta(criterio, oferta, function (resultado) {
            if (resultado == null) {
                res.send("Error al listar ofertas");
            } else {
                modificarSaldoUser({"dinero": usuario.dinero - 20}, req, res);
            }
        });
    }

    function modificarSaldoUser(dinero, req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.session.usuario._id)};
        gestorBD.modificarUsuario(criterio, dinero, function (id) {
            if (id == null) {
                res.send("Error al insertar la oferta y restar el dinero");
            } else {
                gestorBD.obtenerUsuarios(criterio, function (usuarios) {
                    if (usuarios == null || usuarios.length === 0) {
                        res.send("Error al actualizar el saldo del usuario.");
                    } else {
                        req.session.usuario = usuarios[0];
                        res.redirect("/oferta/tienda");
                    }
                });
            }
        });
    }

    function validarOferta(oferta, res) {
        if (oferta.titulo === null || oferta.titulo === undefined || oferta.titulo.length < 3) {
            res.redirect("/oferta/add?mensaje=Error en el titulo de la oferta: Formato incorrecto. &tipoMensaje=alert-danger");
            return false;
        }
        if (oferta.detalles === null || oferta.detalles === undefined || oferta.detalles.length < 3) {
            res.redirect("/oferta/add?mensaje=Error en la descripción de la oferta: Formato incorrecto. &tipoMensaje=alert-danger");
            return false;
        }
        if (oferta.fecha === null || oferta.fecha === undefined) {
            res.redirect("/oferta/add?mensaje=Error en la fecha de la oferta: Formato incorrecto. &tipoMensaje=alert-danger");
            return false;
        }
        if (oferta.precio === null || oferta.precio === undefined || oferta.precio <= 0) {
            res.redirect("/oferta/add?mensaje=Error en el precio de la oferta: Debe ser mayor que 0. &tipoMensaje=alert-danger");
            return false;
        }
        if (oferta.disponible === null || oferta.disponible === undefined || (oferta.disponible !== "Comprar" && oferta.disponible !== "Vendido")) {
            res.redirect("/oferta/add?mensaje=Error en el estado de la oferta: Debe ser mayor que 0. &tipoMensaje=alert-danger");
            return false;
        }
        return validarCorreo(oferta.usuario, res);
    }

    function validarUsuarioYOferta(usuario, idOferta, res) {
        if (idOferta === null || idOferta === undefined) {
            res.redirect("/oferta/listado?mensaje=Error en la oferta: Formato incorrecto. &tipoMensaje=alert-danger");
            return false;
        }
        return validarCorreo(usuario, res);

    }

    function validarSiPuedoComprarOferta(oferta, req, res) {
        if (oferta.disponible === "Vendido") {
            res.redirect("/oferta/tienda?mensaje=Error al comprar oferta, " +
                "ya está vendida &tipoMensaje=alert-danger");
            return false;
        }
        if (String(oferta.usuario) === String(req.session.usuario.email)) {
            res.redirect("/oferta/tienda?mensaje=Error al comprar oferta, " +
                "es tu oferta &tipoMensaje=alert-danger");
            return false;
        }
        if (oferta.precio > req.session.usuario.dinero) {
            res.redirect("/oferta/tienda?mensaje=Error al comprar oferta, " +
                "no tienes suficiente dinero. &tipoMensaje=alert-danger");
            return false;
        }
        return true;
    }

    function validarCorreo(correo, res) {
        if (correo === null || correo === undefined || correo.length < 4) {
            res.redirect("/oferta/add?mensaje=Error en el usuario: Debe tener más de 4 e incluir un signo @. &tipoMensaje=alert-danger");
            return false;
        }
        return true;
    }

    function validarMensaje(mensaje, res) {
        if (mensaje.oferta == null || typeof mensaje.oferta === 'undefined') {
            res.redirect("/oferta/mensajes?mensaje=Error en el mensaje: no se ha detectado el destino del mensaje.");
            return false;
        }
        if (mensaje.mensaje == null || typeof mensaje.mensaje === 'undefined') {
            res.redirect("/oferta/mensajes?mensaje=Error en el mensaje: no se ha detectado ningún mensaje.");
            return false;
        }
        if (mensaje.fecha == null || typeof mensaje.fecha === 'undefined') {
            res.redirect("/oferta/mensajes?mensaje=Error en la fecha del mensaje: se ha detectado un formato incorrecto.");
            return false;
        }
        if (mensaje.vendedor == null || typeof mensaje.vendedor === 'undefined') {
            res.redirect("/oferta/mensajes?mensaje=Error en el emisor del mensaje: se ha detectado un formato incorrecto.");
            return false;
        }
        if (mensaje.interesado == null || typeof mensaje.interesado === 'undefined') {
            res.redirect("/oferta/mensajes?mensaje=Error en el emisor del mensaje: se ha detectado un formato incorrecto.");
            return false;
        }
        return true;
    }
};
