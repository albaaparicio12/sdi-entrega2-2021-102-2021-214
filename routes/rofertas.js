module.exports = function (app, swig, gestorBD) {
    app.get("/oferta/add", function (req, res) {
        let respuesta = swig.renderFile('views/bofertaNueva.html', {
            login : "desconectarse",
            usuario : req.session.usuario
        });
        res.send(respuesta);
    });

    app.post('/oferta/add', function (req, res) {
        let oferta = {
            usuario: req.session.usuario.id,
            titulo: req.body.titulo,
            detalles: req.body.detalles,
            fecha: Date.now(),
            precio: req.body.precio,
            disponible: "Comprar",
            comprador: null,
            destacada: req.body.boxDestacada
        }
        gestorBD.insertarOferta(oferta, function (id) {
            if (id == null) {
                res.redirect("/oferta/add?mensaje=Error al insertar la oferta &tipoMensaje=alert-danger");
            } else {
                let criterioAux = {"_id": gestorBD.mongo.ObjectID(req.session.usuario.id)};
                let usuario = req.session.usuario;
                if(oferta.destacada == "true"){
                    if(usuario.dinero >= 20){
                        usuario.dinero = usuario.dinero-20;
                        gestorBD.modificarUsuario(criterioAux,usuario,function(id){
                            if(id == null){
                                res.send("Error al insertar la oferta y restar el dinero");
                            } else {
                                res.redirect("/oferta/listado");
                            }
                        })
                    } else {
                        res.redirect("/oferta/listado&mensaje=Error - No tienes suficiente dinero!&tipoMensaje=alert-danger");
                    }
                } else {
                    res.redirect("/oferta/listado");
                }

            }
        });

    });

    app.get("/oferta/borrar/:id", function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};
        let criterioU = {"usuario": req.session.usuario.id};
        gestorBD.eliminarOferta(criterio, function (result) {
            if (result == null) {
                res.redirect("/oferta/borrar?mensaje=Error al borrar ofertas &tipoMensaje=alert-danger");
            } else {
                gestorBD.obtenerOfertas(criterioU, function (lista) {
                    if (lista == null) {
                        res.send("Error al listar ofertas");
                    } else {
                        let respuesta = swig.renderFile('views/listadoOfertas.html',
                            {
                                listado: lista,
                                login : "desconectarse",
                                usuario : req.session.usuario
                            });
                        res.send(respuesta);
                    }
                });
            }
        });

    });

    app.get('/oferta/listado', function (req, res) {
        let criterio = {"usuario": req.session.usuario.id};
        gestorBD.obtenerOfertas(criterio, function (lista) {
            if (lista == null) {
                res.send("Error al listar ofertas");
            } else {
                let respuesta = swig.renderFile('views/listadoOfertas.html',
                    {
                        listado: lista,
                        login : "desconectarse",
                        usuario : req.session.usuario
                    });
                res.send(respuesta);
            }
        });
    });

    app.get("/oferta/destacadas", function(req,res){
        let criterio = {"destacada": "true"};

        gestorBD.obtenerOfertas(criterio, function (lista) {
            if (lista == null) {
                res.send("Error al listar ofertas");
            } else {
                let respuesta = swig.renderFile('views/listadoDestacadas.html',
                    {
                        listado: lista,
                        login : "desconectarse",
                        usuario : req.session.usuario
                    });
                res.send(respuesta);
            }
        });
    })

    app.get("/oferta/tienda", function(req, res) {
        let criterio = {};
        if( req.query.busqueda != null ){
            criterio = { "titulo" :  {$regex : ".*"+req.query.busqueda+".*"}};
        }

        let pg = parseInt(req.query.pg);
        if(req.query.pg == null){
            pg = 1;
        }

        gestorBD.obtenerOfertasPg(criterio, pg , function(ofertas, total ) {
            if (ofertas == null) {
                res.send("Error al listar ");
            } else {
                let ultimaPg = total/5;
                if (total % 5 > 0 ){ // Sobran decimales
                    ultimaPg = ultimaPg+1;
                }
                let paginas = []; // paginas mostrar
                for(let i = pg-2 ; i <= pg+2 ; i++){
                    if ( i > 0 && i <= ultimaPg){
                        paginas.push(i);
                    }
                }
                let respuesta = swig.renderFile('views/buscarOferta.html',
                    {
                        ofertas : ofertas,
                        paginas : paginas,
                        actual : pg,
                        usuario : req.session.usuario,
                        login : "desconectarse"
                    });
                res.send(respuesta);
            }
        });
    });

    app.get("/oferta/:id", function(req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};

        gestorBD.obtenerOfertas(criterio, function(lista){
            if (lista == null) {
                res.send("Error al comprar oferta");
            } else {
                if(lista[0].disponible === "Vendido"){
                    res.redirect("/oferta/tienda?mensaje=Error al comprar oferta, " +
                        "ya está vendida &tipoMensaje=alert-danger");
                }
//                else if(lista[0].usuario == req.session.usuario.id){
//                    res.redirect("/oferta/tienda?mensaje=Error al comprar oferta, " +
//                        "es tu oferta &tipoMensaje=alert-danger");
//                }
                else if(lista[0].precio <= req.session.usuario.dinero){
                    req.session.usuario.dinero = req.session.usuario.dinero - lista[0].precio;
                    let oferta = {
                        usuario: lista[0].usuario,
                        titulo: lista[0].titulo,
                        detalles: lista[0].detalles,
                        fecha: lista[0].fecha,
                        precio: lista[0].precio,
                        disponible: "Vendido",
                        comprador: gestorBD.mongo.ObjectID(req.session.usuario._id),
                        detacada: lista[0].destacada
                    }
                    gestorBD.modificarOferta(criterio, oferta, function(result){
                        if(result == null){
                            res.send("Error al modificar la oferta");
                        } else {
                            res.redirect("/oferta/tienda");
                        }
                    })
                } else {
                    res.redirect("/oferta/tienda?mensaje=Error al comprar oferta, " +
                        "no tienes suficiente dinero &tipoMensaje=alert-danger");
                }
            }
        });
    });

    app.get("/oferta/compras/:id", function(req,res){
        let criterio = {"comprador": gestorBD.mongo.ObjectID(req.params.id)};

        gestorBD.obtenerOfertas(criterio, function (lista) {
            if (lista == null) {
                res.send("Error al listar ofertas");
            } else {
                let respuesta = swig.renderFile('views/listadoCompras.html',
                    {
                        listado: lista,
                        login : "desconectarse",
                        usuario : req.session.usuario
                    });
                res.send(respuesta);
            }
        });
    })

    app.get("/oferta/destacar/:id", function(req, res){
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};

        gestorBD.obtenerOfertas(criterio, function(result){
            if(result == null){
                res.send("Error al listar ofertas");
            } else {
                if(result[0].destacada == "true"){
                    res.redirect("/oferta/listado?mensaje=Error - Ya está destacada&tipoMensaje=alert-danger");
                } else{
                    let oferta = result[0];
                    oferta.destacada = "true";
                    gestorBD.modificarOferta(criterio,oferta, function (resu) {
                        if (resu == null) {
                            res.send("Error al listar ofertas2");
                        } else {
                            let criterioAux = {"_id" : req.session.usuario.id}
                            let usuario = req.session.usuario;
                            if(usuario.dinero < 20){
                                res.redirect("/oferta/listado?mensaje=Error - No tienes dinero suficiente!&tipoMensaje=alert-danger");
                            } else {
                                usuario.dinero = usuario.dinero - 20;
                                gestorBD.modificarUsuario(criterioAux,usuario,function(id){
                                    if(id == null){
                                        res.send("Error al insertar la oferta y restar el dinero");
                                    } else {
                                        res.redirect("/oferta/listado");
                                    }
                                })
                            }

                        }
                    });
                }

            }
        })
    })

};