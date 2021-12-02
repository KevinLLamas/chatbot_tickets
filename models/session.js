const  Sequelize =require('sequelize');
const { Model } = require('sequelize');
const Connection =  require('../config/db');
const connect = new Connection();
const sequelize = connect.getConnectSequelize;

class Session extends Model{}

Session.init({

    token:{
        type:Sequelize.STRING
    },
    fecha:{
        type:Sequelize.TIME
    }

},
{
    sequelize,
    modelName:'sesion',
    freezeTableName:true,
    timestamps:false

});

module.exports = Session;