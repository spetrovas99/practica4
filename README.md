# practica4
# Practica-4-Facturación.
## Instalar/Run

```js
npm install
```

ejecutar el GraphQLServer en: http://localhost:4000



## Query

- Imprimir todas las facturas

```js
query{
  getFacturas(nombre="stefani",token="12343242344"){
    concepto
  }
```


## Mutations

- login

```js
mutation{
  login(nombre:"stefani",contrasena:"1234"){
    //imprime el token del usuario
  }
}
```

- logut

```js
mutation{
  logout(nombre:"stefani",token:"12321321768"){
    //sale del login
  }
}
```

- añadir titular

```js
mutation{
  addTitular(nombre:"Stefani",contrasena:"2343"){
    nombre
  }
}
```
- añadir factura

```js
mutation{
  addFactura(nombre:"Stefani",token:"24234324343",concepto:"gas",cantidad:32.50){
    nombre
  }
}
```


- Eliminar titular

```js
mutation{
  removeTitular(nombre:"stefani",token:"436453"){
    nombre
  }
}
```
