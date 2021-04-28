module.exports = function(app, swig, gestorBD) {
    app.get("/usuario/add", function(req, res) {
        let respuesta = swig.renderFile('views/bregistro.html',{});
        res.send(respuesta);
    });

    app.post('/usuario/add', function(req, res) {
        let seguro = app.get('crypto').createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');
        let usuario = {
            nombre : req.body.nombre,
            apellidos : req.body.apellidos,
            email : req.body.email,
            repetirPassword : req.body.repetirPassword,
            dinero : 100,
            rol : "estandar"
        }
        if(req.body.password != req.body.repetirPassword){
            res.redirect("add?mensaje=Error con las passwords, no coinciden")
        } else{
                   gestorBD.insertarUsuario(usuario, function(id){
                       if(id == null){
                           res.redirect("usuario/add?mensaje=Error al registrar al usuario");
                       } else {
                           res.send(swig.renderFile('views/opciones.html'));
                       }
                   })
        }
    })

    app.get("/identificarse", function(req, res) {
        let respuesta = swig.renderFile('views/bidentificacion.html');
        res.send(respuesta);
    });

    app.post("/identificarse", function(req, res) {
        let seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');
        let criterio = {
            email : req.body.email,
            password : seguro
        }
        gestorBD.obtenerUsuarios(criterio, function(usuarios) {
            if (usuarios == null || usuarios.length == 0) {
                req.session.usuario = null;
                res.send("No identificado: ");
            } else {
                req.session.usuario = usuarios[0].email;
                if(req.session.usuario == "admin@email.com"){
                    res.send(swig.renderFile('views/opcionesAdmin.html'))
                } else {
                    res.send(swig.renderFile('views/opciones.html'));
                }
            }
        });
    });

    app.get('/desconectarse', function (req, res) {
        req.session.usuario = null;
        res.send('views/bregistro.html');
    })

    app.get('/usuario/listado', function (req, res){
        let criterio = {};
        gestorBD.obtenerUsuarios(criterio, function(lista){
            if(lista == null){
                res.send("Error al listar");
            } else {
                let respuesta = swig.renderFile('views/listado.html',
                    {
                        listado : lista
                    });
                res.send(respuesta);
            }
        });
    });
};
