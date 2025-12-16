import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { TypeOrmExceptionFilter } from '../src/shared/filters/typeorm-exception.filter';
import helmet from 'helmet';

describe('Groups (e2e)', () => {
  let app: INestApplication<App>;
  let authToken: string;
  let userId: string;
  let groupId: string;
  let secondUserToken: string;
  let secondUserId: string;

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

    // Register and login first user
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        nombre: 'E2E Group Owner',
        email: `e2e-group-owner-${Date.now()}@test.com`,
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

    // Register and login second user
    const registerResponse2 = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        nombre: 'E2E Group Member',
        email: `e2e-group-member-${Date.now()}@test.com`,
        password: 'password123',
      });

    secondUserId = registerResponse2.body.id;
    const loginResponse2 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: registerResponse2.body.email,
        password: 'password123',
      });
    secondUserToken = loginResponse2.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/groups (POST)', () => {
    it('should create a group', () => {
      return request(app.getHttpServer())
        .post('/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nombre: 'E2E Test Group',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.nombre).toBe('E2E Test Group');
          groupId = res.body.id;
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/groups')
        .send({
          nombre: 'Test Group',
        })
        .expect(401);
    });
  });

  describe('/groups (GET)', () => {
    it('should return groups for user', () => {
      return request(app.getHttpServer())
        .get('/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/groups/:id (GET)', () => {
    it('should return a single group', () => {
      return request(app.getHttpServer())
        .get(`/groups/${groupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(groupId);
          expect(res.body).toHaveProperty('miembros');
        });
    });

    it('should fail if user is not member', () => {
      return request(app.getHttpServer())
        .get(`/groups/${groupId}`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .expect(404);
    });
  });

  describe('/groups/:id/members (POST)', () => {
    it('should invite a member', () => {
      // First, add second user as member (using owner token)
      return request(app.getHttpServer())
        .post(`/groups/${groupId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: `e2e-group-member-${Date.now()}@test.com`,
          role: 'Miembro',
        })
        .expect(201);
    });
  });

  describe('/groups/:id (PATCH)', () => {
    it('should update a group', () => {
      return request(app.getHttpServer())
        .patch(`/groups/${groupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nombre: 'Updated Group Name',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.nombre).toBe('Updated Group Name');
        });
    });

    it('should fail if user is not owner', () => {
      return request(app.getHttpServer())
        .patch(`/groups/${groupId}`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({
          nombre: 'Should Fail',
        })
        .expect(403);
    });
  });

  describe('/groups/:id (DELETE)', () => {
    it('should delete a group', () => {
      // Create a group to delete
      return request(app.getHttpServer())
        .post('/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nombre: 'Group To Delete',
        })
        .then((res) => {
          const deleteGroupId = res.body.id;
          return request(app.getHttpServer())
            .delete(`/groups/${deleteGroupId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(204);
        });
    });
  });
});
