import type { PagedProjects } from "./types";

export const demoProjects: PagedProjects = {
  data: [
    {
      id: "demo-project-brand",
      title: "Build a brand identity for a new coffee studio",
      slug: "demo-brand-identity",
      description: "We are looking for a thoughtful designer to shape a warm, memorable identity for an independent coffee studio.",
      budgetMinor: 125000,
      currency: "USD",
      budgetType: "FIXED",
      deadline: null,
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      category: { id: "demo-design", name: "Design & Creative" },
      skills: [{ skill: { id: "demo-branding", name: "Branding", slug: "branding" } }, { skill: { id: "demo-design", name: "Visual Design", slug: "visual-design" } }]
    },
    {
      id: "demo-project-web",
      title: "Design and build a simple portfolio website",
      slug: "demo-portfolio-website",
      description: "Create a polished, responsive portfolio that makes a small architecture practice easy to discover online.",
      budgetMinor: 85000,
      currency: "USD",
      budgetType: "FIXED",
      deadline: null,
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      category: { id: "demo-development", name: "Development" },
      skills: [{ skill: { id: "demo-react", name: "React", slug: "react" } }, { skill: { id: "demo-ux", name: "UX Design", slug: "ux-design" } }]
    },
    {
      id: "demo-project-content",
      title: "Write launch content for a growing product",
      slug: "demo-launch-content",
      description: "Help turn a new product story into clear website copy, launch messages, and a handful of useful customer stories.",
      budgetMinor: 3000000,
      currency: "JPY",
      budgetType: "FIXED",
      deadline: null,
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      category: { id: "demo-writing", name: "Writing & Content" },
      skills: [{ skill: { id: "demo-copy", name: "Copywriting", slug: "copywriting" } }, { skill: { id: "demo-content", name: "Content Strategy", slug: "content-strategy" } }]
    }
  ],
  meta: { page: 1, pageSize: 3, total: 3, pageCount: 1 }
};
