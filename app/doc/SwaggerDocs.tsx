
"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

import { openApiSpec } from "@/src/lib/openapi";

export default function SwaggerDocs() {
  return (
    <div className="swagger-container">
      <SwaggerUI
        spec={openApiSpec}
        docExpansion="list"
        defaultModelsExpandDepth={2}
        displayRequestDuration
        persistAuthorization
      />
    </div>
  );
}
