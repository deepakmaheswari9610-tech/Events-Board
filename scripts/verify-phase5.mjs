import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
const users = [],
  events = [];
async function request(
  path,
  { method = "GET", token, body, headers = {} } = {},
) {
  return fetch(`${base}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}
async function json(path, options) {
  const response = await request(path, options);
  assert.equal(response.status, 200);
  return response.json();
}
async function main() {
  for (let index = 0; index < 2; index++) {
    const response = await request("/api/auth/signup", {
      method: "POST",
      body: {
        email: `phase5-${Date.now()}-${index}@example.com`,
        password: "PhaseFivePassword@123",
      },
    });
    assert.equal(response.status, 201);
    const user = await response.json();
    users.push(user);
  }
  for (const fixture of [
    { active: true, days: 2 },
    { active: false, days: 2 },
    { active: true, days: -2 },
  ]) {
    const event = await db.event.create({
      data: {
        title: "Phase 5 temporary event",
        category: "Music",
        city: "Coimbatore",
        startsAt: new Date(Date.now() + fixture.days * 86400000),
        active: fixture.active,
        price: 499,
        description: "Reminder and card-design test.",
        imageUrl: "https://example.com/image.jpg",
      },
    });
    events.push(event.id);
  }
  const reminder = `/api/events/${events[0]}/reminder`,
    design = `/api/events/${events[0]}/design`;
  const token = users[0].token,
    second = users[1].token;
  for (const path of [reminder, design]) {
    assert.equal((await request(path)).status, 401);
    assert.equal(
      (await request(path, { method: "PUT", body: {} })).status,
      401,
    );
  }
  assert.deepEqual(await json(reminder, { token }), { reminded: false });
  assert.deepEqual(await json(design, { token }), {
    design: { theme: "SUNSET", stickers: [] },
  });
  await json(reminder, { method: "PUT", token, body: { reminded: true } });
  assert.equal((await json(reminder, { token })).reminded, true);
  assert.equal((await json(reminder, { token: second })).reminded, false);
  const parallel = await Promise.all(
    [1, 2, 3].map(() =>
      request(reminder, { method: "PUT", token, body: { reminded: true } }),
    ),
  );
  assert.ok(parallel.every((value) => value.status === 200));
  assert.equal(
    await db.reminder.count({
      where: { eventId: events[0], userId: users[0].user.id },
    }),
    1,
  );
  await json(reminder, { method: "PUT", token, body: { reminded: false } });
  await json(reminder, { method: "PUT", token, body: { reminded: false } });
  assert.equal((await json(reminder, { token })).reminded, false);
  for (const theme of ["SUNSET", "OCEAN", "GARDEN"]) {
    const choice = { theme, stickers: ["STAR", "MUSIC", "HEART"] };
    assert.deepEqual(
      (await json(design, { method: "PUT", token, body: choice })).design,
      choice,
    );
    assert.deepEqual((await json(design, { token })).design, choice);
  }
  assert.deepEqual((await json(design, { token: second })).design, {
    theme: "SUNSET",
    stickers: [],
  });
  for (const body of [
    { theme: "OCEAN", stickers: ["STAR", "MUSIC", "HEART", "FLOWER"] },
    { theme: "INVALID", stickers: [] },
    { theme: "OCEAN", stickers: ["INVALID"] },
    { theme: "OCEAN", stickers: [], userId: users[1].user.id },
  ])
    assert.equal(
      (await request(design, { method: "PUT", token, body })).status,
      400,
    );
  assert.deepEqual((await json(design, { token })).design, {
    theme: "GARDEN",
    stickers: ["STAR", "MUSIC", "HEART"],
  });
  for (const body of [
    { reminded: "true" },
    { reminded: true, userId: users[1].user.id },
  ])
    assert.equal(
      (await request(reminder, { method: "PUT", token, body })).status,
      400,
    );
  for (const path of [design, reminder])
    assert.equal(
      (
        await request(path, {
          method: "PUT",
          token,
          headers: { Origin: "https://foreign.example" },
          body: {},
        })
      ).status,
      403,
    );
  for (const id of [...events.slice(1), 2147483647])
    for (const suffix of ["reminder", "design"]) {
      assert.equal(
        (await request(`/api/events/${id}/${suffix}`, { token })).status,
        404,
      );
      assert.equal(
        (
          await request(`/api/events/${id}/${suffix}`, {
            method: "PUT",
            token,
            body: {},
          })
        ).status,
        404,
      );
    }
  for (const suffix of ["reminder", "design"])
    assert.equal(
      (await request(`/api/events/not-a-number/${suffix}`, { token })).status,
      400,
    );
  const removed = { theme: "OCEAN", stickers: ["STAR"] };
  await json(design, { method: "PUT", token, body: removed });
  assert.deepEqual((await json(design, { token })).design, removed);
  assert.equal(
    await db.cardDesign.count({
      where: { eventId: events[0], userId: users[0].user.id },
    }),
    1,
  );
  await json(design, {
    method: "PUT",
    token,
    body: { theme: "GARDEN", stickers: ["FLOWER", "PARTY", "PARTY"] },
  });
  assert.deepEqual((await json(design, { token })).design, {
    theme: "GARDEN",
    stickers: ["FLOWER", "PARTY", "PARTY"],
  });
  console.log(
    "PASS: reminder persistence/idempotence, per-user isolation, all themes/stickers, three-sticker validation, saved removal, protected ownership, unavailable-event rejection and origin checks.",
  );
}
try {
  await main();
} finally {
  if (users.length)
    await db.user.deleteMany({
      where: { id: { in: users.map((v) => v.user.id) } },
    });
  if (events.length)
    await db.event.deleteMany({ where: { id: { in: events } } });
  await db.$disconnect();
}
