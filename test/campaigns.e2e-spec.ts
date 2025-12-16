import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { TypeOrmExceptionFilter } from '../src/shared/filters/typeorm-exception.filter';
import helmet from 'helmet';

describe('Campaigns (e2e)', () => {
  let app: INestApplication<App>;
  let authToken: string;
  let userId: string;
  let animalId: string;
  let campaignId: string;

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

    // Register and login
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        nombre: 'E2E Campaign User',
        email: `e2e-campaign-${Date.now()}@test.com`,
        password: 'password123',
      });

    userId = registerResponse.body.id;
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: registerResponse.body.email,
        password: 'password123',
      });
    authToken = loginResponse.body.accessToken;

    // Create an animal for the campaign
    const animalResponse = await request(app.getHttpServer())
      .post('/animals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        caravana: 'E2E-CAMPAIGN-ANIMAL',
        tipoAnimal: 'Vaca',
        pelaje: 'Blanco/a',
        sexo: 'Hembra',
      });
    animalId = animalResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/campaigns (POST)', () => {
    it('should create a campaign', () => {
      return request(app.getHttpServer())
        .post('/campaigns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nombre: 'E2E Test Campaign',
          fecha: '2024-01-01',
          productosUtilizados: 'Vacuna A',
          observaciones: 'Test campaign',
          animalesIds: [animalId],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.nombre).toBe('E2E Test Campaign');
          expect(res.body.animales).toHaveLength(1);
          campaignId = res.body.id;
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/campaigns')
        .send({
          nombre: 'Test Campaign',
          fecha: '2024-01-01',
          animalesIds: [],
        })
        .expect(401);
    });

    it('should fail with invalid animal id', () => {
      return request(app.getHttpServer())
        .post('/campaigns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nombre: 'Test Campaign',
          fecha: '2024-01-01',
          animalesIds: ['invalid-id'],
        })
        .expect(404);
    });
  });

  describe('/campaigns (GET)', () => {
    it('should return campaigns for user', () => {
      return request(app.getHttpServer())
        .get('/campaigns')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/campaigns/:id (GET)', () => {
    it('should return a single campaign', () => {
      return request(app.getHttpServer())
        .get(`/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(campaignId);
          expect(res.body).toHaveProperty('animales');
        });
    });

    it('should fail with invalid id', () => {
      return request(app.getHttpServer())
        .get('/campaigns/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/campaigns/:id (PATCH)', () => {
    it('should update a campaign', () => {
      return request(app.getHttpServer())
        .patch(`/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nombre: 'Updated Campaign Name',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.nombre).toBe('Updated Campaign Name');
        });
    });

    it('should update animals in campaign', () => {
      return request(app.getHttpServer())
        .patch(`/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          animalesIds: [animalId],
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.animales).toHaveLength(1);
        });
    });
  });

  describe('/campaigns/:id (DELETE)', () => {
    it('should delete a campaign', () => {
      // Create a campaign to delete
      return request(app.getHttpServer())
        .post('/campaigns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nombre: 'Campaign To Delete',
          fecha: '2024-01-01',
          animalesIds: [animalId],
        })
        .then((res) => {
          const deleteCampaignId = res.body.id;
          return request(app.getHttpServer())
            .delete(`/campaigns/${deleteCampaignId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(204);
        });
    });
  });
});
