module.exports = function(app, gestorBD) {

    app.get("/api/oferta", function(req, res) {
        gestorBD.obtenerOfertas( {} , function(ofertas) {
            if (ofertas == null) {
                res.status(500);
                res.json({
                    error : "se ha producido un error"
                })
            } else {
                let listaSinUser = ofertas.filter((oferta) => oferta.usuario !== gestorBD.mongo.ObjectID(req.session.usuario.id));
                res.status(200);
                res.send( JSON.stringify(listaSinUser) );
            }
        });
    });

    app.get("/api/mensaje/:id", function(req,res){
        let criterio = {
            "_id" : gestorBD.mongo.ObjectID(req.params.id),
            idInteresado : req.session.usuario.id
        };

        gestorBD.obtenerMensajes(criterio, function(mensajes){
            if(mensajes == null){

            } else {
                if(mensajes.length == 0){

                } else {

                }
            }
        })
    })

    app.post("/api/autenticar", function(req,res){
        let seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');
        let criterio = {
            email : req.body.email,
            password : seguro
        }

        gestorBD.obtenerUsuarios(criterio, function(usuarios){
            if (usuarios == null) {
                res.status(401);
                res.json({
                    autenticado: false
                })
            } else if (usuarios.length == 0) {
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
