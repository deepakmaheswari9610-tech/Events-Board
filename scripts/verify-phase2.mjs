import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
const db = new PrismaClient();
let createdId;
async function request(
  path,
  { method = "GET", token, cookie, body, headers = {} } = {},
) {
  return fetch(`${base}${path}`, {
    method,
    redirect: "manual",
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}
async function main() {
  assert.equal((await request("/admin")).status, 307);
  assert.equal((await request("/api/admin/events")).status, 401);
  assert.equal(
    (await request("/api/admin/events", { method: "POST", body: {} })).status,
    401,
  );
  assert.equal(
    (
      await request("/api/admin/events/1", {
        method: "PATCH",
        body: { active: false },
      })
    ).status,
    401,
  );
  assert.equal(
    (await request("/api/admin/events/1", { method: "DELETE" })).status,
    405,
  );
  assert.equal(
    (
      await request("/api/admin/login", {
        method: "POST",
        body: {
          email: process.env.ADMIN_EMAIL,
          password: "incorrect-password",
        },
      })
    ).status,
    401,
  );
  const login = await request("/api/admin/login", {
    method: "POST",
    body: {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    },
  });
  assert.equal(login.status, 200);
  assert.match(login.headers.get("set-cookie"), /HttpOnly/i);
  assert.match(login.headers.get("set-cookie"), /SameSite=strict/i);
  const cookie = login.headers.get("set-cookie").split(";")[0];
  const { token, user } = await login.json();
  assert.equal((await request("/admin", { cookie })).status, 200);
  const list = await request("/api/admin/events", { token });
  assert.equal(list.status, 200);
  assert.ok((await list.json()).events.length >= 15);
  const admin = await db.user.findUnique({ where: { id: user.id } });
  assert.match(admin.passwordHash, /^scrypt\$/);
  assert.notEqual(admin.passwordHash, process.env.ADMIN_PASSWORD);
  const key = new TextEncoder().encode(process.env.JWT_SECRET);
  for (const [role, expiry] of [
    ["USER", "1h"],
    ["ADMIN", "-1s"],
  ]) {
    const invalid = await new SignJWT({ role })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(String(user.id))
      .setIssuer("community-board")
      .setAudience("community-board-admin")
      .setExpirationTime(expiry)
      .sign(key);
    assert.equal(
      (await request("/api/admin/events", { token: invalid })).status,
      401,
    );
  }
  assert.equal(
    (
      await request("/api/admin/events", {
        token: `${token.slice(0, -8)}tampered`,
      })
    ).status,
    401,
  );
  const event = {
    title: "Phase 2 verification event",
    category: "Music",
    city: "Coimbatore",
    startsAt: new Date(Date.now() + 86400000).toISOString(),
    price: "150000",
    description: "Temporary integration test event.",
    imageUrl: "https://example.com/event.jpg",
  };
  assert.equal(
    (
      await request("/api/admin/events", {
        method: "POST",
        token,
        body: { ...event, price: "-1" },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/api/admin/events", {
        method: "POST",
        token,
        body: { ...event, startsAt: "2020-01-01T00:00:00Z" },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/api/admin/events", {
        method: "POST",
        token,
        headers: { Origin: "https://other.example" },
        body: event,
      })
    ).status,
    403,
  );
  const created = await request("/api/admin/events", {
    method: "POST",
    token,
    body: event,
  });
  assert.equal(created.status, 201);
  const data = (await created.json()).event;
  createdId = data.id;
  assert.equal(data.price, "150000.00");
  assert.equal(typeof data.id, "number");
  assert.equal(typeof user.id, "number");
  assert.equal(
    (
      await request("/api/admin/events/not-an-integer", {
        method: "PATCH",
        token,
        body: { active: false },
      })
    ).status,
    400,
  );
  assert.equal(data.active, true);
  let publicEvents = (await (await request("/api/events")).json()).events;
  assert.ok(publicEvents.some((value) => value.id === createdId));
  assert.ok(
    publicEvents.every((value) => new Date(value.startsAt) >= new Date()),
  );
  assert.ok(!publicEvents.some((value) => [12, 13, 14, 15].includes(value.id)));
  assert.deepEqual(
    publicEvents.map((value) => value.startsAt),
    [...publicEvents.map((value) => value.startsAt)].sort(),
  );
  assert.equal(
    (
      await request(`/api/admin/events/${createdId}`, {
        method: "PATCH",
        cookie,
        body: { active: false },
      })
    ).status,
    200,
  );
  publicEvents = (await (await request("/api/events")).json()).events;
  assert.ok(!publicEvents.some((value) => value.id === createdId));
  assert.equal(
    (await db.event.findUnique({ where: { id: createdId } })).active,
    false,
  );
  assert.equal(
    (
      await request(`/api/admin/events/${createdId}`, {
        method: "PATCH",
        token,
        body: { active: true },
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await request("/api/admin/events/2147483647", {
        method: "PATCH",
        token,
        body: { active: false },
      })
    ).status,
    404,
  );
  const logout = await request("/api/admin/logout", { method: "POST", cookie });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get("set-cookie"), /Max-Age=0/i);
  console.log(
    "PASS: server protection, login, password hashing, cookies, expired/tampered/wrong-role tokens, event validation, creation, persisted status, public visibility, no DELETE API, and logout.",
  );
}
try {
  await main();
} finally {
  // Clean up only the temporary fixture created by this verification run.
  if (createdId) await db.event.delete({ where: { id: createdId } });
  await db.$disconnect();
}
