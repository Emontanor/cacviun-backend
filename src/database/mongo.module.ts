import { Module } from "@nestjs/common";
import { MongoClient } from "mongodb";

const uri = "poner ruta MongoAtlas";
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