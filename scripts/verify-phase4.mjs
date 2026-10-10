import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { jwtVerify, SignJWT } from "jose";
const db = new PrismaClient();
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
const users = [];
const events = [];
async function request(
  path,
  { method = "GET", body, token, cookie, headers = {} } = {},
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
async function json(path, options) {
  const response = await request(path, options);
  assert.equal(response.status, 200);
  return response.json();
}
async function signup(email) {
  const response = await request("/api/auth/signup", {
    method: "POST",
    body: { email, password: "VisitorPassword@123" },
  });
  assert.equal(response.status, 201);
  const data = await response.json();
  users.push(data.user.id);
  return { ...data, cookie: response.headers.get("set-cookie").split(";")[0] };
}
async function main() {
  for (const path of ["/api/auth/me", "/api/favourites", "/api/feed"])
    assert.equal((await request(path)).status, 401);
  for (const path of ["/favourites", "/feed"]) {
    const response = await request(path);
    assert.equal(response.status, 307);
    assert.equal(
      new URL(response.headers.get("location"), base).pathname,
      "/login",
    );
  }
  assert.equal(
    (
      await request("/api/favourites", {
        method: "PUT",
        body: { categories: ["Music"] },
      })
    ).status,
    401,
  );
  const email = `phase4-${Date.now()}@example.com`;
  assert.equal(
    (
      await request("/api/auth/signup", {
        method: "POST",
        body: { email, password: "short" },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/api/auth/signup", {
        method: "POST",
        body: { email, password: "VisitorPassword@123", role: "ADMIN" },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/api/auth/signup", {
        method: "POST",
        body: { email: "invalid", password: "VisitorPassword@123" },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/api/auth/signup", {
        method: "POST",
        body: { email, password: "VisitorPassword@123" },
        headers: { Origin: "https://foreign.example" },
      })
    ).status,
    403,
  );
  const first = await signup(email.toUpperCase());
  const second = await signup(`second-${email}`);
  assert.equal(first.user.email, email);
  assert.equal(first.user.role, "USER");
  assert.equal(typeof first.user.id, "number");
  assert.ok(!("passwordHash" in first.user));
  const saved = await db.user.findUnique({ where: { id: first.user.id } });
  assert.match(saved.passwordHash, /^scrypt\$/);
  assert.notEqual(saved.passwordHash, "VisitorPassword@123");
  const key = new TextEncoder().encode(process.env.JWT_SECRET);
  const verified = await jwtVerify(first.token, key, {
    algorithms: ["HS256"],
    issuer: "community-board",
    audience: "community-board-visitor",
  });
  assert.equal(verified.payload.sub, String(first.user.id));
  assert.equal(verified.payload.role, "USER");
  assert.equal(verified.payload.exp - verified.payload.iat, 8 * 60 * 60);
  assert.equal(
    (
      await request("/api/auth/signup", {
        method: "POST",
        body: { email, password: "VisitorPassword@123" },
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await request("/api/auth/login", {
        method: "POST",
        body: { email, password: "wrong" },
      })
    ).status,
    401,
  );
  const login = await request("/api/auth/login", {
    method: "POST",
    body: { email: email.toUpperCase(), password: "VisitorPassword@123" },
  });
  assert.equal(login.status, 200);
  assert.match(login.headers.get("set-cookie"), /HttpOnly/i);
  assert.match(login.headers.get("set-cookie"), /SameSite=strict/i);
  const loginData = await login.json();
  assert.equal(loginData.user.id, first.user.id);
  assert.ok(loginData.token);
  assert.equal(
    (await json("/api/auth/me", { token: first.token })).user.id,
    first.user.id,
  );
  assert.equal(
    (await json("/api/auth/me", { cookie: first.cookie })).user.id,
    first.user.id,
  );
  assert.equal((await request("/feed", { cookie: first.cookie })).status, 200);
  assert.equal(
    (await request("/favourites", { cookie: first.cookie })).status,
    200,
  );
  assert.equal((await request("/login", { cookie: first.cookie })).status, 307);
  assert.deepEqual(
    (await json("/api/favourites", { token: first.token })).categories,
    [],
  );
  const empty = await json("/api/feed", { token: first.token });
  assert.equal(empty.events.length, 0);
  assert.equal(empty.pagination.total, 0);
  assert.deepEqual(empty.categories, []);
  for (const categories of [["Music", "Music"], ["Unknown"], "Music"])
    assert.equal(
      (
        await request("/api/favourites", {
          method: "PUT",
          token: first.token,
          body: { categories },
        })
      ).status,
      400,
    );
  assert.equal(
    (
      await request("/api/favourites", {
        method: "PUT",
        token: first.token,
        body: { categories: ["Music"], userId: second.user.id },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/api/favourites", {
        method: "PUT",
        token: first.token,
        headers: { Origin: "https://foreign.example" },
        body: { categories: ["Music"] },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request("/api/favourites", {
        method: "PUT",
        cookie: first.cookie,
        body: { categories: ["Music", "Food"] },
      })
    ).status,
    200,
  );
  assert.deepEqual(
    new Set((await json("/api/favourites", { token: first.token })).categories),
    new Set(["Music", "Food"]),
  );
  assert.deepEqual(
    (await json("/api/favourites", { token: second.token })).categories,
    [],
  );
  for (const fixture of [
    { category: "Music", active: true, days: 2 },
    { category: "Food", active: true, days: 2 },
    { category: "Sports", active: true, days: 2 },
    { category: "Music", active: false, days: 2 },
    { category: "Food", active: true, days: -2 },
  ]) {
    const created = await db.event.create({
      data: {
        title: "Phase 4 temporary fixture",
        description: "Feed visibility verification.",
        category: fixture.category,
        active: fixture.active,
        startsAt: new Date(Date.now() + fixture.days * 86400000),
        city: "Coimbatore",
        price: 100,
        imageUrl: "https://example.com/event.jpg",
      },
    });
    events.push(created.id);
  }
  const expected = await db.event.findMany({
    where: {
      active: true,
      startsAt: { gte: new Date() },
      category: { in: ["Music", "Food"] },
    },
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
  });
  const feed = await json("/api/feed?pageSize=50", { token: first.token });
  assert.deepEqual(
    feed.events.map((event) => event.id),
    expected.map((event) => event.id),
  );
  assert.ok(feed.events.some((event) => event.id === events[0]));
  assert.ok(feed.events.some((event) => event.id === events[1]));
  assert.ok(!feed.events.some((event) => events.slice(2).includes(event.id)));
  const firstPage = await json("/api/feed?pageSize=1&page=1", {
    token: first.token,
  });
  const secondPage = await json("/api/feed?pageSize=1&page=2", {
    token: first.token,
  });
  assert.notEqual(firstPage.events[0].id, secondPage.events[0].id);
  assert.equal(
    (await request("/api/feed?pageSize=51", { token: first.token })).status,
    400,
  );
  assert.equal(
    (await request("/api/admin/events", { token: first.token })).status,
    401,
  );
  const adminLogin = await json("/api/admin/login", {
    method: "POST",
    body: {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    },
  });
  assert.equal(
    (await request("/api/feed", { token: adminLogin.token })).status,
    401,
  );
  for (const [role, expiry, audience] of [
    ["USER", "-1s", "community-board-visitor"],
    ["ADMIN", "1h", "community-board-visitor"],
    ["USER", "1h", "community-board-admin"],
  ]) {
    const token = await new SignJWT({ role })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(String(first.user.id))
      .setIssuer("community-board")
      .setAudience(audience)
      .setExpirationTime(expiry)
      .sign(key);
    assert.equal((await request("/api/feed", { token })).status, 401);
  }
  assert.equal(
    (
      await request("/api/feed", {
        token: `${first.token.slice(0, -8)}tampered`,
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await request("/api/feed", {
        cookie: first.cookie,
        headers: { Authorization: "Basic invalid" },
      })
    ).status,
    401,
  );
  await request("/api/favourites", {
    method: "PUT",
    token: first.token,
    body: { categories: ["Kids"] },
  });
  assert.deepEqual(
    (await json("/api/favourites", { token: first.token })).categories,
    ["Kids"],
  );
  const concurrent = await Promise.all(
    [["Music"], ["Food"]].map((categories) =>
      request("/api/favourites", {
        method: "PUT",
        token: first.token,
        body: { categories },
      }),
    ),
  );
  assert.ok(concurrent.every((response) => response.status === 200));
  assert.equal(
    (await json("/api/favourites", { token: first.token })).categories.length,
    1,
  );
  await request("/api/favourites", {
    method: "PUT",
    token: first.token,
    body: { categories: [] },
  });
  assert.equal(
    (await json("/api/feed", { token: first.token })).events.length,
    0,
  );
  const logout = await request("/api/auth/logout", {
    method: "POST",
    cookie: first.cookie,
  });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get("set-cookie"), /Max-Age=0/i);
  await db.user.delete({ where: { id: first.user.id } });
  users.splice(users.indexOf(first.user.id), 1);
  assert.equal(
    (await request("/api/feed", { token: first.token })).status,
    401,
  );
  console.log(
    "PASS: signup/login JWT, password hashes, protected pages/APIs, user isolation, saved/replaced/concurrent favourites, feed filtering/pagination, invalid tokens, admin/visitor separation and logout.",
  );
}
try {
  await main();
} finally {
  if (events.length)
    await db.event.deleteMany({ where: { id: { in: events } } });
  if (users.length) await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
}
