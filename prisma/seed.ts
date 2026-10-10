import { Category, PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const samples: [
  string,
  Category,
  string,
  number,
  string,
  number,
  boolean,
  string,
][] = [
  [
    "Acoustic nights under the stars",
    "Music",
    "Coimbatore",
    2,
    "18:30",
    499,
    true,
    "An easy evening of live acoustic music and familiar faces.",
  ],
  [
    "Clay, coffee & a little creativity",
    "Workshop",
    "Chennai",
    3,
    "10:00",
    1200,
    true,
    "Shape your first ceramic bowl in a relaxed pottery workshop.",
  ],
  [
    "The weekend street food fair",
    "Food",
    "Bengaluru",
    4,
    "16:00",
    0,
    true,
    "Local favourites, fresh flavours and a whole lot to taste.",
  ],
  [
    "Sunday morning community run",
    "Sports",
    "Coimbatore",
    5,
    "06:30",
    0,
    true,
    "A friendly five-kilometre run for every pace and experience.",
  ],
  [
    "Little makers: paper & colour",
    "Kids",
    "Chennai",
    6,
    "11:00",
    350,
    true,
    "A colourful craft morning for children and their grown-ups.",
  ],
  [
    "Jazz night at the courtyard",
    "Music",
    "Chennai",
    7,
    "19:00",
    750,
    true,
    "A local jazz trio brings warm sounds to an open courtyard.",
  ],
  [
    "Garden to table cooking",
    "Workshop",
    "Bengaluru",
    8,
    "10:30",
    1800,
    true,
    "Learn a seasonal vegetarian menu with a neighbourhood chef.",
  ],
  [
    "Flavours of Kongu",
    "Food",
    "Coimbatore",
    9,
    "12:00",
    650,
    true,
    "Discover traditional recipes and meet the people behind them.",
  ],
  [
    "Badminton doubles morning",
    "Sports",
    "Chennai",
    10,
    "07:00",
    250,
    true,
    "Bring a racket and make a new doubles partner.",
  ],
  [
    "Storytime in the park",
    "Kids",
    "Bengaluru",
    11,
    "09:30",
    0,
    true,
    "Stories, imagination and outdoor fun for little listeners.",
  ],
  [
    "Community music celebration",
    "Music",
    "Bengaluru",
    14,
    "18:00",
    150000,
    true,
    "A premium group package for a community music celebration.",
  ],
  [
    "Watercolour weekend",
    "Workshop",
    "Coimbatore",
    12,
    "14:00",
    900,
    false,
    "Explore colour and light in a beginner-friendly art session.",
  ],
  [
    "The neighbourhood bake sale",
    "Food",
    "Chennai",
    13,
    "15:00",
    100,
    false,
    "Meet local bakers over homemade treats.",
  ],
  [
    "Last weekend’s football meetup",
    "Sports",
    "Bengaluru",
    -5,
    "17:00",
    200,
    true,
    "A friendly football match for local players.",
  ],
  [
    "Last month’s puppet show",
    "Kids",
    "Coimbatore",
    -20,
    "16:30",
    300,
    false,
    "An afternoon of playful puppets and stories.",
  ],
];
const photos: Record<Category, string> = {
  Music: "photo-1516280440614-37939bbacd81",
  Workshop: "photo-1455390582262-044cdead277a",
  Food: "photo-1504674900247-0877df9cc836",
  Sports: "photo-1461896836934-ffe607ba8211",
  Kids: "photo-1503454537195-1dcabb73ffb9",
};
async function main() {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  await db.$transaction(
    samples.map(([title, category, city, days, time, price, active], index) => {
      const startsAt = new Date(`${today}T${time}:00+05:30`);
      startsAt.setUTCDate(startsAt.getUTCDate() + days);
      const data = {
        title,
        category,
        city,
        startsAt,
        price,
        active,
        description: samples[index][7],
        imageUrl: `https://images.unsplash.com/${photos[category]}?auto=format&fit=crop&w=900&q=80`,
      };
      return db.event.upsert({
        where: { id: index + 1 },
        create: { id: index + 1, ...data },
        update: data,
      });
    }),
  );
  console.log(
    "Seeded 15 events: 11 active upcoming, 2 inactive upcoming, and 2 past. Dates are relative to today in IST.",
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
