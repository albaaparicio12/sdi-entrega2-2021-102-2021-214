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
        if (oferta.precio <= 0)
            res.redirect("/oferta/add?mensaje=El precio de la oferta debe ser mayor que 0. &tipoMensaje=alert-danger");
        gestorBD.insertarOferta(oferta, function (id) {
            if (id == null) {
                res.redirect("/oferta/add?mensaje=Error al insertar la oferta &tipoMensaje=alert-danger");
            } else {
                if (oferta.destacada === "true") {
                    let criterio = {"_id": gestorBD.mongo.ObjectID(req.session.usuario._id)};
                    nuevaOfertaDestacada(criterio, req, res);
                } else {
                    res.redirect("/oferta/listado");
                }

            }
        });

    });

    app.get("/oferta/borrar/:id", function (req, res) {
        let criterio = {$and: [{"_id": gestorBD.mongo.ObjectID(req.params.id)}, {"disponible": "Comprar"}]};
        let criterioU = {"usuario": req.session.usuario.email};
        gestorBD.eliminarOferta(criterio, function (result) {
            if (result == false) {
                res.redirect("/oferta/borrar?mensaje=Error al borrar la oferta. &tipoMensaje=alert-danger");
            }
            else {
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
            criterio = {"titulo": new RegExp(req.query.busqueda,'i')};
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
                let respuesta = swig.renderFile('views/buscarOferta.html',
                    {
                        ofertas: ofertas,
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

        gestorBD.obtenerOfertas(criterio, function (lista) {
            if (lista == null) {
                res.send("Error al comprar oferta");
            } else {
                comprarOferta(lista, criterio, req, res);
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

    app.get("/oferta/destacar/:id", function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};

        gestorBD.obtenerOfertas(criterio, function (result) {
            if (result == null) {
                res.send("Error al listar ofertas");
            } else {
                if (result[0].destacada === "true") {
                    res.redirect("/oferta/listado?mensaje=Error - Ya está destacada&tipoMensaje=alert-danger");
                } else {
                    let oferta = result[0];
                    destacarOferta(oferta, criterio, req, res);
                }

            }
        })
    });

    function comprarOferta(lista, criterio, req, res) {
        if (lista[0].disponible === "Vendido") {
            res.redirect("/oferta/tienda?mensaje=Error al comprar oferta, " +
                "ya está vendida &tipoMensaje=alert-danger");
        }
        else if (String(lista[0].usuario) === String(req.session.usuario.email) ) {
            res.redirect("/oferta/tienda?mensaje=Error al comprar oferta, " +
                "es tu oferta &tipoMensaje=alert-danger");
        }else if (lista[0].precio <= req.session.usuario.dinero) {
            let oferta = {
                usuario: lista[0].usuario,
                titulo: lista[0].titulo,
                detalles: lista[0].detalles,
                fecha: lista[0].fecha,
                precio: lista[0].precio,
                disponible: "Vendido",
                comprador: req.session.usuario.email,
                destacada: lista[0].destacada
            }
            gestorBD.modificarOferta(criterio, oferta, function (result) {
                if (result == null) {
                    res.send("Error al modificar la oferta");
                } else {
                    let criterio_usuario={"_id": gestorBD.mongo.ObjectID(req.session.usuario._id)};
                    let nuevoDinero = {dinero: req.session.usuario.dinero - lista[0].precio};
                    modificarSaldoUser(criterio_usuario, nuevoDinero , req, res);
                }
            })
        } else {
            res.redirect("/oferta/tienda?mensaje=Error al comprar oferta, " +
                "no tienes suficiente dinero &tipoMensaje=alert-danger");
        }
    }

    function nuevaOfertaDestacada(criterio, req, res) {
        let usuario = req.session.usuario;
        if (usuario.dinero >= 20) {
            let dinero = {"dinero": usuario.dinero - 20};
            modificarSaldoUser(criterio, dinero, req, res);
        } else {
            res.redirect("/oferta/add&mensaje=Error - No tienes suficiente dinero!&tipoMensaje=alert-danger");
        }
    }

    function destacarOferta(oferta, criterio, req, res) {
        oferta.destacada = "true";
        gestorBD.modificarOferta(criterio, oferta, function (resultado) {
            if (resultado == null) {
                res.send("Error al listar ofertas");
            } else {
                let criterioAux = {"_id": gestorBD.mongo.ObjectID(req.session.usuario._id)}
                let usuario = req.session.usuario;
                if (usuario.dinero < 20) {
                    res.redirect("/oferta/listado?mensaje=Error - No tienes dinero suficiente!&tipoMensaje=alert-danger");
                } else {
                    modificarSaldoUser(criterioAux, {"dinero": usuario.dinero - 20}, req, res);
                }
            }
        });
    }

    function modificarSaldoUser(criterio, dinero, req, res) {
        gestorBD.modificarUsuario(criterio, dinero, function (id) {
            if (id == null) {
                res.send("Error al insertar la oferta y restar el dinero");
            } else {
                res.redirect("/oferta/tienda");
            }
        });
    }


};
