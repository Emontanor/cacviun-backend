import { Module } from "@nestjs/common";
import { MongoClient } from "mongodb";
import { MongoService } from "./mongo.service";
import { MongoController } from "./mongo.controller";

<<<<<<< HEAD
const uri = "mongodb+srv://fhernandezm_db_admin:Fhm1qazz@cluster0.tu5cn67.mongodb.net/CacviUn?retryWrites=true&w=majority&tls=true&appName=Cluster0";
=======
//const uri = "mongodb://localhost:27017"; 
const uri = "mongodb+srv://jumontenegrol:Juanmonlo2828.@cluster0.tu5cn67.mongodb.net/CacviUn?retryWrites=true&w=majority&tls=true&appName=Cluster0";
>>>>>>> 60614d07bbfd2883aeaa0507ade4ff3a3891a7ee
const client = new MongoClient(uri);

@Module({
    providers: [
        {
            provide: "MONGO_DB",
            useFactory: async () => {
                await client.connect();
                return client.db();
            },
        }
    ],
    controllers: [MongoController],
    exports: ["MONGO_DB",MongoService],
})

export class MongoModule {}