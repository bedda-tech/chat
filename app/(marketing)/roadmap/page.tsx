import type { Metadata } from "next";
import { RoadmapView } from "@/components/roadmap-view";

export const metadata: Metadata = {
  title: "Roadmap | bedda.ai",
  description:
    "See what we're building for the future of AI chat - our product roadmap includes advanced AI capabilities, enterprise integrations, and cutting-edge features.",
  openGraph: {
    title: "Product Roadmap | bedda.ai",
    description:
      "Our vision for transforming AI chat into a comprehensive productivity platform",
    type: "website",
  },
};

export default function RoadmapPage() {
  return (
    <div className="container py-12 md:py-16">
      <RoadmapView />
    </div>
  );
}
