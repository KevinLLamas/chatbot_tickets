const sequelize = require('sequelize');
const mysql = require('mysql2');
const path = require('path');
let env = require('dotenv').config(path.join(__dirname,'.env'));
class Connection {
    //Propiedades privadas
    #database;
    #user;
    #password;
    #host;
    #port;
    cnx;
    sequelize;

    static instance;
    
    constructor(){
        //Singleton
        if(!!Connection.instance){
            return Connection.instance;
        }
        Connection.instance = this;
        // Propiedades privadas
        this.#database      = process.env.DB_DATABASE;
        this.#user          = process.env.DB_USER;
        this.#password      = process.env.DB_PASSWORD;
        this.#host          = process.env.DB_HOST;
        this.#port          = process.env.PORT;


    }

    get getConnectSequelize(){
        return this.sequelize = this.connectSequelize();
    }

    get getConnectFree(){
        return this.cnx = this.getConnectionFree();
    }

    connectSequelize() {
        
        if(this.sequelize) return  this.sequelize;

        this.sequelize = new sequelize(this.#database, this.#user, this.#password,{
            host: this.#host,
            dialect:'mysql',
            logging:false, //Bandera que imprime las querys en Log
        })
        
       
        console.log('Conectado');
        return this.sequelize;
       
    }

    getConnectionFree(){

        if(this.cnx) return this.cnx;

        this.cnx = mysql.createConnection({
            host:       this.#host,
            user:       this.#user,
            database:   this.#database,
            password:   this.#password
          });
        
        if (this.cnx) console.log('Conectado libre');
        
        return cnx;
    }

}


module.exports = Connection;