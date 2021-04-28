//Módulos
let express = require('express');
let app = express();

app.get('/usuarios', function(req,res){
    console.log("depurar aqui");
    res.send('ver usuarios');
});

app.listen(8081, function() {
    console.log('Servidor activo');
});