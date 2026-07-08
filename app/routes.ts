import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("layouts/site-layout.tsx", [
    index("routes/home.tsx"),
    route("trabalhos", "routes/work.tsx"),
    route("contato", "routes/contact.tsx"),
  ]),
] satisfies RouteConfig;
