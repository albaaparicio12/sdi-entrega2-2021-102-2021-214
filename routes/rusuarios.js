module.exports = function(app, swig) {
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
            repetirPassword : req.body.repetirPassword
        }

 //       gestorBD.insertarUsuario(usuario, function(id){
 //           if(id == null){
 //               res.redirect("usuario/add?mensaje=Error al registrar al usuario");
 //           } else {
 //               res.redirect("usuarios");
 //           }
 //       })
    })
};
