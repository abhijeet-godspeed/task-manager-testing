import { expect } from 'chai';
import { GSStatus } from '@godspeedsystems/core';
import { makeContext } from '../../helpers/makeContext';
import { executeWorkflow } from '../../helpers/executeWorkflow';

describe('test/eventHandlers/task/create.test.ts', () => {
  let prisma: any;

  beforeEach(async () => {
    const ctx = await makeContext({});
    prisma = ctx.datasources.schema.client;

    // Clean up the task table before each test
    await prisma.task.deleteMany();
    await prisma.user.deleteMany();
  });

  it('Create a task with valid title, description, and userId', async () => {
    // Create a user
    const user = await prisma.user.create({
      data: {
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
      },
    });

    const data = {
      body: {
        title: 'Test Task',
        description: 'Test Description',
        userId: user.id,
      },
    };

    const ctx = await makeContext(data);
    const result: GSStatus = await executeWorkflow(ctx, 'task.create');

    expect(result.success).to.equal(true);
    expect(result.code).to.equal(201);
    expect(result.data).to.have.property('id');
    expect(result.data.title).to.equal('Test Task');
    expect(result.data.description).to.equal('Test Description');
    expect(result.data.userId).to.equal(user.id);
  });

  it('Attempt to create a task with a non-existent userId', async () => {
    const data = {
      body: {
        title: 'Test Task',
        description: 'Test Description',
        userId: 'non-existent-user',
      },
    };

    const ctx = await makeContext(data);
    const result: GSStatus = await executeWorkflow(ctx, 'task.create');

    expect(result.success).to.equal(false);
    expect(result.code).to.equal(404);
    expect(result.data).to.deep.equal({ message: 'User not found' });
  });

  it('Simulate a database error during task creation', async () => {
    // Mock the prisma client to throw an error
    const user = await prisma.user.create({
      data: {
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
      },
    });

    const data = {
      body: {
        title: 'Test Task',
        description: 'Test Description',
        userId: user.id,
      },
    };

    const ctx = await makeContext(data);

    // Stub the prisma.task.create method to throw an error
    const originalCreate = ctx.datasources.schema.client.task.create;
    (ctx.datasources.schema.client.task as any).create = async () => {
      throw new Error('Simulated database error');
    };

    const result: GSStatus = await executeWorkflow(ctx, 'task.create');

    expect(result.success).to.equal(false);
    expect(result.code).to.equal(500);
    expect(result.data).to.have.property('message');
    expect(result.data.message).to.equal('An error occurred while creating the task');

    // Restore the original method
    (ctx.datasources.schema.client.task as any).create = originalCreate;
  });

  it('Create a task and verify that it is stored correctly in the database', async () => {
    // Create a user
    const user = await prisma.user.create({
      data: {
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
      },
    });

    const data = {
      body: {
        title: 'Test Task',
        description: 'Test Description',
        userId: user.id,
      },
    };

    const ctx = await makeContext(data);
    const result: GSStatus = await executeWorkflow(ctx, 'task.create');

    expect(result.success).to.equal(true);
    expect(result.code).to.equal(201);
    expect(result.data).to.have.property('id');

    // Verify that the task is stored in the database
    const task = await prisma.task.findUnique({
      where: {
        id: result.data.id,
      },
    });

    expect(task).to.not.be.null;
    expect(task.title).to.equal('Test Task');
    expect(task.description).to.equal('Test Description');
    expect(task.userId).to.equal(user.id);
  });
});