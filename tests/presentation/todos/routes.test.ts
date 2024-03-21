import request from "supertest";
import { testServer } from "../../test-server";
import { prisma } from "../../../src/data/postgres";
describe("Todo route testing", () => {
  beforeAll(async () => {
    await testServer.start();
  });
  afterAll(() => {
    testServer.close();
  });
  beforeEach(async () => {
    await prisma.todo.deleteMany();
  });
  const todo1 = { text: "Hola Mundo 1" };
  const todo2 = { text: "Hola Mundo 2" };

  test("Should return TODOS api/todos", async () => {
    await prisma.todo.createMany({
      data: [todo1, todo2],
    });
    const { body } = await request(testServer.app)
      .get("/api/todos")
      .expect(200);
    expect(body).toBeInstanceOf(Array);
    expect(body.length).toBe(2);
    expect(body[0].text).toBe(todo1.text);
    expect(body[0].completedAt).toBeNull();
    expect(body[1].text).toBe(todo2.text);
  });

  test("Should return TODOS api/todos/:id", async () => {
    const todo = await prisma.todo.create({ data: todo1 });
    const { body } = await request(testServer.app)
      .get(`/api/todos/${todo.id}`)
      .expect(200);
    expect(body).toEqual({
      id: todo.id,
      text: todo.text,
      completedAt: todo.completedAt,
    });
  });

  test("Should return A 404 NotFound api/todos/:id", async () => {
    const todoId = 999;
    const { body } = await request(testServer.app)
      .get(`/api/todos/${todoId}`)
      .expect(404);
    expect(body).toEqual({ error: `Todo with id ${todoId} not found` });
  });

  test("Should return a new Todo api/todos", async () => {
    const { body } = await request(testServer.app)
      .post("/api/todos")
      .send(todo1)
      .expect(201);
    expect(body).toEqual({
      id: expect.any(Number),
      text: todo1.text,
      completedAt: null,
    });
  });

  test("Should return a error if text is not valid api/todos", async () => {
    const { body } = await request(testServer.app)
      .post("/api/todos")
      .send({})
      .expect(400);

    expect(body).toEqual({ error: "Text property is required" });
  });

  test("Should return a error if text is empty api/todos", async () => {
    const { body } = await request(testServer.app)
      .post("/api/todos")
      .send({ text: "" })
      .expect(400);

    expect(body).toEqual({ error: "Text property is required" });
  });

  test("Should return an updated todo api/todos/:id", async () => {
    const todo = await prisma.todo.create({ data: todo1 });

    const { body } = await request(testServer.app)
      .put(`/api/todos/${todo.id}`)
      .send({ text: "Hola mundo Update", completedAt: "2023-10-21" })
      .expect(200);

    expect(body).toEqual({
      id: expect.any(Number),
      text: "Hola mundo Update",
      completedAt: "2023-10-21T00:00:00.000Z",
    });
  });

  test("Should return 404 if TODO not found", async () => {
    const todoId = 999;
    const { body } = await request(testServer.app)
      .put(`/api/todos/${todoId}`)
      .expect(404);
    expect(body).toEqual({ error: `Todo with id ${todoId} not found` });
  });

  test("Should return an updated TODO only the date", async () => {
    const todo = await prisma.todo.create({ data: todo1 });
    const { body } = await request(testServer.app)
      .put(`/api/todos/${todo.id}`)
      .send({ completedAt: "2023-10-21" })
      .expect(200);
    expect(body).toEqual({
      id: expect.any(Number),
      text: todo1.text,
      completedAt: "2023-10-21T00:00:00.000Z",
    });
  });

  test("Should return 404 if TODO do not exist api/todo/:id", async () => {
    const todoId = 999;
    const { body } = await request(testServer.app)
      .delete(`/api/todos/${todoId}`)
      .expect(404);
    expect(body).toEqual({ error: `Todo with id ${todoId} not found` });
  });

  test("Should delete a TODO api/todo/:id", async () => {
    const todo = await prisma.todo.create({ data: todo1 });
    const { body } = await request(testServer.app)
      .delete(`/api/todos/${todo.id}`)
      .expect(200);
    expect(body).toEqual({
      id: expect.any(Number),
      text: todo.text,
      completedAt: null,
    });
  });
});
