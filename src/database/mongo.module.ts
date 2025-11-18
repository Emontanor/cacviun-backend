import { Module } from "@nestjs/common";
import { MongoClient } from "mongodb";

//const uri = "mongodb://localhost:27017"; 
const uri = "mongodb+srv://jumontenegrol:Juanmonlo2828.@cluster0.tu5cn67.mongodb.net/CacviUn?retryWrites=true&w=majority&tls=true&appName=Cluster0";
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
    exports: ["MONGO_DB"],
})

export class MongoModule {}