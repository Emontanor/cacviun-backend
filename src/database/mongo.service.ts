import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';

@Injectable()
export class MongoService {
  constructor(
    @Inject("MONGO_DB") private readonly db: Db,
  ) {}

  testDbConnection(): Promise<string> {
    return this.db.listCollections().toArray().then(() => 'Database connection successful');
  }

  // ---------------------------------------------------------
  // -------------------- HELPERS ----------------------------
  // ---------------------------------------------------------

  private async createCollectionIfNotExists(name: string) {
    const exists = await this.db.listCollections({ name }).toArray();
    if (exists.length === 0) {
      await this.db.createCollection(name);
      console.log(`Collection "${name}" created.`);
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------
  // -------------------- ROLES ------------------------------
  // ---------------------------------------------------------

  async initRoles(): Promise<string> {
    await this.createCollectionIfNotExists('Roles');
    const col = this.db.collection('Roles');

    await col.updateOne(
      { role_id: 1 },
      { $set: { role_id: 1, description: 'admin' } },
      { upsert: true }
    );

    await col.updateOne(
      { role_id: 2 },
      { $set: { role_id: 2, description: 'user' } },
      { upsert: true }
    );

    return 'Roles collection initialized';
  }

  // ---------------------------------------------------------
  // -------------------- CATEGORIES --------------------------
  // ---------------------------------------------------------

  async initCategory(): Promise<string> {
    await this.createCollectionIfNotExists('Categories');
    const col = this.db.collection('Categories');

    const categories = [
      { category_id: 1, description: "Physical Violence" },
      { category_id: 2, description: "Psychological Violence" },
      { category_id: 3, description: "Sexual Violence" },
      { category_id: 4, description: "Workplace Violence" },
      { category_id: 5, description: "Discrimination" },
    ];

    for (const c of categories)
      await col.updateOne({ category_id: c.category_id }, { $set: c }, { upsert: true });

    return 'Categories collection initialized';
  }

  // ---------------------------------------------------------
  // -------------------- REPORTS -----------------------------
  // ---------------------------------------------------------

  async createReportsCollection() {
    const created = await this.createCollectionIfNotExists("Reports");
    return created ? "Reports" : "";
  }

  async createSessionsCollection() {
    const created = await this.createCollectionIfNotExists("Sessions");
    return created ? "Sessions" : "";
  }

  async createZonesCollection() {
    const created = await this.createCollectionIfNotExists("Zones");
    return created ? "Zones" : "";
  }

  // ---------------------------------------------------------
  // --------- VERIFICATION CODES (TTL 10 min) ---------------
  // ---------------------------------------------------------

  async initVerificationCodes() {
    const collectionName = "VerificationCodes";

    await this.createCollectionIfNotExists(collectionName);

    const collection = this.db.collection(collectionName);

    // TTL Index: 10 minutos = 600 segundos
    await collection.createIndex(
      { creationTime: 1 },
      { expireAfterSeconds: 600 }
    );

    console.log("VerificationCodes TTL index created (10 min)");

    return "VerificationCodes";
  }

  // ---------------------------------------------------------
  // -------------------- CREATE ALL --------------------------
  // ---------------------------------------------------------

  async createAll() {
    const created: string[] = [];

    // Crear colecciones base
    try { created.push(await this.createReportsCollection()); } catch {}
    try { created.push(await this.createSessionsCollection()); } catch {}
    try { created.push(await this.createZonesCollection()); } catch {}

    // Inicializar colecciones con datos
    try { await this.initRoles(); created.push("Roles"); } catch {}
    try { await this.initCategory(); created.push("Categories"); } catch {}

    // Crear VerificationCodes + TTL
    try { created.push(await this.initVerificationCodes()); } catch {}

    return { created: created.filter(x => x !== "") };
  }

  async createPrueba(): Promise<{ insertedId: string }> {
    const collection = this.db.collection('VerificationCodes');

    const doc = {
      nombre: 'prueba',
      creationTime: new Date(), // Fecha y hora actual
    };

    const result = await collection.insertOne(doc);

    return { insertedId: result.insertedId.toString() };
  }
}
