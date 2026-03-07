import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

/**
 * Script para importar animales masivamente desde un archivo CSV
 * 
 * Formato esperado del CSV:
 * caravana,tipoAnimal,pelaje,sexo,raza,fechaNacimiento,descripcion,duenoEmail
 * DEMO-001,Vaca,Blanco/a,Hembra,Brahman,2020-01-15,Descripción del animal,usuario@example.com
 * 
 * Uso:
 * 1. Colocar archivo CSV en: Back-End/data/animales.csv
 * 2. Ejecutar: npm run import:animals
 */

interface AnimalRow {
  caravana: string;
  tipoAnimal: 'Vaca' | 'Vaquilla' | 'Ternero' | 'Ternera' | 'Novillo' | 'Toro';
  pelaje: string;
  sexo: 'Hembra' | 'Macho';
  raza?: string;
  fechaNacimiento?: string;
  descripcion?: string;
  duenoEmail: string;
}

async function importAnimals() {
  const axios = require('axios');
  const API_URL = process.env.API_URL || 'http://localhost:3000';
  
  console.log('🐄 Iniciando importación masiva de animales...\n');
  
  // 1. Leer archivo CSV
  const csvPath = path.join(__dirname, '../data/animales.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error('❌ Error: No se encontró el archivo animales.csv');
    console.log('📁 Crea el archivo en: Back-End/data/animales.csv');
    console.log('\n📋 Formato esperado:');
    console.log('caravana,tipoAnimal,pelaje,sexo,raza,fechaNacimiento,descripcion,duenoEmail');
    console.log('DEMO-001,Vaca,Blanco/a,Hembra,Brahman,2020-01-15,Vaca lechera,usuario@example.com');
    process.exit(1);
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records: AnimalRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  
  console.log(`📊 Animales a importar: ${records.length}\n`);
  
  // 2. Login (necesitas un usuario administrador)
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  
  console.log(`🔐 Iniciando sesión como: ${email}`);
  
  let token: string;
  try {
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });
    token = loginResponse.data.access_token;
    console.log('✅ Sesión iniciada correctamente\n');
  } catch (error: any) {
    console.error('❌ Error al iniciar sesión:', error.response?.data || error.message);
    console.log('\n💡 Asegúrate de que:');
    console.log('   1. El backend está corriendo (docker-compose up -d)');
    console.log('   2. Las credenciales son correctas');
    console.log('   3. El usuario existe en la base de datos');
    process.exit(1);
  }
  
  // 3. Obtener o crear usuarios por email
  const userCache = new Map<string, string>();
  
  // 4. Importar animales
  let success = 0;
  let errors = 0;
  
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const progress = `[${i + 1}/${records.length}]`;
    
    try {
      // Obtener ID del dueño
      let duenoId = userCache.get(record.duenoEmail);
      
      if (!duenoId) {
        const userResponse = await axios.get(
          `${API_URL}/users/search/${record.duenoEmail}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        duenoId = userResponse.data.id;
        userCache.set(record.duenoEmail, duenoId);
      }
      
      // Crear animal
      const animalData = {
        caravana: record.caravana,
        tipoAnimal: record.tipoAnimal,
        pelaje: record.pelaje,
        sexo: record.sexo,
        duenoId: duenoId,
        raza: record.raza || undefined,
        fechaNacimiento: record.fechaNacimiento || undefined,
        descripcion: record.descripcion || undefined,
      };
      
      await axios.post(`${API_URL}/animals`, animalData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      success++;
      console.log(`${progress} ✅ ${record.caravana} - ${record.tipoAnimal}`);
      
    } catch (error: any) {
      errors++;
      const errorMsg = error.response?.data?.message || error.message;
      console.error(`${progress} ❌ Error en ${record.caravana}: ${errorMsg}`);
    }
  }
  
  // 5. Resumen
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN DE IMPORTACIÓN');
  console.log('='.repeat(50));
  console.log(`✅ Exitosos: ${success}`);
  console.log(`❌ Errores: ${errors}`);
  console.log(`📊 Total: ${records.length}`);
  console.log('='.repeat(50) + '\n');
  
  if (errors > 0) {
    console.log('⚠️  Revisa los errores anteriores para más detalles');
  } else {
    console.log('🎉 ¡Importación completada exitosamente!');
  }
}

// Ejecutar
importAnimals().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

