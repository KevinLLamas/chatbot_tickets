const  Sequelize =require('sequelize');
const { Model } = require('sequelize');
const Connection =  require('../config/db');
const connect = new Connection();
const sequelize = connect.getConnectSequelize;

class Solicitud extends Model{}

Solicitud.init({
    id_solicitud:{
        primaryKey: true,
        type: Sequelize.INTEGER(),
    },
    id_usuario:{
        type: Sequelize.INTEGER(),
    },
    id_categoria:{
        type: Sequelize.INTEGER(),
    },
    id_subcategoria:{
        type: Sequelize.INTEGER(),
    },
    id_perfil:{
        type: Sequelize.INTEGER(),
    },
    correo_atencion:{
        type:Sequelize.STRING
    },
    fecha_creacion:{
        type:Sequelize.STRING
    },
    descripcion:{
        type:Sequelize.STRING
    },
    estatus:{
        type:Sequelize.STRING
    },
    medio_reporte:{
        type:Sequelize.STRING
    },
    necesita_respuesta:{
        type:Sequelize.STRING
    },
    fecha_finalizado:{
        type:Sequelize.STRING
    },
    latitud:{
        type:Sequelize.STRING
    },
    longitud:{
        type:Sequelize.STRING
    },
},
{
    sequelize,
    modelName:'solicitud',
    freezeTableName:true,
    timestamps:false

});
module.exports = Solicitud;