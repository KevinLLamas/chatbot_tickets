const fs = require('fs');
const { Client, Location, List, Buttons } = require('./index');
const Usuario =require('./models/usuario');
const Mensajes = require('./models/mensajes');
const Solicitud = require('./models/solicitud');
const Categorias = require('./models/categorias');
const Subcategorias = require('./models/subcategorias');
const Session =require('./models/session');
const qrcode = require('qrcode-terminal');
const chalk = require('chalk');
const mimeDb = require('mime-db');
const moment = require('moment');
http = require('http');
https = require('https');
var Stream = require('stream').Transform;
//LOGIN
const SESSION_FILE_PATH = './session.json';
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionCfg = require(SESSION_FILE_PATH);
}
const client = new Client({ session: sessionCfg });
client.initialize();
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});
client.on('authenticated', (session) => {
    console.log('Autentificado');
    sessionCfg=session;
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
        if (err) {
            console.error(err);
        }
    });
});
client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessfull
    console.error('Fallo autentificacion', msg);
});
client.on('ready', () => {
    console.log('Coneccion lista');
});

client.on('message', async msg => {

    //VALIDAMOS EL CHAT
    const from = msg.from; 
    const usuario = await Usuario.findOne({ where:{numero : from.replace('@c.us', '') }});
    console.log(msg);
    //Creacion de usuario para usuarios nuevos
    if(usuario){
        Mensajes.create({ id_usuario: usuario.id, tipo: msg.type, contenido: msg.body});
    }
    if(!usuario){

        //Obtenemos información del usuario
        let nombre = await client.getContactById(from);
        let url = await client.getProfilePicUrl(from);
        let path = downloadImageFromURL(url, from.replace('@c.us', ''));

        //Creamos registros en base de datos
		let usuario = await Usuario.create({id_perfil: 1, status:'esperando_accion',  numero: from.replace('@c.us', ''), rol: 'Ciudadano', nombre:nombre.pushname, path_foto: path});
		Mensajes.create({ id_usuario: usuario.id, tipo: msg.type, contenido: msg.body});

        //Mensaje de bienvenida
        client.sendMessage(msg.from, "Hola "+nombre.pushname+" soy el Chatbot eternity 🤖.");
        let button = new Buttons("¿Que deseas hacer?",[{id:'03', body:'Crear un ticket'},{id:'04',body:'Dar seguimiento a un ticket'}],'','Selecciona solo una opción');
        client.sendMessage(msg.from, button);
    }
    else if(msg.selectedButtonId){
        
        if(msg.selectedButtonId == '01'){
            client.sendMessage(msg.from, "Favor de adjuntar la imagen de evidencia");
            Usuario.update(
                {status:  'esperando_imagenes'},
                {where: {id: usuario.id}}
            );
        }
        else if(msg.selectedButtonId == '02'){
            client.sendMessage(msg.from, "Gracias por hacer la observación, su número de ticket es: "+usuario.solicitud_actual+", si deseas levantar un nuevo ticket solo manda un mensaje.");
            Usuario.update(
                {status:  '', solicitud_actual:''},
                {where: {id: usuario.id}}
            );
        }
        else if(msg.selectedButtonId == '03' && usuario.status == 'esperando_accion'){
            Usuario.update(
                {status:  'esperando_categoria'},
                {where: {id: usuario.id}}
            );
            const categorias = await Categorias.findAll();
            res = formato(categorias);
            let list = new List('Selecciona una categoría','Opciones',[{title:'Selecciona una de las siguientes categorías',rows: res}],'Estas son mis opciones','footer');
            client.sendMessage(msg.from, list);
        }
        else if(msg.selectedButtonId == '04' && usuario.status == 'esperando_accion'){
            Usuario.update(
                {status:  'esperando_folio'},
                {where: {id: usuario.id}}
            );
            client.sendMessage(msg.from, 'Ingresa el Folio del ticket al que deseas dar seguimiento');
        }
    }
    else if(usuario.status == 'esperando_folio'){
        if(!isNaN(msg.body)){
            //aqui va validacion de folio numerico

            var solicitud = await Solicitud.findAll({where: {id_solicitud: msg.body}});
            client.sendMessage(msg.from, 'El estatus de la solicitud es: '+solicitud[0].estatus);
            client.sendMessage(msg.from, 'Si deeseas volver a interactuar conmigo solo envia un mensaje.');
            Usuario.update(
                {status:  'esperando_accion'},
                {where: {id: usuario.id}}
            );
        }
        else{
            client.sendMessage(msg.from, 'Favor de ingresar un folio valido.');
        }
    }
    else if(usuario.status == 'esperando_accion'){
        client.sendMessage(msg.from, "Favor de contestar la pregunta.");
        let button = new Buttons("¿Que deseas hacer?",[{id:'03', body:'Crear un ticket'},{id:'04',body:'Dar seguimiento a un ticket'}],'','Selecciona solo una opción');
        client.sendMessage(msg.from, button);
    }
    //Estado captura de participacion
    else if(usuario.status == '' && msg.solicitud_actual!= ''){
        Usuario.update(
            {status: 'esperando_accion'},
            {where: {id: usuario.id}}
        );
        client.sendMessage(msg.from, "Hola de nuevo, soy el Chatbot eternity.");
        let button = new Buttons("¿Que deseas hacer?",[{id:'03', body:'Crear un ticket'},{id:'04',body:'Dar seguimiento a un ticket'}],'','Selecciona solo una opción');
        client.sendMessage(msg.from, button);
    }
    //Estado captura de participacion
    else if(usuario.status == 'esperando_categoria' && msg.type != 'list_response'){
        client.sendMessage(msg.from, "Favor de seleccionar una categoría.");
        const categorias = await Categorias.findAll();
        res = formato(categorias);
        let list = new List('Selecciona una categoría','Opciones',[{title:'Selecciona una de las siguientes categorías',rows: res}],'Estas son mis opciones','footer');
        client.sendMessage(msg.from, list);
    }
	else if(usuario.status == 'esperando_subcategoria' && msg.type != 'list_response'){
        client.sendMessage(msg.from, "Favor de seleccionar una subcategoría.");
        var solicitud = await Solicitud.findAll({where: {id_usuario: usuario.id}});
        subcategorias = await Subcategorias.findAll({where: {id_categoria: solicitud.id_categoria}});
        res = formato(subcategorias);
        let list = new List('Selecciona una subcategoría','Opciones',[{title:'Selecciona una de las siguientes subcategorías',rows: res}],'Estas son mis opciones','footer');
        client.sendMessage(msg.from, list);
    }
    //Captura de todos los botones
    else if(msg.type == 'list_response'){
        if(msg.selectedRowId[0] == 'c'){
            let id_cat = msg.selectedRowId.replace("c", "");
            let sol = await Solicitud.create({ id_usuario: usuario.id, id_perfil:usuario.id_perfil, status: 'alta', medio_reporte: 'ChatBot', id_categoria: id_cat}); 
            var solicitud = await Solicitud.findAll({where: {id_usuario: usuario.id}});
            Usuario.update(
                {status: 'esperando_subcategoria',solicitud_actual : solicitud[solicitud.length-1].id_solicitud},
                {where: {id: usuario.id}}
            );
            subcategorias = await Subcategorias.findAll({where: {id_categoria: id_cat}});
            res = formato(subcategorias);
            let list = new List('Selecciona una subcategoría','Opciones',[{title:'Selecciona una de las siguientes subcategorías',rows: res}],'Estas son mis opciones','footer');
            client.sendMessage(msg.from, list);
        }
        else if(msg.selectedRowId[0] == 's'){
			//PARTICIPO
            let id_subcat = msg.selectedRowId.replace("s", "");
        	client.sendMessage(msg.from, 'Gracias, ¿podrias adjuntar una breve descripción del problema?');
            Solicitud.update(
                {id_subcategoria: id_subcat},
                {where: {id_solicitud: usuario.solicitud_actual}}
            );
            Usuario.update(
                {status: 'esperando_descripcion'},
                {where: {id: usuario.id}}
            );
            
            
            
        }
    }
    //Captura pregunta adjunto
    else if(usuario.status =="esperando_descripcion"&& !msg.selectedButtonId)
    {
        //Guardar respuesta
		client.sendMessage(msg.from, 'Gracias, Favor de enviar la ubicación del suceso (En el formato de WhatsApp)');
        Solicitud.update(
            {descripcion:  msg.body},
            {where: {id_solicitud: usuario.solicitud_actual}}
        );
        Usuario.update({status: 'esperando_ubicacion'},{where: {id: usuario.id}});
    }
    //Captura ubicacion
    else if(usuario.status =="esperando_ubicacion"){
        if(msg.type == 'location'){
            console.log(msg.location.latitude);
            var solicitud = await Solicitud.findAll({where: {id_usuario: usuario.id}});
            Solicitud.update(
                {latitud: msg.location.latitude,
                longitud: msg.location.longitude},
                {where: {id_solicitud: usuario.solicitud_actual}}
            );
            Usuario.update({status: 'esperando_desea_adjuntar'},{where: {id: usuario.id}});
			let button = new Buttons("Gracias, ¿Deseas adjuntar una foto de evidencia?",[{id:'01', body:'Sí'},{id:'02',body:'No'}],'','Selecciona solo una opción');
            client.sendMessage(msg.from, button);
        }else{
            client.sendMessage(msg.from, "Por favor adjunta una ubicacion en formato de WhatsApp valida");
        }
    } 
    //Captura de todos los botones
    
    else if (usuario.status =="esperando_desea_adjuntar") {
        client.sendMessage(msg.from, "Favor de contestar la pregunta");
        let button = new Buttons("Gracias, ¿Deseas adjuntar una foto de evodencia?",[{id:'01', body:'Sí'},{id:'02',body:'No'}],'','Selecciona solo una opción');
        client.sendMessage(msg.from, button);
    }
    else if (usuario.status =="esperando_imagenes") {
        if(msg.hasMedia){
            //Guardar en servidor
			const media = await msg.downloadMedia();
			saveMedia(media,usuario, '');
			//PASOS PARA GUARDAR
			client.sendMessage(msg.from, "Gracias por hacer la observación, su número de ticket es: "+usuario.solicitud_actual+", si deseas levantar un nuevo ticket solo manda un mensaje.");
            Usuario.update(
                {status:  '', solicitud_actual:''},
                {where: {id: usuario.id}}
            );
            
        }else{
            client.sendMessage(msg.from, "Muchas gracias, favor de adjuntar la imagen de evidencia.");
        }
    }
    
});
//Guardamos archivos multimedia que nuestro cliente nos envie!
const saveMedia = async (media, usuario, tipo) => {
    const extensionProcess = mimeDb[media.mimetype];
    const ext = extensionProcess.extensions[0];
    let dir = `./storage/chats/${usuario.numero}`;
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    let path = `${dir}/${moment().format('MM-DD-YY H-MI-SS')}.${ext}`;
    fs.writeFile(path, media.data, { encoding: 'base64' }, function (err) {
        console.log('Archivo Media Guardado');
    });
	Solicitud.update(
		{path_evidencia:  path},
		{where: {id_solicitud: usuario.solicitud_actual}}
	);
}
const formato =  (sections) =>{
    var res= [];
    for(c=0;c<sections.length;c++){
        res.push({'id':String(sections[c].clave),'title': String(sections[c].nombre)});
    }
    return res;
}
const downloadImageFromURL = (url, usuario, callback) => {
    let path = 'storage/profile/'+usuario+'.png';
    var client = http;
    if (url.toString().indexOf("https") === 0) {
        client = https;
    }
    client.request(url, function(response) {
        var data = new Stream();
        response.on('data', function(chunk) {
            data.push(chunk);
        });
        response.on('end', function() {

            fs.writeFileSync(path, data.read());
        });
        
    }).end();
    return path;
};