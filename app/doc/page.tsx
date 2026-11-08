
import type { Metadata } from "next";
import SwaggerDocs from "./SwaggerDocs";

export const metadata: Metadata = {
  title: "Documentación API | Services SOA",
  description: "Documentación interactiva de la API",
};

export default function DocPage() {
  return (
    <main className="min-h-screen bg-white">
      <SwaggerDocs />
    </main>
  );
}
