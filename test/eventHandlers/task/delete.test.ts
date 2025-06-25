import { expect } from 'chai';
import { GSStatus } from '@godspeedsystems/core';
import { makeContext } from '../../helpers/makeContext';
import { executeWorkflow } from '../../helpers/executeWorkflow';

describe('test/eventHandlers/task/delete.test.ts', () => {
  let prisma: any;

  beforeEach(async () => {
    const data = {
      params: {},
      body: {},
      headers: {},
      query: {},
      user: {},
    };
    const ctx = await makeContext(data);
    prisma = ctx.datasources.schema.client;

    // Clean up the database before each test
    await prisma.task.deleteMany();
    await prisma.user.deleteMany();
  });

  it('Test Case 1: Delete a task with a valid taskId and userId', async () => {
    // Create a user
    const user = await prisma.user.create({
      data: {
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
      },
    });

    // Create a task
    const task = await prisma.task.create({
      data: {
        id: 'task1',
        title: 'Test Task',
        description: 'Test Description',
        userId: user.id,
      },
    });

    const data = {
      params: {
        taskId: task.id,
        userId: user.id,
      },
      body: {},
      headers: {},
      query: {},
      user: {},
    };

    const ctx = await makeContext(data);
    const result: GSStatus = await executeWorkflow(ctx, 'task.delete');

    expect(result.code).to.equal(204);

    // Verify that the task is deleted from the database
    const deletedTask = await prisma.task.findUnique({
      where: {
        id: task.id,
      },
    });

    expect(deletedTask).to.be.null;
  });

  it('Test Case 2: Attempt to delete a task with a non-existent userId', async () => {
    const data = {
      params: {
        taskId: 'task1',
        userId: 'nonExistentUser',
      },
      body: {},
      headers: {},
      query: {},
      user: {},
    };

    const ctx = await makeContext(data);
    const result: GSStatus = await executeWorkflow(ctx, 'task.delete');

    expect(result.code).to.equal(404);
    expect(result.data.message).to.equal('User not found');
  });

  it('Test Case 3: Attempt to delete a task with a non-existent taskId', async () => {
    // Create a user
    const user = await prisma.user.create({
      data: {
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
      },
    });

    const data = {
      params: {
        taskId: 'nonExistentTask',
        userId: user.id,
      },
      body: {},
      headers: {},
      query: {},
      user: {},
    };

    const ctx = await makeContext(data);
    const result: GSStatus = await executeWorkflow(ctx, 'task.delete');

    expect(result.code).to.equal(404);
    expect(result.data.message).to.equal('Task not found');
  });

  it('Test Case 4: Attempt to delete a task with a valid taskId but an unauthorized userId', async () => {
    // Create a user
    const user1 = await prisma.user.create({
      data: {
        id: 'user1',
        name: 'Test User 1',
        email: 'test1@example.com',
      },
    });

    const user2 = await prisma.user.create({
      data: {
        id: 'user2',
        name: 'Test User 2',
        email: 'test2@example.com',
      },
    });

    // Create a task
    const task = await prisma.task.create({
      data: {
        id: 'task1',
        title: 'Test Task',
        description: 'Test Description',
        userId: user1.id,
      },
    });

    const data = {
      params: {
        taskId: task.id,
        userId: user2.id, // Unauthorized user
      },
      body: {},
      headers: {},
      query: {},
      user: {},
    };

    const ctx = await makeContext(data);
    const result: GSStatus = await executeWorkflow(ctx, 'task.delete');

    expect(result.code).to.equal(403);
    expect(result.data.message).to.equal('User not authorized to delete this task');
  });

  it('Test Case 5: Simulate a database error during task deletion', async () => {
    // Mock the prisma.client.task.delete function to throw an error
    const prismaMock = {
      task: {
        findUnique: async () => {
          throw new Error('Simulated database error');
        }
      },
      user: {
        findUnique: async () => ({
          id: 'user1',
          name: 'Test User',
          email: 'test@example.com',
        }),
      },
    };

    const data = {
      params: {
        taskId: 'task1',
        userId: 'user1',
      },
      body: {},
      headers: {},
      query: {},
      user: {},
    };

    const ctx = await makeContext(data);
    
    // Stub the prisma.task.create method to throw an error
    const originalClient = ctx.datasources.schema.client;
    ctx.datasources.schema.client = prismaMock;

    const result: GSStatus = await executeWorkflow(ctx, 'task.delete');

    expect(result.code).to.equal(500);
    expect(result.data.message).to.equal('An error occurred while deleting the task');
    expect(result.data.error).to.equal('Simulated database error');

    ctx.datasources.schema.client = originalClient; // Restore the original client
  });

  it('Test Case 6: Delete a task and verify that it is no longer present in the database', async () => {
    // Create a user
    const user = await prisma.user.create({
      data: {
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
      },
    });

    // Create a task
    const task = await prisma.task.create({
      data: {
        id: 'task1',
        title: 'Test Task',
        description: 'Test Description',
        userId: user.id,
      },
    });

    const data = {
      params: {
        taskId: task.id,
        userId: user.id,
      },
      body: {},
      headers: {},
      query: {},
      user: {},
    };

    const ctx = await makeContext(data);
    const result: GSStatus = await executeWorkflow(ctx, 'task.delete');

    expect(result.code).to.equal(204);

    // Verify that the task is deleted from the database
    const deletedTask = await prisma.task.findUnique({
      where: {
        id: task.id,
      },
    });

    expect(deletedTask).to.be.null;
  });
});