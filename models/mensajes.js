const  Sequelize =require('sequelize');
const { Model } = require('sequelize');
const Connection =  require('../config/db');
const connect = new Connection();
const sequelize = connect.getConnectSequelize;

class Mensajes extends Model{}

Mensajes.init({
    id_usuario:{
        type: Sequelize.INTEGER(),
        
    },
    tipo:{
        type:Sequelize.STRING
    },
    contenido:{
        type:Sequelize.STRING
    }

},
{
    sequelize,
    modelName:'mensajes',
    freezeTableName:true,
    timestamps:false

});
module.exports = Mensajes;