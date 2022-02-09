const  Sequelize =require('sequelize');
const { Model } = require('sequelize');
const Connection =  require('../config/db');
const connect = new Connection();
const sequelize = connect.getConnectSequelize;

class Usuario extends Model{}

Usuario.init({
    id_perfil:{
        type: Sequelize.INTEGER(),
    },
    id_departamento :{
        type: Sequelize.INTEGER(),
    },
    numero:{
        type:Sequelize.STRING
    },
    nombre:{
        type:Sequelize.STRING
    },
    correo:{
        type:Sequelize.STRING
    },
    rol:{
        type:Sequelize.STRING
    },
    status:{
        type:Sequelize.STRING
    },
    fecha_inicio:{
        type:Sequelize.STRING
    },
    solicitud_actual:{
        type:Sequelize.INTEGER
    },
    path_foto:{
        type:Sequelize.STRING
    },
},
{
    sequelize,
    modelName:'usuario',
    freezeTableName:true,
    timestamps:false

});
module.exports = Usuario;