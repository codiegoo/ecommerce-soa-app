import type { Metadata } from "next";
import SwaggerDocs from "./SwaggerDocs";

export const metadata: Metadata = {
  title: "Documentación API | Services SOA",
  description: "Documentación interactiva de la API",
};

export default function DocPage() {
  return (
    <main>
      <SwaggerDocs />
    </main>
  );
}