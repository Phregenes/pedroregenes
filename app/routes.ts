import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  route("api/bg-svg", "routes/api.bg-svg.ts"),
  route("bg-svg/:filename", "routes/bg-svg.$filename.ts"),
  layout("layouts/site-layout.tsx", [
    index("routes/home.tsx"),
    route("trabalhos", "routes/work.tsx"),
    route("contato", "routes/contact.tsx"),
  ]),
] satisfies RouteConfig;
