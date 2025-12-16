import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { TypeOrmExceptionFilter } from '../src/shared/filters/typeorm-exception.filter';
import helmet from 'helmet';

describe('Animals (e2e)', () => {
  let app: INestApplication<App>;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    app.use(helmet());
    app.enableCors();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new TypeOrmExceptionFilter());

    await app.init();

    // Register and login to get auth token
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        nombre: 'E2E Test User',
        email: `e2e-${Date.now()}@test.com`,
        password: 'password123',
      });

    if (registerResponse.status === 201) {
      userId = registerResponse.body.id;
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: registerResponse.body.email,
          password: 'password123',
        });
      authToken = loginResponse.body.accessToken;
    } else {
      // Try login if user exists
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'e2e-test@test.com',
          password: 'password123',
        });
      authToken = loginResponse.body.accessToken;
      userId = loginResponse.body.user.id;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/animals (POST)', () => {
    it('should create an animal', () => {
      return request(app.getHttpServer())
        .post('/animals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          caravana: 'E2E-CAR-001',
          tipoAnimal: 'Vaca',
          pelaje: 'Blanco/a',
          sexo: 'Hembra',
          raza: 'Holando',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.caravana).toBe('E2E-CAR-001');
          expect(res.body.tipoAnimal).toBe('Vaca');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/animals')
        .send({
          caravana: 'E2E-CAR-001',
          tipoAnimal: 'Vaca',
          pelaje: 'Blanco/a',
          sexo: 'Hembra',
        })
        .expect(401);
    });

    it('should fail with invalid data', () => {
      return request(app.getHttpServer())
        .post('/animals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          caravana: 'E2E-CAR-001',
          // Missing required fields
        })
        .expect(400);
    });
  });

  describe('/animals (GET)', () => {
    it('should return list of animals', () => {
      return request(app.getHttpServer())
        .get('/animals?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(res.body).toHaveProperty('limit');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('/animals/:id (GET)', () => {
    let animalId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/animals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          caravana: 'E2E-GET-TEST',
          tipoAnimal: 'Vaca',
          pelaje: 'Blanco/a',
          sexo: 'Hembra',
        });
      animalId = response.body.id;
    });

    it('should return a single animal', () => {
      return request(app.getHttpServer())
        .get(`/animals/${animalId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', animalId);
          expect(res.body.caravana).toBe('E2E-GET-TEST');
        });
    });

    it('should fail with invalid id', () => {
      return request(app.getHttpServer())
        .get('/animals/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/animals/:id (PATCH)', () => {
    let animalId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/animals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          caravana: 'E2E-UPDATE-TEST',
          tipoAnimal: 'Vaca',
          pelaje: 'Blanco/a',
          sexo: 'Hembra',
        });
      animalId = response.body.id;
    });

    it('should update an animal', () => {
      return request(app.getHttpServer())
        .patch(`/animals/${animalId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          caravana: 'E2E-UPDATED',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.caravana).toBe('E2E-UPDATED');
        });
    });
  });

  describe('/animals/:id (DELETE)', () => {
    let animalId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/animals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          caravana: 'E2E-DELETE-TEST',
          tipoAnimal: 'Vaca',
          pelaje: 'Blanco/a',
          sexo: 'Hembra',
        });
      animalId = response.body.id;
    });

    it('should delete an animal', () => {
      return request(app.getHttpServer())
        .delete(`/animals/${animalId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('should return 404 after deletion', () => {
      return request(app.getHttpServer())
        .get(`/animals/${animalId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});

