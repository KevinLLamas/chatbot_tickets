const  Sequelize =require('sequelize');
const { Model } = require('sequelize');
const Connection =  require('../config/db');
const connect = new Connection();
const sequelize = connect.getConnectSequelize;
const Mensajes = require('./mensajes');

class Chats extends Model{}

Chats.init({
    numero:{
        type:Sequelize.STRING
    },
    usuario:{
        type:Sequelize.STRING
    },
    status:{
        type:Sequelize.STRING
    },
},
{
    sequelize,
    modelName:'chat',
    freezeTableName:true,
    timestamps:false

});

Chats.hasMany(Mensajes,  {  foreignKey: 'id_chat'});
module.exports = Chats;