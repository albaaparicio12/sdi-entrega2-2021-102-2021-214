module.exports = function(app, gestorBD) {

    app.get("/api/oferta", function(req, res) {
        gestorBD.obtenerOfertas( {} , function(ofertas) {
            if (ofertas == null) {
                res.status(500);
                res.json({
                    error : "se ha producido un error"
                })
            } else {
                let listaSinUser = ofertas.filter((oferta) => oferta.usuario !== req.session.usuario);
                res.status(200);
                res.send( JSON.stringify(listaSinUser) );
            }
        });
    });

    app.post("/api/mensaje/:id", function(req,res){
        let criterio = {
            "_id" : gestorBD.mongo.ObjectID(req.params.id)
        };

        gestorBD.obtenerMensajes(criterio, function(mensajes){
            if(mensajes == null){
                res.status(500);
                res.json({
                    error : "se ha producido un error"
                })
            } else {
                    gestorBD.obtenerOfertas(criterio, function(ofertas){
                        if(ofertas == null) {
                            res.status(500);
                            res.json({
                                error : "se ha producido un error"
                            })
                        } else {
                            let mensaje = {
                                interesado : req.body.usuario,
                                vendedor : ofertas[0].usuario,
                                mensaje : req.body.mensaje,
                                oferta : gestorBD.mongo.ObjectID(req.params.id),
                                leido : false
                            }
                            gestorBD.insertarMensaje(mensaje, function(id){
                                if(id == null){
                                    res.status(500);
                                    res.json({
                                        error : "se ha producido un error"
                                    })
                                } else {
                                    res.status(200);
                                    res.send( JSON.stringify(mensaje) );
                                }
                            })
                        }
                    })
            }
        })
    })

    app.get("/api/mensaje/:id", function(req,res){
        let criterio = {
            "oferta" : gestorBD.mongo.ObjectID(req.params.id),
            "interesado" : req.body.interesado
        };

        gestorBD.obtenerMensajes(criterio, function(mensajes){
            if(mensajes == null){
                res.status(500);
                res.json({
                    error : "se ha producido un error"
                })
            } else {
                res.status(200);
                res.send( JSON.stringify(mensajes) );
            }
        })
    })

    app.get("/api/mensaje/leido/:id", function(req,res){
        let criterio = {
            "_id" : gestorBD.mongo.ObjectID(req.params.id)
        };

        gestorBD.obtenerMensajes(criterio, function(mensajes){
            if(mensajes == null){
                res.status(500);
                res.json({
                    error : "se ha producido un error"
                })
            } else {
                let mensaje = mensajes[0];
                mensaje.leido = true;
                gestorBD.modificarMensaje(criterio,mensaje, function(msg){
                    if(mensajes == null){
                        res.status(500);
                        res.json({
                            error : "se ha producido un error"
                        })
                    } else {
                        res.status(200);
                        res.send( JSON.stringify(msg) );
                    }
                })
            }
        })
    })

    app.delete("/api/mensaje/:id", function(req,res){
        let criterio = {
            "oferta" : gestorBD.mongo.ObjectID(req.params.id)
        };

        gestorBD.eliminarMensaje(criterio, function(result){
            if(result == null){
                res.status(500);
                res.json({
                    error : "se ha producido un error"
                })
            } else {
                res.status(201);
                res.send( "Conversación eliminada" );
            }
        })
    })

    app.post("/api/autenticar/", function(req,res){
        let seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');
        let criterio = {
            email : req.body.email,
            password : seguro
        }

        gestorBD.obtenerUsuarios(criterio, function(usuarios){
            if (usuarios == null || usuarios.length == 0) {
                res.status(401);
                res.json({
                    autenticado: false
                })
            } else {
                let token = app.get('jwt').sign(
                    {usuario : criterio.email , tiempo : Date.now()/1000},
                    "secreto");
                res.status(200);
                res.json({
                    autenticado : true,
                    token : token
                })
            }
        });
    });
}
