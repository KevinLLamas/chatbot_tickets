const fs = require('fs');
const { Client, Location, List, Buttons } = require('./index');
const Chats =require('./models/chats');
const Mensajes = require('./models/mensajes');
const Participacion = require('./models/participaciones');
const Session =require('./models/session');
const qrcode = require('qrcode-terminal');
const chalk = require('chalk');
const mimeDb = require('mime-db');
const moment = require('moment');
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
    const chat = await Chats.findOne({ where:{numero : from.replace('@c.us', '') }});
    console.log(msg);
    //Creacion de chat para usuarios nuevos
    if(chat){
        Mensajes.create({ id_chat: chat.id, tipo: msg.type, autor: 'usuario', contenido: msg.body});
    }
    if(!chat){
		let chat = await Chats.create({  numero: from.replace('@c.us', ''),usuario: from, status: 'esperando_categoria'});
		Mensajes.create({ id_chat: chat.id, tipo: msg.type, autor: 'usuario', contenido: msg.body});
        //Caso Imagen inicial
        client.sendMessage(msg.from, "Hola, soy el chatbot eternity.");
        let sections = [{title:'Selecciona una de las siguientes categorías',rows:[{id: '01', title:'Reportar un robo', description: 'Reporar un bache'},{id: '05',title:'Pedir informacíon'}]}];
        let list = new List('Selecciona una categoría','Opciones',sections,'Estas son mis opciones','footer');
        client.sendMessage(msg.from, list);
    }
    else if(chat && msg.type =="chat" && msg.body == "Reiniciar")
    {
        client.sendMessage(msg.from, "Se ha reiniciado la interacción.");
        Chats.update(
            {nombre:  msg.body, status: 'esperando_categoria'},
            {where: {id: chat.id}}
        );
    }
    //Estado captura de participacion
    else if(chat.status == 'esperando_categoria' && !msg.mentionedJidList){
        client.sendMessage(msg.from, "Favor de seleccionar una categoría.");
        let sections = [{title:'Selecciona una de las siguientes categorías',rows:[{id: '01', title:'Reportar un robo', description: 'Reporar un bache'},{id: '05',title:'Pedir informacíon'}]}];
        let list = new List('Selecciona una categoría','Opciones',sections,'Estas son mis opciones','footer');
        client.sendMessage(msg.from, button);
    }
	
    //Captura de todos los botones
    else if(msg.mentionedJidList){
        if(msg.mentionedJidList == '01'){
			//PARTICIPO
        	client.sendMessage(msg.from, 'Gracias, ¿podrias adjuntar una breve descripción del problema?');
            Chats.update(
                {status: 'esperando_descripcion'},
                {where: {id: chat.id}}
            );
        }
    }
    //Captura pregunta adjunto
    else if(chat.status =="esperando_descripcion"&& !msg.selectedButtonId)
    {
        //Guardar respuesta
		client.sendMessage(msg.from, 'Gracias, Favor de enviar la ubicación del suceso (En el formato de WhatsApp)');
        Chats.update(
            {status: 'esperando_ubicacion'},
            {where: {id: chat.id}}
        );
    }
    //Captura ubicacion
    else if(chat.status =="esperando_ubicacion"){
        if(msg.type == 'location'){
            console.log(msg.location.latitude);
            Chats.update(
                {latitud: msg.location.latitude,
                longitud: msg.location.longitude,
                status:  ''},
                {where: {id: chat.id}}
            );
            client.sendMessage(msg.from, "Gracias por hacer la observación, su número de ticket es: ... , si deseas levantar un nuevo ticket solo manda un mensaje.");
        }else{
            client.sendMessage(msg.from, "Por favor adjunta una ubicacion en formato de WhatsApp valida");
        }
    } 
    //Captura pregunta externo
	else if(chat.status =="esperando_adjtuntar_externo" && !msg.selectedButtonId)
    {
        console.log("entre aqui");
		client.sendMessage(msg.from, "Favor de contestar la pregunta.");
		let button = new Buttons('¿Gracias por tu participación. ¿Le gustaría adjuntar alguna evidencia?',[{id:'04', body:'Sí'},{id:'05',body:'No'}],'','Selecciona solo una opción');
		client.sendMessage(msg.from, button);
    }
    
    
});
//Guardamos archivos multimedia que nuestro cliente nos envie!
const saveMedia = async (media, chat, tipo) => {
    const extensionProcess = mimeDb[media.mimetype];
    const ext = extensionProcess.extensions[0];
    let dir = `./storage/${chat.numero}`;
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    let path = `${dir}/${moment().format('MM-DD-YY H-MI-SS')}.${ext}`;
    fs.writeFile(path, media.data, { encoding: 'base64' }, function (err) {
        console.log('Archivo Media Guardado');
    });
	var mensaje = await Participacion.findAll({where: {id_chat: chat.id}});
	Participacion.update(
		{img:  path},
		{where: {id: mensaje[mensaje.length-1].id}}
	);
}