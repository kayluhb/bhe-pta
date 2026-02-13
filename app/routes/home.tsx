import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Barton Hills Elementary PTA" },
    {
      name: "description",
      content:
        "Barton Hills Elementary PTA — supporting students, teachers, and families in Austin, TX.",
    },
  ];
}

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-heading font-bold text-charcoal">
        Welcome to Barton Hills Elementary PTA
      </h1>
      <p className="mt-4 text-charcoal/70">Coming soon.</p>
    </main>
  );
}
