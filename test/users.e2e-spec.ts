import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { TypeOrmExceptionFilter } from '../src/shared/filters/typeorm-exception.filter';
import helmet from 'helmet';

describe('Users (e2e)', () => {
  let app: INestApplication<App>;
  let authToken: string;
  let testUserId: string;

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
        email: `e2e-user-${Date.now()}@test.com`,
        password: 'password123',
      });

    testUserId = registerResponse.body.id;
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: registerResponse.body.email,
        password: 'password123',
      });
    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users (GET)', () => {
    it('should return paginated users', () => {
      return request(app.getHttpServer())
        .get('/users?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page', 1);
          expect(res.body).toHaveProperty('limit', 10);
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });
  });

  describe('/users/search/:email (GET)', () => {
    it('should search users by email', () => {
      return request(app.getHttpServer())
        .get('/users/search/test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/users/:id (GET)', () => {
    it('should return a user by id', () => {
      return request(app.getHttpServer())
        .get(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', testUserId);
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should fail with invalid id', () => {
      return request(app.getHttpServer())
        .get('/users/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/users/:id (PATCH)', () => {
    it('should update a user', () => {
      return request(app.getHttpServer())
        .patch(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nombre: 'Updated Name',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.nombre).toBe('Updated Name');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should update password', () => {
      return request(app.getHttpServer())
        .patch(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          password: 'newPassword123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).not.toHaveProperty('password');
        });
    });
  });

  describe('/users/:id (DELETE)', () => {
    let userToDeleteId: string;

    beforeAll(async () => {
      // Create a user to delete
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          nombre: 'User To Delete',
          email: `delete-${Date.now()}@test.com`,
          password: 'password123',
        });
      userToDeleteId = response.body.id;

      // Login as this user to get token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: response.body.email,
          password: 'password123',
        });
      authToken = loginResponse.body.accessToken;
    });

    it('should delete a user', () => {
      return request(app.getHttpServer())
        .delete(`/users/${userToDeleteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('should return 404 after deletion', () => {
      return request(app.getHttpServer())
        .get(`/users/${userToDeleteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
