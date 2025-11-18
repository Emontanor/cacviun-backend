// src/database/mongo.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { MongoClient } from 'mongodb';

@Injectable()
export class MongoService implements OnModuleInit {
  private client: MongoClient;
  private db: any;

  async onModuleInit() {
    this.client = new MongoClient(process.env.MONGOURI as string);
    await this.client.connect();

    this.db = this.client.db('CacviUn'); // TU BASE
    console.log('MongoDB conectado a CacviUn');
  }

  getDb() {
    return this.db;
  }

  async testDb() {
    const collections = await this.db.listCollections().toArray();
    return { message: 'Conexión exitosa', collections };
  }

  async createRolesCollection() {
    const roles = this.db.collection('Roles');

    await roles.insertMany([
      { role_id: 1, description: 'admin' },
      { role_id: 2, description: 'user' },
    ]);

    return { message: 'Roles creados correctamente' };
  }
}
