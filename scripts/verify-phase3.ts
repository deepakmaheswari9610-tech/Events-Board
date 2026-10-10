import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { formatDate, formatPrice } from "../src/lib/format";
const db = new PrismaClient();
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
const fixtureIds: number[] = [];
type PublicEvent = {
  id: number;
  title: string;
  description: string;
  category: string;
  city: string;
  startsAt: string;
  price: string;
};
type Listing = {
  events: PublicEvent[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};
async function list(params: Record<string, string> = {}): Promise<Listing> {
  const response = await fetch(
    `${base}/api/events?${new URLSearchParams(params)}`,
  );
  assert.equal(response.status, 200);
  return response.json();
}
async function main() {
  const marker = `phase3-${Date.now()}`;
  const startsAt = new Date(Date.now() + 2 * 86400000);
  const fixtures = [
    {
      title: `${marker} 100% night`,
      description: "A music evening.",
      category: "Music" as const,
      city: "Coimbatore",
      active: true,
      startsAt,
    },
    {
      title: `${marker} under_score night`,
      description: "An acoustic set.",
      category: "Music" as const,
      city: "Coimbatore",
      active: true,
      startsAt,
    },
    {
      title: `${marker} back\\slash`,
      description: "A night of flavours.",
      category: "Food" as const,
      city: "Chennai",
      active: true,
      startsAt,
    },
    {
      title: `${marker} inactive night`,
      description: "Hidden event.",
      category: "Music" as const,
      city: "Coimbatore",
      active: false,
      startsAt,
    },
    {
      title: `${marker} past night`,
      description: "Ended event.",
      category: "Music" as const,
      city: "Coimbatore",
      active: true,
      startsAt: new Date(Date.now() - 86400000),
    },
  ];
  for (const fixture of fixtures) {
    const created = await db.event.create({
      data: {
        ...fixture,
        price: "150000.00",
        imageUrl: "https://example.com/event.jpg",
      },
    });
    fixtureIds.push(created.id);
  }
  const upcoming = await db.event.findMany({
    where: { active: true, startsAt: { gte: new Date() } },
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
  });
  const first = await list();
  assert.equal(first.events.length, Math.min(6, upcoming.length));
  assert.equal(first.pagination.total, upcoming.length);
  assert.ok(
    first.events.every(
      (event) =>
        typeof event.id === "number" && typeof event.price === "string",
    ),
  );
  for (const params of [
    { category: "Music" },
    { city: "Coimbatore" },
    { q: "night" },
    { category: "Music", city: "Coimbatore", q: "night" },
    { category: "Food", city: "Chennai", q: "night" },
    { category: "Kids", city: "Coimbatore", q: marker },
    { q: "NIGHT", city: "coimbatore" },
  ] as Record<string, string>[]) {
    const actual = await list({ ...params, pageSize: "50" });
    const expected = upcoming.filter(
      (event) =>
        (!params.category || event.category === params.category) &&
        (!params.city ||
          event.city.toLowerCase() === params.city.toLowerCase()) &&
        (!params.q ||
          [event.title, event.description, event.city].some((value) =>
            value.toLowerCase().includes(params.q.toLowerCase()),
          )),
    );
    assert.deepEqual(
      actual.events.map((event) => event.id),
      expected.map((event) => event.id),
    );
    assert.equal(actual.pagination.total, expected.length);
  }
  for (const literal of ["%", "_", "\\"]) {
    const data = await list({
      q: `${marker} ${literal === "%" ? "100%" : literal === "_" ? "under_" : "back\\"}`,
      pageSize: "50",
    });
    assert.equal(data.events.length, 1);
  }
  const tiedOne = await list({ q: marker, pageSize: "1", page: "1" });
  const tiedTwo = await list({ q: marker, pageSize: "1", page: "2" });
  assert.equal(tiedOne.events[0].id, fixtureIds[0]);
  assert.equal(tiedTwo.events[0].id, fixtureIds[1]);
  assert.equal(tiedOne.pagination.total, 3);
  const allPages: number[] = [];
  for (let page = 1; page <= Math.ceil(upcoming.length / 3); page++)
    allPages.push(
      ...(await list({ page: String(page), pageSize: "3" })).events.map(
        (event) => event.id,
      ),
    );
  assert.deepEqual(
    allPages,
    upcoming.map((event) => event.id),
  );
  assert.equal(new Set(allPages).size, allPages.length);
  const beyond = await list({ q: marker, pageSize: "1", page: "999" });
  assert.equal(beyond.pagination.page, 3);
  const empty = await list({ q: `${marker}-no-results`, page: "999" });
  assert.equal(empty.events.length, 0);
  assert.equal(empty.pagination.total, 0);
  assert.equal(empty.pagination.totalPages, 0);
  assert.equal(empty.pagination.page, 1);
  for (const query of [
    "page=0",
    "page=-1",
    "page=abc",
    "page=1.2",
    "page=1000001",
    "pageSize=0",
    "pageSize=51",
    "category=Invalid",
    `q=${"a".repeat(201)}`,
  ])
    assert.equal((await fetch(`${base}/api/events?${query}`)).status, 400);
  const optionsResponse = await fetch(`${base}/api/events/options`);
  assert.equal(optionsResponse.status, 200);
  const options = await optionsResponse.json();
  assert.deepEqual(options.categories, [
    "Music",
    "Workshop",
    "Food",
    "Sports",
    "Kids",
  ]);
  assert.ok(options.cities.includes("Coimbatore"));
  assert.equal(new Set(options.cities).size, options.cities.length);
  const detailResponse = await fetch(`${base}/api/events/${fixtureIds[0]}`);
  assert.equal(detailResponse.status, 200);
  const detail = (await detailResponse.json()).event;
  assert.equal(detail.id, fixtureIds[0]);
  assert.equal(detail.price, "150000.00");
  for (const id of [fixtureIds[3], fixtureIds[4], 2147483647])
    assert.equal((await fetch(`${base}/api/events/${id}`)).status, 404);
  for (const id of ["abc", "0", "1.2", "2147483648"])
    assert.equal((await fetch(`${base}/api/events/${id}`)).status, 400);
  assert.equal((await fetch(`${base}/events/${fixtureIds[0]}`)).status, 200);
  assert.equal((await fetch(`${base}/events/not-an-id`)).status, 404);
  assert.equal(formatPrice(150000), "₹1,50,000");
  assert.equal(formatPrice(0), "Free");
  const formattedDate = formatDate("2026-10-18T13:00:00Z");
  assert.match(formattedDate, /18 Oct/);
  assert.match(formattedDate, /6:30 pm/i);
  console.log(
    "PASS: combined filters, case-insensitive/literal search, tied-date ordering, pagination without duplicates, page clamping, empty results, query validation, city options, detail visibility, numeric IDs and Indian formatting.",
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (fixtureIds.length)
      await db.event.deleteMany({ where: { id: { in: fixtureIds } } });
    await db.$disconnect();
  });
