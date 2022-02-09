const  Sequelize =require('sequelize');
const { Model } = require('sequelize');
const Connection =  require('../config/db');
const connect = new Connection();
const sequelize = connect.getConnectSequelize;

class Subcategorias extends Model{}

Subcategorias.init({
    id:{
        type:Sequelize.STRING,
        primaryKey: true,
    },
    id_categoria:{
        type:Sequelize.STRING
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
    modelName:'subcategoria',
    freezeTableName:true,
    timestamps:false

});
module.exports = Subcategorias;