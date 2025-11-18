import { Module } from "@nestjs/common";
import { MongoClient } from "mongodb";
import { MongoService } from "./mongo.service";
import { MongoController } from "./mongo.controller";

//const uri = "mongodb+srv://jumontenegrol:Juanmonlo2828.@cluster0.tu5cn67.mongodb.net/CacviUn?retryWrites=true&w=majority&tls=true&appName=Cluster0";
//const uri = "mongodb+srv://fhernandezm_db_admin:Fhm1qazz@cluster0.tu5cn67.mongodb.net/CacviUn?retryWrites=true&w=majority&tls=true&appName=Cluster0";
const client = new MongoClient(uri);

@Module({
    providers: [
        {
            provide: "MONGO_DB",
            useFactory: async () => {
                await client.connect();
                return client.db();
            },
        },
        MongoService,
    ],
    controllers: [MongoController],
    exports: ["MONGO_DB",MongoService],
})

export class MongoModule {}