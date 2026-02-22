import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "BHE PTA" },
    { name: "description", content: "Boise Heights Elementary PTA" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return { message: "Welcome to BHE PTA" };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <Welcome message={loaderData.message} />;
}
