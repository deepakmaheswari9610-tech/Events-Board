import { notFound } from "next/navigation";
import { EventDetail } from "@/components/events/event-detail";
export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (
    !/^[1-9]\d*$/.test(id) ||
    !Number.isSafeInteger(Number(id)) ||
    Number(id) > 2147483647
  )
    notFound();
  return (
    <main className="event-detail-main">
      <EventDetail id={Number(id)} />
    </main>
  );
}
