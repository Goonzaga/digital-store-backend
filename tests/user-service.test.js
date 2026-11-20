jest.mock('bcrypt', () => ({
  hash: jest.fn(async () => '$2b$10$test-hash'),
  compare: jest.fn(),
}));

jest.mock('../src/models', () => ({
  User: { create: jest.fn() },
}));

const bcrypt = require('bcrypt');
const { User } = require('../src/models');
const userService = require('../src/services/user-service');

describe('user registration response', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns only public fields and stores a bcrypt hash using 10 salt rounds', async () => {
    User.create.mockResolvedValue({
      id: 7,
      firstname: 'Ana',
      surname: 'Silva',
      email: 'ana.teste@example.com',
      password: '$2b$10$test-hash',
    });

    const response = await userService.create({
      firstname: 'Ana',
      surname: 'Silva',
      email: 'ana.teste@example.com',
      password: 'SenhaFicticia123!',
      confirmPassword: 'SenhaFicticia123!',
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('SenhaFicticia123!', 10);
    expect(User.create).toHaveBeenCalledWith({
      firstname: 'Ana',
      surname: 'Silva',
      email: 'ana.teste@example.com',
      password: '$2b$10$test-hash',
    });
    expect(response).toEqual({
      id: 7,
      firstname: 'Ana',
      surname: 'Silva',
      email: 'ana.teste@example.com',
    });
    expect(response).not.toHaveProperty('password');
  });
});
