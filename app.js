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
		let chat = await Chats.create({  numero: from.replace('@c.us', ''),usuario: from, status: 'esperando_participo'});
		Mensajes.create({ id_chat: chat.id, tipo: msg.type, autor: 'usuario', contenido: msg.body});
        //Caso Imagen inicial
        if(msg.hasMedia){
            let mensaje = await Participacion.findAll({where: {id_chat: chat.id, tipo: 'propio'}});
            console.log(mensaje);
            if(mensaje.length == 0 ){
                const media = await msg.downloadMedia();
                let id = await saveMedia(media,chat,'propio');
                client.sendMessage(msg.from, "La imagen ha sido guardada como su participación.");
            }else{
                client.sendMessage(msg.from, "Lo sentimos, ya cuentas con una participacion propia, si deseas adjuntar más participaciones tendras que ingresar tu nombre completo primero.");
            }
        }
        let mensaje = await Participacion.findAll({where: {id_chat: chat.id, tipo: 'propio'}});
        let button;
        if(mensaje.length == 0){
            button = new Buttons('¿Usted o algún invitado participó en el Pacto Fiscal?',[{id:'01', body:'Yo participé'},{id:'02',body:'Participó un invitado'},{id:'03',body:'No'}],'','Selecciona solo una opcion');
        }
        else{
            button = new Buttons('¿Usted o algún invitado participó en el Pacto Fiscal?',[{id:'02',body:'Participó un invitado'},{id:'03',body:'No'}],'','Selecciona solo una opcion');
        }
        client.sendMessage(msg.from, button);
    }
    else if(chat && msg.type =="chat" && msg.body == "Reiniciar")
    {
        client.sendMessage(msg.from, "Se ha reiniciado la interacción.");
        Chats.update(
            {nombre:  msg.body, status: 'esperando_participo'},
            {where: {id: chat.id}}
        );
    }
    //Estado captura de participacion
    else if(chat.status == 'esperando_participo' && !msg.selectedButtonId){
        client.sendMessage(msg.from, "Favor de contestar la pregunta.");
        let mensaje = await Participacion.findAll({where: {id_chat: chat.id, tipo: 'propio'}});
        let button;
        if(mensaje.length == 0){
            button = new Buttons('¿Usted o algún invitado participó en el Pacto Fiscal?',[{id:'01', body:'Yo participé'},{id:'02',body:'Participó un invitado'},{id:'03',body:'No'}],'','Selecciona solo una opcion');
        }
        else{
            button = new Buttons('¿Usted o algún invitado participó en el Pacto Fiscal?',[{id:'02',body:'Participó un invitado'},{id:'03',body:'No'}],'','Selecciona solo una opcion');
        }
        client.sendMessage(msg.from, button);
    }
	
    //Captura de todos los botones
    else if(msg.selectedButtonId){
        if(msg.selectedButtonId == '01'){
			//PARTICIPO
			let button = new Buttons('¿Gracias por tu participación. ¿Le gustaría adjuntar alguna evidencia?',[{id:'04', body:'Sí'},{id:'05',body:'No'}],'','Selecciona solo una opción');
        	client.sendMessage(msg.from, button);
            Chats.update(
                {participo:  'Sí',status: 'esperando_adjuntar'},
                {where: {id: chat.id}}
            );
			Participacion.create({
				id_chat: chat.id,
				img: '',
				tipo: 'propio'
			});
        }
        if(msg.selectedButtonId == '02'){
			//participó EXTERNO
            client.sendMessage(msg.from, "Favor de ingresar el número celular del invitado.");
			Chats.update(
                {status:  'esperando_numero'},
                {where: {id: chat.id}}
            );
            //Guardo no participo
			Participacion.create({
				id_chat: chat.id,
				img: '',
				tipo: 'externo'
			});
        }
        if(msg.selectedButtonId == '03'){
			//NO
            client.sendMessage(msg.from, "Muchas gracias, lo invitamos a participar en este evento histórico.");
            Chats.update(
                {participo:  'Sí',status: 'limbo'},
                {where: {id: chat.id}}
            );
        }
		if(msg.selectedButtonId == '04'){
			//DESEA ADJUNTAR EVIDENCIA
            console.log("object");
            client.sendMessage(msg.from, "Muchas gracias, favor de adjuntar la imagen de evidencia.");
            Chats.update(
                {status: 'esperando_imagenes'},
                {where: {id: chat.id}}
            );
        }
		if(msg.selectedButtonId == '05'){
			//NO EVIDENCIA
            client.sendMessage(msg.from, "Te agradecemos tu participación, en este evento histórico “Pacto Fiscal”, si deseas volver a interactuar solo envía un mensaje.");
            Chats.update(
                {status: 'esperando_participo'},
                {where: {id: chat.id}}
            );
        }
        if(msg.selectedButtonId == '06'){
			//PROPORCIONAR CELULAR
			let button = new Buttons('¿Gracias por tu participación. ¿Le gustaría adjuntar alguna evidencia?',[{id:'06', body:'Sí'},{id:'05',body:'No'}],'','Selecciona solo una opción');
        	client.sendMessage(msg.from, button);
            Chats.update(
                {participo:  'Sí',status: 'esperando_adjuntar_externo'},
                {where: {id: chat.id}}
            );
        }
        if(msg.selectedButtonId == '07'){
			//PROPORCIONAR CELULAR
            let mensaje = await Participacion.findAll({where: {id_chat: chat.id, tipo: 'propio'}});
            let button;
            if(mensaje.length == 0){
                button = new Buttons('¿Usted o algún invitado participó en el Pacto Fiscal?',[{id:'01', body:'Yo Participé'},{id:'02',body:'Participó un invitado'},{id:'03',body:'No'}],'','Selecciona solo una opcion');
            }
            else{
                button = new Buttons('¿Usted o algún invitado participó en el Pacto Fiscal?',[{id:'02',body:'Participó un invitado'},{id:'03',body:'No'}],'','Selecciona solo una opcion');
            }
			client.sendMessage(msg.from, button);
            Chats.update(
                {status: 'esperando_participo'},
                {where: {id: chat.id}}
            );
        }
        if(msg.selectedButtonId == '08'){
			//PROPORCIONAR CELULAR
			client.sendMessage(msg.from, "Te agradecemos tu participación, si deseas volver a interactuar solo envía un mensaje.");
            Chats.update(
                {status: 'limbo'},
                {where: {id: chat.id}}
            );
        }
    }
    //Captura pregunta adjunto
    else if(chat.status =="esperando_adjtuntar" && !msg.selectedButtonId)
    {
		let button = new Buttons('¿Gracias por tu participación. ¿Le gustaría adjuntar alguna evidencia?',[{id:'04', body:'Sí'},{id:'05',body:'No'}],'','Selecciona solo una opción');
		client.sendMessage(msg.from, button);
    }
    //Captura pregunta externo
	else if(chat.status =="esperando_adjtuntar_externo" && !msg.selectedButtonId)
    {
        console.log("entre aqui");
		client.sendMessage(msg.from, "Favor de contestar la pregunta.");
		let button = new Buttons('¿Gracias por tu participación. ¿Le gustaría adjuntar alguna evidencia?',[{id:'04', body:'Sí'},{id:'05',body:'No'}],'','Selecciona solo una opción');
		client.sendMessage(msg.from, button);
    }
    //Captura del numero externo
    else if(chat.status =="esperando_numero"){
        if(msg.type == 'chat'){
            if(msg.body.length == 10){
                let mensaje = await Participacion.findAll({where: {id_chat: chat.id, tipo: 'externo'}});
                console.log(mensaje);
                //Guardar número (Logica de el ultimo msg que sea media)
                Participacion.update(
                    {numero:  msg.body},
                    {where: {id: mensaje[mensaje.length-1].id}}
                );
                let button = new Buttons('¿Gracias por tu participación. ¿Le gustaría adjuntar alguna evidencia?',[{id:'04', body:'Sí'},{id:'05',body:'No'}],'','Selecciona solo una opción');
		        client.sendMessage(msg.from, button);
            }
            else{
                client.sendMessage(msg.from, "Favor de adjuntar un número teléfonico en 10 dígitos");
            }
        }else{
            client.sendMessage(msg.from, "Favor de ingresar el número de la persona en formato texto.");
        }
    }
    //Estado captura de imagenes
    else if (chat.status =="esperando_imagenes") {
        if(msg.hasMedia){
            //Guardar en servidor
			const media = await msg.downloadMedia();
			saveMedia(media,chat, '');
			//PASOS PARA GUARDAR
			client.sendMessage(msg.from, "Te agradecemos tu participación, en este evento histórico “Pacto Fiscal”.");
			let button = new Buttons('¿Desea agregar alguna otra participación?',[{id:'07', body:'Sí'},{id:'08',body:'No'}],'','Selecciona solo una opción');
            client.sendMessage(msg.from, button);
            Chats.update(
                {status:  'esperando_otra_particion'},
                {where: {id: chat.id}}
            );
            
        }else{
            client.sendMessage(msg.from, "Muchas gracias, favor de adjuntar la imagen de evidencia.");
        }
    }
    else if (chat.status =="limbo") {
        let mensaje = await Participacion.findAll({where: {id_chat: chat.id, tipo: 'propio'}});
        let button;
        if(mensaje.length == 0){
            button = new Buttons('¿Usted o algún invitado participó en el Pacto Fiscal?',[{id:'01', body:'Yo participé'},{id:'02',body:'Participó un invitado'},{id:'03',body:'No'}],'','Selecciona solo una opcion');
        }
        else{
            button = new Buttons('¿Usted o algún invitado participó en el Pacto Fiscal?',[{id:'02',body:'Participó un invitado'},{id:'03',body:'No'}],'','Selecciona solo una opcion');
        }
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