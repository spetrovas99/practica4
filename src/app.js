import * as uuid from "uuid";
import { MongoClient, ObjectID } from "mongodb";
import { GraphQLServer } from "graphql-yoga";
import dateTime from "date-time";
import "babel-polyfill"
import { isRegExp } from "util";

const dbConnect = async () => {
    const uri = "mongodb+srv://stefani:contraseña@scluster-jlu1s.gcp.mongodb.net/test";
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    return client;
  }
  
  const runGraphQLServer = function (context) {
    const typeDefs = `
      type Query{
        getFacturas(nombre:String!,token:String!): [Factura!]
      }
      type Mutation{
        addFactura(concepto:String!,cantidad:Float!, nombre: String!, token:String!): Factura!    
        addTitular(nombre: String!, contrasena: String!):Titular!
        login(nombre:String!,contrasena:String!): String
        logout(nombre:String!,token:String!): Titular!
        removeTitular(nombre:String!,token:String!):Titular!

      }
      type Factura{
        concepto: String!
        cantidad: Float!
        fecha: String!
        titular: Titular
      }
      type Titular{
        nombre: String!
        contrasena: String!
        factura: [Factura!]
        token: String
      }
    `
  
    const resolvers = {
       Titular:{
            factura:async (parent,args,ctx,info)=>{
                const { db } = ctx;
                const collection = db.collection("facturas");

                return await collection.find({titular: parent.nombre}).toArray();
            }
       },
       Factura:{
            titular: async(parent,args,ctx,info)=>{
                const { db } = ctx;
                const collection = db.collection("titulares");
                return collection.findOne({nombre: parent.titular});
            }
       },
      Query:{
        getFacturas: async (parent,args,ctx,info)=>{
            const { nombre, token } = args;
            const { db } = ctx;
            const collection = db.collection("titulares");
            const collection2 = db.collection("facturas");
            const usuario = await collection.findOne({nombre});
            
            if(usuario){
                if(usuario.token === token){
                    return await collection2.find({titular: nombre}).toArray();
                }else{
                    throw new Error (`no coincide el nombre y el token`);
                }
            }else{
                throw new Error (`no existe ningun usuario con ese nombre: ${nombre}`);
            }
        }
      },
      Mutation:{    
        addTitular:async (parent,args,ctx,info) =>{
            const { nombre, contrasena } = args;
            const {db} = ctx;
            const collection = db.collection("titulares");
            let result = await collection.find({}).toArray();
        
             if(result.some(elem =>elem.nombre === nombre)){
                 throw new Error (`ya existe un usuario con ese nombre: ${nombre}`);
             }
            result = await collection.insertOne({ nombre, contrasena });
            return {
                nombre,
                contrasena,
                token: null,
             };
        },
        addFactura: async(parent,args,ctx,nfo)=>{
            const { nombre, token,concepto,cantidad} = args;
            const { db } = ctx;
            const collection = db.collection("titulares");
            const collection2 = db.collection("facturas");
            const usuario = await collection.findOne({nombre});
            
            if(usuario){
                if(usuario.token === token){
                    const factura ={
                        titular: nombre,
                        concepto,
                        cantidad,
                        fecha: dateTime(),
                    };

                    await collection2.insertOne(factura);
                    return factura;
                }else{
                    throw new Error (`no coincide el nombre y el token`);
                }
            }else{
                throw new Error (`no existe ningun usuario con ese nombre: ${nombre}`);
            }

        },
        login: async (parent, args, ctx, info) => {
            let token = 0;
            const { nombre, contrasena } = args;
            const { db } = ctx;
            const collection = db.collection("titulares");
            const usuario = await collection.findOne({nombre});
            if(usuario) {
                if(usuario.nombre === nombre && usuario.contrasena === contrasena){
                    token  = uuid.v4();
                    await collection.updateOne({nombre},{$set: {token}});
                }else{
                    throw new error ("no coincide el nombre y la contrasena");
                }
            }else{
                throw new Error (`no se encuentra ${nombre}`);
            }
              return token; 
          },
          logout: async (parent, args, ctx, info) => {
            const { nombre, token } = args;
            const { db } = ctx;
            const collection = db.collection("titulares");
            const usuario = await collection.findOne({nombre});
            if(usuario.token){
                await collection.updateOne({nombre},{$set: {token}});
            }
                return await collection.findOne({nombre});
          },
          removeTitular:async(parent,args,ctx,info)=>{
            const { nombre, token } = args;
            const { db } = ctx;
            const collection = db.collection("titulares");
            const collection2 = db.collection("facturas");
            const usuario = await collection.findOne({nombre});
            if(usuario) {
                if(usuario.nombre === nombre && usuario.token === token){
                    await collection2.deleteMany({titular: nombre});
                    return (await collection.findOneAndDelete({nombre})).value;
                }else{
                    throw new error ("no coincide el nombre y el token");
                }
            }else{
                throw new Error (`no se encuentra ${nombre}`);
            }
          }
      }
        
    };

    const server = new GraphQLServer({ typeDefs, resolvers, context });
    const options = {
      port: 4000
    };
    try {
      server.start(options, ({ port }) =>
        console.log(
          `Server started, listening on port ${port} for incoming requests.`
        )
      );
    } catch (e) {
      console.info(e);
    }
  }
  const runApp = async function () {
      try{
    const client = await dbConnect();
    console.log("Connect to Mongo DB");

    const db = client.db("carpeta");
    
      runGraphQLServer({ client, db });
    } catch (e) {
      console.log(e);
      client.close();
    }
  };
  runApp();