module.exports = function (app, swig, gestorBD, logger) {

    //W6 Usuario registrado: Dar de alta una nueva oferta
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
                    logger.error("Añadir oferta: No se pudo insertar la nueva oferta");
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

    // W7 Usuario registrado: Listado de ofertas propias
    app.get('/oferta/listado', function (req, res) {
        let criterio = {"usuario": req.session.usuario.email};
        gestorBD.obtenerOfertas(criterio, function (lista) {
            if (lista == null) {
                logger.error("Listado ofertas: No se pudo obtener la lista de ofertas de la bbdd.");
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

    // W8 Usuario registrado: Dar de baja una oferta
    app.get("/oferta/borrar/:id", function (req, res) {
        let criterio = {$and: [{"_id": gestorBD.mongo.ObjectID(req.params.id)}, {"disponible": "Comprar"}]};
        let criterioU = {"usuario": req.session.usuario.email};
        gestorBD.obtenerOfertas({"_id": gestorBD.mongo.ObjectID(req.params.id)}, function (ofertas) {
            if (ofertas == null || ofertas.length === 0) {
                logger.error("Eliminar oferta: No se pudo obtener la oferta de la bbdd.");
                res.send("Error al obtener la oferta.");
            } else {
                if (ofertas[0].usuario !== req.session.usuario.email) {
                    res.redirect("/oferta/listado?mensaje=Error: No eres dueño de la oferta seleccionada. &tipoMensaje=alert-danger");
                } else {
                    if (validarUsuarioYOferta(req.session.usuario.email, req.params.id, res)) {
                        gestorBD.eliminarOferta(criterio, function (result) {
                            if (result === false) {
                                logger.error("Eliminar oferta: No se pudo borrar la oferta de la bbdd.");
                                res.redirect("/oferta/borrar?mensaje=Error al borrar la oferta. &tipoMensaje=alert-danger");
                            } else {
                                gestorBD.obtenerOfertas(criterioU, function (lista) {
                                    if (lista == null) {
                                        logger.error("Eliminar oferta: No se pudo obtener la lista de ofertas de la bbdd.");
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

    // W9 Usuario registrado: Buscar ofertas
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
                logger.error("Tienda: No se pudo obtener la lista de ofertas de la bbdd.");
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

    // W10 Usuario registrado: Comprar una oferta
    app.get("/oferta/comprar/:id", function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};

        gestorBD.obtenerOfertas(criterio, function (ofertas) {
            if (ofertas == null) {
                logger.error("Comprar Oferta: No se pudo obtener la lista de ofertas de la bbdd.");
                res.send("Error al comprar oferta");
            } else {
                if (validarOferta(ofertas[0], res)) {
                    comprarOferta(ofertas[0], criterio, req, res);
                }
            }
        });
    });

    // W11 Usuario registrado: Ver el listado de ofertas compradas
    app.get("/oferta/compras/", function (req, res) {
        let criterio = {"comprador": req.session.usuario.email};

        gestorBD.obtenerOfertas(criterio, function (lista) {
            if (lista == null) {
                logger.error("Ofertas Compradas: No se pudo obtener la lista de ofertas de la bbdd.");
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

    // W12 OPTATIVO: Marcar una oferta como destacada
    app.get("/oferta/destacar/:id", function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};
        gestorBD.obtenerOfertas(criterio, function (ofertas) {
            if (ofertas == null || ofertas.length === 0) {
                logger.error("Destacar oferta: No se pudo obtener la oferta de la bbdd.");
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

    // Listado total de ofertas destacadas en la aplicación
    app.get("/oferta/destacadas", function (req, res) {
        let criterio = {"destacada": "true"};

        gestorBD.obtenerOfertas(criterio, function (lista) {
            if (lista == null) {
                logger.error("Ofertas Destacadas: No se pudo obtener la lista de ofertas de la bbdd.");
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

    //Este método nos redirecciona a el listado de oferta si introducimos una URL incorrecta
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
                    logger.error("Comprar oferta: No se pudo obtener la oferta de la bbdd.");
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
                logger.error("Destacar oferta: No se pudo obtener la oferta de la bbdd.");
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
                logger.error("Modificar Saldo: No se pudo modificar el usuario de la bbdd.");
                res.send("Error al insertar la oferta y restar el dinero");
            } else {
                gestorBD.obtenerUsuarios(criterio, function (usuarios) {
                    if (usuarios == null || usuarios.length === 0) {
                        logger.error("Modificar Saldo: No se pudo obtener el usuario de la bbdd.");
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
            logger.warn("Añadir oferta: Campo fecha igual a null.");
            return false;
        }
        if (oferta.precio === null || oferta.precio === undefined || oferta.precio <= 0) {
            res.redirect("/oferta/add?mensaje=Error en el precio de la oferta: Debe ser mayor que 0. &tipoMensaje=alert-danger");
            return false;
        }
        if (oferta.disponible === null || oferta.disponible === undefined || (oferta.disponible !== "Comprar" && oferta.disponible !== "Vendido")) {
            res.redirect("/oferta/add?mensaje=Error en el estado de la oferta: Debe ser mayor que 0. &tipoMensaje=alert-danger");
            logger.warn("Añadir oferta: Campo disponible igual a null.");
            return false;
        }
        return validarCorreo(oferta.usuario, res);
    }

    function validarUsuarioYOferta(usuario, idOferta, res) {
        if (idOferta === null || idOferta === undefined) {
            logger.warn("Oferta: idOferta es null.");
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

};
