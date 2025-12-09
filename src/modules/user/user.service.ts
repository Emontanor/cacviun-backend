import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';
import { VerificationDto } from './Dtos/verification.dto';
import nodemailer from "nodemailer";
import bcrypt from 'bcrypt';
import { Resend } from "resend";
import type { VerificationCodeDto } from './Dtos/verification-code.dto';
import { UserDto } from './Dtos/user.dto';
import { LoginDto } from './Dtos/login.dto';
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

@Injectable()
export class UserService {
  constructor(
    @Inject("MONGO_DB") private readonly db: Db,
  ) {}

  private readonly SALT_ROUNDS = 12;

  
  async sendVerificationCode(data: VerificationDto) {
    try {
      const code = this.generateVerificationCode();

      // Buscar el nombre si no viene
      let name = data.name;
      if (!name) {
        const user = await this.db
          .collection("Users")
          .findOne({ email: data.email });

        name = user?.name || "Usuario";
      }

      // Inicializar MailerSend
      const mailerSend = new MailerSend({
        apiKey: process.env.MAILERSEND_API_KEY!,
      });

      const htmlTemplate = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f7f7f7;">
          <div style="max-width: 500px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333333;">Hola ${name},</h2>
            <p style="font-size: 16px; color: #555555;">
              Te enviamos tu código de verificación, válido por 10 minutos:
            </p>
            <h1 style="text-align: center; color: #4CAF50; font-size: 32px; margin: 20px 0;">
              ${code}
            </h1>
            <p style="font-size: 14px; color: #999999;">
              Si no solicitaste este código, ignora este correo.
            </p>
          </div>
        </div>
      `;

      // Configurar remitente (tu sender verificado)
      const sender = new Sender("No-reply-CacviUn@test-nrw7gyme8rng2k8e.mlsender.net", "CacviUn");

      // Configurar destinatario
      const recipient = [new Recipient(data.email, name)];

      // Crear parámetros del email
      const emailParams = new EmailParams()
        .setFrom(sender)
        .setTo(recipient)
        .setSubject("Código de Verificación - CacviUn")
        .setHtml(htmlTemplate);

      // Enviar email vía MailerSend
      await mailerSend.email.send(emailParams);
      console.log(`Correo enviado con éxito a ${data.email}`);

      // Guardar en BD
      const registro = this.verificationDtoToDb(
        data,
        await this.encrypt(code)
      );

      await this.db.collection("VerificationCodes").updateOne(
        { email: data.email, type: data.type },
        { $set: registro },
        { upsert: true }
      );

      return { success: true, message: "Verification code sent" };

    } catch (error) {
      console.error(error.response?.body || error);
      return { success: false, message: "Error sending verification code" };
    }
  }

  async verifyCode(data: VerificationCodeDto){
    try{
      const result = await this.db.collection('VerificationCodes').findOne({
        email: data.email,
        type: data.type,
      });

      if (!result) {
      console.log("No matching verification record found.");
      return { success: false, message: "Invalid code" };
      }

      const isValid = await this.compareEncrypted(data.code, result.code);
      if (isValid) {
        console.log("Verification code is valid:", result);
        await this.db.collection("VerificationCodes").deleteOne({
          email: data.email,
          type: data.type,
        });
        return { success: true, message: "Code verified" };
      } else {
        console.log("Verification code does not match.");
        return { success: false, message: "Invalid code" };
      }
    }catch(error){
      return { success: false, message: "Error verifying code" }
    }
  }

  async register(data: UserDto) {
    try {
      const registro = await this.userDtoToDb(data);

      const existing = await this.db.collection("Users").findOne({ email: registro.email });
      if (existing) {
        return { success: false, message: "Usuario ya existente" };
      }

      await this.db.collection("Users").insertOne(registro);
      console.log("User created", registro);
      return { success: true, message: "Usuario registrado correctamente" };
    } catch (error) {
      console.error("Error registrando usuario:", error);

      return { success: false, message: "Error registrando usuario" };
    }
  }

  async resetPassword(data: {email: string, password: string}){
    try{
      const hash = await this.encrypt(data.password);
      const result = await this.db.collection('Users').updateOne(
        { email: data.email },
        { $set: {password: hash} }
      );

      if (result.matchedCount === 0) {
        return { success: false, message: 'User not found' };
      }

      return { success: true, message: "Contraseña actualizada"};
    } catch(error){
      return {success: false, message: "Error buscando el correo"};
    }
  }

  async existEmail(email: string){
    try{
      const result = await this.db.collection('Users').findOne({email})
      if(!result){
        return {success: true, exist: false};
      }

      return {success: true, exist: true};
    }catch(error){
      return {success: false, message: "Error buscando el correo"};
    }
  }

  async login(data: LoginDto){
    try {
      //console.log(data)
      const user = await this.db.collection('Users').findOne({email: data.email});
      if(user === null){
        return {success: false, message: "No existe el usuario"};
      }
      if(await this.compareEncrypted(data.password,user.password)){
        const session = {
          name: user.name,
          email: user.email,
          role: user.role,
        };
        return {success: true, session:session};
      }
      return ({success: false, message: "Contraseña no coincide"})
    }catch(error){
      return {success: false, message: error?.message || "Error al validar el login"};
    }
  }

  async defineAdmin(data: {email: string}){
    try{
      const result = await this.db.collection('Users').updateOne(
        { email: data.email },
        { $set: {role: "1"} }
      );

      if (result.matchedCount === 0) {
        return { success: false, message: 'User not found' };
      }

      return { success: true, message: "Role updated"};
    } catch(error){
      return {success: false, message: "Error buscando el correo"};
    }
  }

  //funcion que genera el codigo de verificacion
  private generateVerificationCode(): string {
    const code = Math.floor(100000 + Math.random() * 900000);
    return code.toString();
  }

  //funcion de encriptacion
  async encrypt(data: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
    const hash = await bcrypt.hash(data, salt);
    return hash;
  }

  //funcion que compara una cadena con un hash para validar si corresponden
  async compareEncrypted(data: string, hash: string): Promise<boolean> {
    return bcrypt.compare(data, hash);
  }

  //funcion que convierte el dto a un formato para la base de datos
  private verificationDtoToDb(data: VerificationDto, encryptedCode: string) {
    return {
      name: data.name,
      email: data.email,
      type: data.type,
      code: encryptedCode,
      createdAt: new Date(),
    };
  }

  private async userDtoToDb(data: UserDto){
    const password = await this.encrypt(data.password)
    return {
      name: data.name,
      email: data.email,
      password: password,
      role: data.role,
    };
  }

}
