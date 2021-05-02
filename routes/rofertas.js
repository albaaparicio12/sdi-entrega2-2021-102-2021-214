module.exports = function (app, swig, gestorBD) {
    app.get("/oferta/add", function (req, res) {
        let respuesta = swig.renderFile('views/bofertaNueva.html', {});
        res.send(respuesta);
    });

    app.post('/oferta/add', function (req, res) {
        let oferta = {
            usuario: req.session.usuario,
            titulo: req.body.titulo,
            detalles: req.body.detalles,
            fecha: Date.now(),
            precio: req.body.precio
        }
        gestorBD.insertarOferta(oferta, function (id) {
            if (id == null) {
                res.redirect("/oferta/add?mensaje=Error al insertar la oferta &tipoMensaje=alert-danger");
            } else {
                res.redirect("/oferta/listado");
            }
        });

    });

    app.get("/oferta/borrar/:_id", function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};
        gestorBD.eliminarOferta(criterio, function (result) {
            if (result == null) {
                res.redirect("/oferta/borrar?mensaje=Error al borrar ofertas &tipoMensaje=alert-danger");
            } else {
                res.send("Oferta borrada");
            }
        });

    });

    app.get('/oferta/listado', function (req, res) {
        let criterio = {"usuario": req.session.usuario};
        gestorBD.obtenerOfertas(criterio, function (lista) {
            if (lista == null) {
                res.send("Error al listar ofertas");
            } else {
                let respuesta = swig.renderFile('views/listadoOfertas.html',
                    {
                        listado: lista
                    });
                res.send(respuesta);
            }
        });
    });



};
