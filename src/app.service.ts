import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';

@Injectable()
export class AppService {

  constructor(
    @Inject("MONGO_DB") private readonly db: Db,
  ){}

  getHello(): string {
    return 'Hello World!';
  }

  testDbConnection(): Promise<string> {
    return this.db.listCollections().toArray().then(() => 'Database connection successful');
  }

  async initRoles(): Promise<string> {
    const collectionName = 'Roles';

    // Verificar si la colección ya existe
    const collections = await this.db.listCollections({ name: collectionName }).toArray();
    
    // Crear la colección si no existe
    if (collections.length === 0) {
      await this.db.createCollection(collectionName);
      console.log(`Collection "${collectionName}" created.`);
    }

    const rolesCollection = this.db.collection(collectionName);

    // Poblar los datos evitando duplicados
    await rolesCollection.updateOne(
      { role_id: 1 },
      { $set: { role_id: 1, description: 'admin' } },
      { upsert: true }
    );

    await rolesCollection.updateOne(
      { role_id: 2 },
      { $set: { role_id: 2, description: 'user' } },
      { upsert: true }
    );

    return 'Roles collection initialized';
  }

  async initCategory(): Promise<string> {
    const collectionName = 'Categories';

    const collections = await this.db.listCollections({ name: collectionName }).toArray();

    if (collections.length === 0) {
      await this.db.createCollection(collectionName);
      console.log(`Collection "${collectionName}" created.`);
    }

    const categoriesCollection = this.db.collection(collectionName);

    await categoriesCollection.updateOne(
      { category_id: 1 },
      { $set: { category_id: 1, description: "Physical Violence" } },
      { upsert: true }
    );

    await categoriesCollection.updateOne(
      { category_id: 2 },
      { $set: { category_id: 2, description: "Psychological Violence" } },
      { upsert: true }
    );

    await categoriesCollection.updateOne(
      { category_id: 3 },
      { $set: { category_id: 3, description: "Sexual Violence" } },
      { upsert: true }
    );

    await categoriesCollection.updateOne(
      { category_id: 4 },
      { $set: { category_id: 4, description: "Workplace Violence" } },
      { upsert: true }
    );

    await categoriesCollection.updateOne(
      { category_id: 5 },
      { $set: { category_id: 5, description: "Discrimination" } },
      { upsert: true }
    );

    return 'Categories collection initialized';
  }

}
