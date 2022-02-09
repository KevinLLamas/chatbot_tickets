const  Sequelize =require('sequelize');
const { Model } = require('sequelize');
const Connection =  require('../config/db');
const connect = new Connection();
const sequelize = connect.getConnectSequelize;

class Categorias extends Model{}

Categorias.init({
    id:{
        type:Sequelize.STRING,
        primaryKey: true,
    },
    nombre:{
        type:Sequelize.STRING
    },
    clave:{
        type:Sequelize.STRING
    },
},
{
    sequelize,
    modelName:'categoria',
    freezeTableName:true,
    timestamps:false

});
module.exports = Categorias;