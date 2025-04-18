jest.mock('../dist/controllers/authController/authController', () => ({
  __esModule: true,
  default: {
    authenticate: jest.fn(),
    registerUser: jest.fn(),
  },
}));

const request = require('supertest');
const express = require('express');
const router = require('../dist/routes/auth').default;
const authController =
  require('../dist/controllers/authController/authController').default;

const mockDBRecord = require('./__mocks__/user_mocks').mockDBRecord;

const url = process.DOCKER_URL || 'host.docker.internal:8000';

const app = express();
app.use(express.json());
app.use('/auth', router);

describe('POST /auth/login', () => {
  it('should return a successful login message and token', async () => {
    authController.authenticate.mockResolvedValueOnce(mockDBRecord);
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'example@example.com',
        password: 'pass',
      })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('email', 'example@example.com');
    expect(response.body).toHaveProperty('password');
    expect(response.body).toHaveProperty('fullname', 'Random User');
    expect(response.body).toHaveProperty('type', 'student');
  });

  // Wrong field request
  it('should return 401 status and error message when password is incorrect', async () => {
    authController.authenticate.mockResolvedValueOnce(undefined);
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'example@example.com',
        password: 'adsadhsa',
      })
      .expect('Content-Type', /json/)
      .expect(401);

    expect(response.body).toHaveProperty(
      'error',
      'Incorrect email or password',
    );
  });

  // Bad request, missing fields
  it('should return 400 status and error message when the body is incorrect', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'example@example.com', // missing password field
      })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty(
      'error',
      'Email and password are required',
    );
  });
});
