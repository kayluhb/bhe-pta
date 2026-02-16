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
  route("dev/sync-calendar", "./routes/dev.sync-calendar.tsx"),
  route("reimbursement", "./routes/reimbursement.tsx"),
  route("pay-me", "./routes/pay-me.tsx"),
  route("reimbursement/success", "./routes/reimbursement.success.tsx"),
  route("api/reimbursement/submit", "./routes/api.reimbursement.submit.ts"),
  route("api/reimbursement/upload-presign", "./routes/api.reimbursement.upload-presign.ts"),
  route("api/reimbursement/upload-mock", "./routes/api.reimbursement.upload-mock.ts"),
  route("api/reimbursement/pdf", "./routes/api.reimbursement.pdf.ts"),
] satisfies RouteConfig;
