import argon2 from 'argon2';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const db = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'mysql'
});

const hash = await argon2.hash('admin123');
await db.query(`UPDATE data_pegawai SET password='${hash}' WHERE username='aldi'`);
console.log('Password reset to: admin123');
process.exit();
