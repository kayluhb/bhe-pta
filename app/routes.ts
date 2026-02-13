import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("./routes/home.tsx"),
  route("about", "./routes/about.tsx"),
  route("news", "./routes/news.tsx"),
  route("events", "./routes/events.tsx"),
  route("get-involved", "./routes/get-involved.tsx"),
  route("programs", "./routes/programs.tsx"),
  route("parents", "./routes/parents.tsx"),
  route("sponsors", "./routes/sponsors.tsx"),
  route("contact", "./routes/contact.tsx"),
] satisfies RouteConfig;
