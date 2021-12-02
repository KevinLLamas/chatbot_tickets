const  Sequelize =require('sequelize');
const { Model } = require('sequelize');
const Connection =  require('../config/db');
const connect = new Connection();
const sequelize = connect.getConnectSequelize;

class Participacion extends Model{}

Participacion.init({
    id_chat:{
        type: Sequelize.INTEGER(),
        
    },
    tipo:{
        type:Sequelize.STRING
    },
    img:{
        type:Sequelize.STRING
    },
    numero:{
        type:Sequelize.STRING
    },
},
{
    sequelize,
    modelName:'participaciones',
    freezeTableName:true,
    timestamps:false

});
module.exports = Participacion;