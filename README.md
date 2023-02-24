#API REST NodeJS

El presente template se intenta apegar al patrón de desarrollo MVC

## Requerimientos
- Node >= 14.15.1
- NPM  >= 6.14.8

### Dependencias de desarrollo

- Nodemon >= 2.0.6
    - `npm install -g nodemon`  (Require permisos de admnitrador en Windows o sudo en Linux/Mac)
- Postman

### Dependencias de producción

- PM2

*Notas: Es necesario tener el puerto ha configurar disponible dentro del servidor*

## Instalación

```sh
$ cd proyecto/
$ npm install
```

## Configuración

Copiando `.env.example` a `.env` definitivo
```sh
$ cp .env.example .env
```
Configurar puerto deseado y conexion a base de datos en el archivo `.env`

```sh
PORT=3000
DB_DATABASE=
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_PORT=
```

## Inicio de proyecto

### Desarrollo:
Para iniciar el proyecto ejecute el siguiente comando: 
```sh
$ nodemon app
```

Debe obtener la siguiente salida: 
```sh
[nodemon] 2.0.6
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,json
[nodemon] starting `node app.js`
Servidor corriendo en el puerto: 3000
```

Caso contrario, verifique la instalación de las dependencias, configuración a base de datos y/o disponibilidad del puerto



### Producción
Para iniciar el proyecto ejecute el siguiente comando: 

```sh
$ pm2 start app --name "Nombre deseado"
```

Debe obtener la siguiente salida: 

![imagen_pm2](https://user-images.githubusercontent.com/757747/123512784-b0341900-d689-11eb-93d4-69510ee2be27.png)


### Sitios de interes
- [NodeJS](https://nodejs.org/en/)
- [PM2](https://pm2.keymetrics.io/docs/usage/process-management/)
- [Sequelize ORM](https://sequelize.org/)
- [ExpressJS](https://expressjs.com/)

## Autor 
Kevin Llamas Alcalá

Versión 1.0.0

## Licencia 
- MIT
