import type { OpenAPIV3 } from "openapi-types";

const json = (schema: OpenAPIV3.SchemaObject) => ({
  "application/json": { schema },
});

const ref = (name: string): OpenAPIV3.ReferenceObject => ({
  $ref: `#/components/schemas/${name}`,
});

const response = (
  description: string,
  schema?: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject
): OpenAPIV3.ResponseObject => ({
  description,
  ...(schema ? { content: json(schema as OpenAPIV3.SchemaObject) } : {}),
});

const body = (
  schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
  required = true
): OpenAPIV3.RequestBodyObject => ({
  required,
  content: {
    "application/json": {
      schema: schema as OpenAPIV3.SchemaObject,
    },
  },
});

const idParam: OpenAPIV3.ParameterObject = {
  name: "id",
  in: "path",
  required: true,
  description: "Identificador del registro.",
  schema: { type: "integer", example: 1 },
};

const auth = [{ sessionCookie: [] }];

const protectedOperation = (
  summary: string,
  description: string,
  responses: OpenAPIV3.ResponsesObject,
  extra: Partial<OpenAPIV3.OperationObject> = {}
): OpenAPIV3.OperationObject => ({
  summary,
  description,
  security: auth,
  responses: {
    "401": response("No autenticado.", ref("Error")),
    "500": response("Error interno del servidor.", ref("Error")),
    ...responses,
  },
  ...extra,
});

const collection = (
  tag: string,
  resource: string,
  schema: string,
  createSchema?: string
): OpenAPIV3.PathItemObject => ({
  get: protectedOperation(
    `Listar ${resource}`,
    `Obtiene los registros de ${resource}. El resultado exacto depende de la implementación del endpoint.`,
    {
      "200": response(`Listado de ${resource}.`, {
        type: "object",
        properties: {
          [resource]: { type: "array", items: ref(schema) },
        },
      }),
    },
    { tags: [tag] }
  ),
  post: protectedOperation(
    `Crear ${resource}`,
    `Crea un registro de ${resource}.`,
    {
      "201": response("Registro creado correctamente.", ref(schema)),
      "400": response("Datos de entrada inválidos.", ref("Error")),
    },
    {
      tags: [tag],
      requestBody: body(ref(createSchema || schema)),
    }
  ),
});

const item = (
  tag: string,
  resource: string,
  schema: string,
  updateSchema?: string
): OpenAPIV3.PathItemObject => ({
  get: protectedOperation(
    `Obtener ${resource}`,
    `Obtiene un registro de ${resource} por su identificador.`,
    {
      "200": response("Registro encontrado.", ref(schema)),
      "404": response("Registro no encontrado.", ref("Error")),
    },
    { tags: [tag], parameters: [idParam] }
  ),
  put: protectedOperation(
    `Actualizar ${resource}`,
    `Actualiza un registro de ${resource}.`,
    {
      "200": response("Registro actualizado.", ref(schema)),
      "400": response("Datos inválidos.", ref("Error")),
      "404": response("Registro no encontrado.", ref("Error")),
    },
    {
      tags: [tag],
      parameters: [idParam],
      requestBody: body(ref(updateSchema || schema)),
    }
  ),
  delete: protectedOperation(
    `Eliminar ${resource}`,
    `Elimina un registro de ${resource}, sujeto a sus relaciones y restricciones de integridad.`,
    {
      "200": response("Registro eliminado."),
      "204": response("Registro eliminado sin contenido."),
      "404": response("Registro no encontrado.", ref("Error")),
      "409": response("No se puede eliminar por restricciones de integridad.", ref("Error")),
    },
    { tags: [tag], parameters: [idParam] }
  ),
});

const patchItem = (
  tag: string,
  resource: string,
  schema: string,
  updateSchema?: string
): OpenAPIV3.PathItemObject => ({
  get: (item(tag, resource, schema) as OpenAPIV3.PathItemObject).get,
  patch: protectedOperation(
    `Actualizar parcialmente ${resource}`,
    `Actualiza parcialmente un registro de ${resource}.`,
    {
      "200": response("Registro actualizado.", ref(schema)),
      "400": response("Datos inválidos.", ref("Error")),
      "404": response("Registro no encontrado.", ref("Error")),
    },
    {
      tags: [tag],
      parameters: [idParam],
      requestBody: body(ref(updateSchema || schema)),
    }
  ),
});

const objectSchema = (
  properties: OpenAPIV3.SchemaObject["properties"],
  required: string[] = []
): OpenAPIV3.SchemaObject => ({
  type: "object",
  properties,
  ...(required.length ? { required } : {}),
});

const integer = (example = 1): OpenAPIV3.SchemaObject => ({
  type: "integer",
  example,
});
const money = (example = 125.5): OpenAPIV3.SchemaObject => ({
  type: "number",
  format: "double",
  example,
});
const text = (example = "Ejemplo"): OpenAPIV3.SchemaObject => ({
  type: "string",
  example,
});

const schemas: Record<string, OpenAPIV3.SchemaObject> = {
  Error: objectSchema({
    error: text("No autorizado"),
    message: text("Descripción del error"),
  }),

  Usuario: objectSchema({
    id: integer(),
    nombre: text("Juan Pérez"),
    correo: { type: "string", format: "email", example: "juan@correo.com" },
    telefono: text("5512345678"),
    id_rol: integer(2),
    estado: text("Activo"),
  }, ["nombre", "correo", "telefono", "id_rol", "estado"]),
  UsuarioCreate: objectSchema({
    nombre: text("Juan Pérez"),
    correo: { type: "string", format: "email", example: "juan@correo.com" },
    telefono: text("5512345678"),
    password: text("ContraseñaSegura123"),
    id_rol: integer(2),
    estado: text("Activo"),
  }, ["nombre", "correo", "telefono", "password", "id_rol", "estado"]),
  Login: objectSchema({
    correo: { type: "string", format: "email", example: "juan@correo.com" },
    password: text("ContraseñaSegura123"),
  }, ["correo", "password"]),
  Registro: objectSchema({
    nombre: text("Juan Pérez"),
    correo: { type: "string", format: "email", example: "juan@correo.com" },
    telefono: text("5512345678"),
    password: text("ContraseñaSegura123"),
    direccion: text("Av. Reforma 100"),
    rfc: text("XAXX010101000"),
  }, ["nombre", "correo", "telefono", "password", "direccion", "rfc"]),
  RecuperarPassword: objectSchema({
    correo: { type: "string", format: "email", example: "juan@correo.com" },
  }, ["correo"]),
  RestablecerPassword: objectSchema({
    token: text("token-de-recuperacion"),
    password: text("NuevaContraseña123"),
  }, ["token", "password"]),

  Rol: objectSchema({ id: integer(), nombre_rol: text("Administrador") }, ["nombre_rol"]),
  Cliente: objectSchema({
    id: integer(), id_usuario: integer(5), direccion: text("Av. Reforma 100"),
    rfc: text("XAXX010101000"),
  }, ["id_usuario", "direccion", "rfc"]),
  Direccion: objectSchema({
    id: integer(), id_cliente: integer(10), colonia: text("Centro"),
    codigo_postal: text("06000"),
  }, ["id_cliente", "colonia", "codigo_postal"]),
  Proveedor: objectSchema({
    id: integer(), nombre: text("Proveedor"),
    razon_social: text("Proveedor S.A. de C.V."), rfc: text("ABC010101AA1"),
  }, ["nombre", "razon_social", "rfc"]),
  Producto: objectSchema({
    id: integer(), nombre: text("Traje clásico"),
    lote: text("L-2026-01"), serie: text("SER-001"),
    caducidad: { type: "string", format: "date", example: "2027-12-31" },
    id_proveedor: integer(1), costo: money(1200), precio: money(1999.99),
  }, ["nombre", "lote", "serie", "caducidad", "id_proveedor", "costo", "precio"]),
  Stock: objectSchema({
    id_producto: integer(15), stock_actual: integer(20),
    stock_minimo: integer(5), stock_maximo: integer(100),
  }, ["id_producto", "stock_actual", "stock_minimo", "stock_maximo"]),
  Carrito: objectSchema({
    id: integer(), id_cliente: integer(10), estado: text("Activo"),
  }, ["id_cliente", "estado"]),
  DetalleCarrito: objectSchema({
    id: integer(), id_carrito: integer(), id_producto: integer(15),
    cantidad: integer(2), nombre: text("Traje clásico"),
    precio: money(1999.99), stock_actual: integer(20), subtotal: money(3999.98),
  }, ["id_carrito", "id_producto", "cantidad"]),
  Compra: objectSchema({
    id: integer(), id_proveedor: integer(), id_usuario: integer(),
    fecha: { type: "string", format: "date", example: "2026-11-07" },
    total: money(5000),
  }, ["id_proveedor", "id_usuario", "fecha", "total"]),
  DetalleCompra: objectSchema({
    id: integer(), id_compra: integer(), id_producto: integer(),
    cantidad: integer(3), costo_unitario: money(1200),
  }, ["id_compra", "id_producto", "cantidad", "costo_unitario"]),
  Pedido: objectSchema({
    id: integer(), id_carrito: integer(), id_cliente: integer(),
    id_direccion: integer(), id_tipo_pago: integer(), id_tarjeta: integer(),
    estado: text("Pendiente"), total: money(3999.98),
    stripe_checkout_session_id: text("cs_test_..."),
    stripe_payment_intent_id: text("pi_..."),
  }, ["id_carrito", "id_cliente", "id_direccion", "id_tipo_pago", "estado"]),
  DetallePedido: objectSchema({
    id: integer(), id_pedido: integer(), id_producto: integer(),
    cantidad: integer(2), precio_unitario: money(1999.99),
  }, ["id_pedido", "id_producto", "cantidad", "precio_unitario"]),
  Venta: objectSchema({
    id: integer(), id_pedido: integer(), id_cliente: integer(),
    fecha: { type: "string", format: "date", example: "2026-11-07" },
    total: money(3999.98),
  }, ["id_pedido", "id_cliente", "fecha", "total"]),
  DetalleVenta: objectSchema({
    id: integer(), id_pedido: integer(), id_producto: integer(),
    cantidad: integer(2), precio_unitario: money(1999.99),
  }, ["id_pedido", "id_producto", "cantidad", "precio_unitario"]),
  TipoPago: objectSchema({ id: integer(), nombre: text("Stripe") }, ["nombre"]),
  Tarjeta: objectSchema({
    id: integer(), id_cliente: integer(), token_pago: text("tok_..."),
    ultimos_digitos: text("4242"),
  }, ["id_cliente", "token_pago", "ultimos_digitos"]),
  Resena: objectSchema({
    id: integer(), id_producto: integer(), id_cliente: integer(),
    calificacion: integer(5), comentario: text("Excelente producto"),
  }, ["id_producto", "id_cliente", "calificacion", "comentario"]),
  DevolucionCompra: objectSchema({
    id: integer(), id_compra: integer(), id_producto: integer(), cantidad: integer(1),
  }, ["id_compra", "id_producto", "cantidad"]),
  DevolucionVenta: objectSchema({
    id: integer(), id_venta: integer(), id_producto: integer(),
    cantidad: integer(1), estado: text("Solicitada"),
  }, ["id_venta", "id_producto", "cantidad", "estado"]),
  Garantia: objectSchema({
    id: integer(), id_venta: integer(), id_producto: integer(), estado: text("Activa"),
  }, ["id_venta", "id_producto", "estado"]),
  Envio: objectSchema({
    id: integer(), id_venta: integer(), id_direccion: integer(),
    num_guia: text("GUIA123456"), estado: text("En preparación"),
  }, ["id_venta", "id_direccion", "num_guia", "estado"]),
  ValidacionEntrega: objectSchema({
    id: integer(), id_envio: integer(),
    fecha_entrega_real: { type: "string", format: "date-time", example: "2026-11-07T15:30:00Z" },
    estado: text("Entregado"),
  }, ["id_envio", "fecha_entrega_real", "estado"]),
  Comprobante: objectSchema({
    id: integer(), id_venta: integer(), folio: text("FAC-00001"),
    enviado_correo: { type: "boolean", example: false },
  }, ["id_venta", "folio", "enviado_correo"]),
  TokenRecuperacion: objectSchema({
    id: integer(), id_usuario: integer(), token: text("hash-del-token"),
    fecha_expiracion: { type: "string", format: "date-time" },
    usado: { type: "boolean", example: false },
  }, ["id_usuario", "token", "fecha_expiracion", "usado"]),
};

const listResponse = (name: string, schema: string) =>
  response("Listado obtenido correctamente.", {
    type: "object",
    properties: { [name]: { type: "array", items: ref(schema) } },
  });

export const openApiSpec: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    title: "Services SOA API",
    description:
      "Documentación de la API de Services SOA. La autenticación de rutas privadas se realiza mediante la cookie de sesión HttpOnly llamada 'session'. Los esquemas representan las tablas compartidas por el proyecto; los formatos de respuesta de cada ruta deben coincidir con su implementación.",
    version: "1.0.0",
    contact: { name: "API Support" },
  },
  servers: [{ url: "/", description: "Servidor actual" }],
  tags: [
    { name: "Autenticación", description: "Registro, inicio/cierre de sesión y recuperación de contraseña." },
    { name: "Usuarios", description: "Administración de usuarios." },
    { name: "Roles", description: "Consulta de roles." },
    { name: "Clientes", description: "Perfiles de clientes." },
    { name: "Direcciones", description: "Direcciones de entrega de clientes." },
    { name: "Productos", description: "Catálogo y consulta de productos." },
    { name: "Proveedores", description: "Administración de proveedores." },
    { name: "Inventario", description: "Existencias y niveles de stock." },
    { name: "Carrito", description: "Administración del carrito y sus partidas." },
    { name: "Pedidos", description: "Pedidos y cancelaciones." },
    { name: "Checkout", description: "Creación de sesiones de pago." },
    { name: "Pagos", description: "Consulta y gestión de pagos." },
    { name: "Stripe Webhooks", description: "Notificaciones de eventos de Stripe." },
    { name: "Compras", description: "Compras a proveedores." },
    { name: "Devoluciones", description: "Devoluciones de compras y ventas." },
    { name: "Ventas", description: "Ventas generadas a partir de pedidos." },
    { name: "Reseñas", description: "Opiniones y calificaciones de productos." },
    { name: "Tarjetas", description: "Métodos de pago tokenizados." },
    { name: "Envíos", description: "Guías y seguimiento de envíos." },
    { name: "Entregas", description: "Validación de entregas." },
    { name: "Garantías", description: "Garantías de productos vendidos." },
    { name: "Comprobantes", description: "Comprobantes asociados a ventas." },
  ],
  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "session",
        description: "Cookie JWT de sesión. Se establece al iniciar sesión o registrarse.",
      },
    },
    schemas,
  },
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Autenticación"], summary: "Registrar usuario y cliente",
        description: "Registra una cuenta y su perfil de cliente. Según la implementación, puede iniciar sesión al finalizar.",
        requestBody: body(ref("Registro")),
        responses: {
          "201": response("Usuario registrado.", ref("Usuario")),
          "400": response("Datos inválidos o correo ya registrado.", ref("Error")),
          "500": response("Error interno.", ref("Error")),
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Autenticación"], summary: "Iniciar sesión",
        description: "Valida las credenciales y establece la cookie de sesión.",
        requestBody: body(ref("Login")),
        responses: {
          "200": response("Sesión iniciada.", objectSchema({ success: { type: "boolean", example: true }, user: ref("Usuario") })),
          "401": response("Credenciales incorrectas.", ref("Error")),
          "500": response("Error interno.", ref("Error")),
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Autenticación"], summary: "Cerrar sesión",
        description: "Elimina o invalida la cookie de sesión.",
        security: auth,
        responses: { "200": response("Sesión cerrada."), "500": response("Error interno.", ref("Error")) },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Autenticación"], summary: "Consultar sesión actual",
        description: "Devuelve los datos del usuario autenticado.",
        security: auth,
        responses: {
          "200": response("Sesión y usuario actual.", ref("Usuario")),
          "401": response("No hay sesión válida.", ref("Error")),
        },
      },
    },
    "/api/auth/forgot-password": {
      post: {
        tags: ["Autenticación"], summary: "Solicitar recuperación de contraseña",
        description: "Genera un token de recuperación y envía el enlace al correo registrado.",
        requestBody: body(ref("RecuperarPassword")),
        responses: { "200": response("Solicitud procesada."), "400": response("Solicitud inválida.", ref("Error")) },
      },
    },
    "/api/auth/reset-password": {
      post: {
        tags: ["Autenticación"], summary: "Restablecer contraseña",
        description: "Valida el token de recuperación y actualiza la contraseña.",
        requestBody: body(ref("RestablecerPassword")),
        responses: { "200": response("Contraseña actualizada."), "400": response("Token inválido, usado o expirado.", ref("Error")) },
      },
    },

    "/api/users": collection("Usuarios", "usuarios", "Usuario", "UsuarioCreate"),
    "/api/users/{id}": item("Usuarios", "usuario", "Usuario", "UsuarioCreate"),
    "/api/roles": {
      get: protectedOperation("Listar roles", "Obtiene los roles disponibles.", {
        "200": listResponse("roles", "Rol"),
      }, { tags: ["Roles"] }),
    },
    "/api/clientes": collection("Clientes", "clientes", "Cliente"),
    "/api/clientes/{id}": item("Clientes", "cliente", "Cliente"),
    "/api/direcciones": collection("Direcciones", "direcciones", "Direccion"),
    "/api/direcciones/{id}": item("Direcciones", "dirección", "Direccion"),

    "/api/productos": collection("Productos", "productos", "Producto"),
    "/api/productos/{id}": {
      get: {
        tags: ["Productos"], summary: "Obtener producto por ID",
        parameters: [idParam],
        responses: {
          "200": response("Producto encontrado.", objectSchema({ producto: ref("Producto"), stock: ref("Stock") })),
          "404": response("Producto no encontrado.", ref("Error")),
          "500": response("Error interno.", ref("Error")),
        },
      },
      put: protectedOperation("Actualizar producto", "Actualiza los datos de un producto.", {
        "200": response("Producto actualizado.", ref("Producto")),
        "404": response("Producto no encontrado.", ref("Error")),
      }, { tags: ["Productos"], parameters: [idParam], requestBody: body(ref("Producto")) }),
      delete: protectedOperation("Eliminar producto", "Elimina un producto si sus relaciones lo permiten.", {
        "200": response("Producto eliminado."),
        "409": response("El producto está relacionado con otros registros.", ref("Error")),
      }, { tags: ["Productos"], parameters: [idParam] }),
    },
    "/api/productos/categorias": {
      get: {
        tags: ["Productos"], summary: "Consultar categorías de productos",
        description: "La estructura de base de datos compartida no contiene una tabla de categorías; la respuesta depende de la lógica del endpoint.",
        responses: { "200": response("Categorías obtenidas.", { type: "array", items: { type: "object", additionalProperties: true } }) },
      },
    },
    "/api/proveedores": collection("Proveedores", "proveedores", "Proveedor"),
    "/api/proveedores/{id}": item("Proveedores", "proveedor", "Proveedor"),
    "/api/inventario": {
      get: protectedOperation("Consultar inventario", "Obtiene existencias de productos.", {
        "200": listResponse("inventario", "Stock"),
      }, { tags: ["Inventario"] }),
      post: protectedOperation("Registrar o ajustar inventario", "Crea o actualiza existencias de un producto.", {
        "200": response("Inventario actualizado.", ref("Stock")),
        "201": response("Inventario creado.", ref("Stock")),
      }, { tags: ["Inventario"], requestBody: body(ref("Stock")) }),
    },
    "/api/inventario/{id}": {
      get: protectedOperation("Consultar stock de producto", "Obtiene las existencias de un producto.", {
        "200": response("Existencias encontradas.", ref("Stock")),
        "404": response("No existe inventario para el producto.", ref("Error")),
      }, { tags: ["Inventario"], parameters: [idParam] }),
      patch: protectedOperation("Actualizar stock", "Actualiza niveles de existencias.", {
        "200": response("Stock actualizado.", ref("Stock")),
        "404": response("Producto no encontrado.", ref("Error")),
      }, { tags: ["Inventario"], parameters: [idParam], requestBody: body(ref("Stock")) }),
    },

    "/api/carrito": {
      get: protectedOperation("Obtener carrito activo", "Obtiene el carrito activo del cliente autenticado y sus partidas.", {
        "200": response("Carrito obtenido.", objectSchema({
          carrito: ref("Carrito"),
          detalles: { type: "array", items: ref("DetalleCarrito") },
          total: money(3999.98),
        })),
        "404": response("No existe un perfil de cliente.", ref("Error")),
      }, { tags: ["Carrito"] }),
    },
    "/api/carrito/agregar": {
      post: protectedOperation("Agregar producto al carrito", "Agrega un producto o incrementa su cantidad en el carrito activo.", {
        "200": response("Producto agregado o cantidad actualizada.", ref("DetalleCarrito")),
        "400": response("Cantidad o producto inválido.", ref("Error")),
        "409": response("Stock insuficiente.", ref("Error")),
      }, {
        tags: ["Carrito"],
        requestBody: body(objectSchema({ idProducto: integer(15), cantidad: integer(1) }, ["idProducto", "cantidad"])),
      }),
    },
    "/api/carrito/actualizar": {
      patch: protectedOperation("Actualizar cantidad del carrito", "Actualiza la cantidad de una partida del carrito.", {
        "200": response("Partida actualizada.", ref("DetalleCarrito")),
        "404": response("Partida no encontrada.", ref("Error")),
        "409": response("Stock insuficiente.", ref("Error")),
      }, {
        tags: ["Carrito"],
        requestBody: body(objectSchema({ idDetalle: integer(), cantidad: integer(2) }, ["idDetalle", "cantidad"])),
      }),
    },
    "/api/carrito/eliminar": {
      delete: protectedOperation("Eliminar producto del carrito", "Elimina una partida del carrito del cliente autenticado.", {
        "200": response("Partida eliminada."),
        "404": response("Partida no encontrada.", ref("Error")),
      }, {
        tags: ["Carrito"],
        requestBody: body(objectSchema({ idDetalle: integer() }, ["idDetalle"])),
      }),
    },

    "/api/checkout": {
      post: protectedOperation("Crear sesión de checkout", "Valida el carrito, la dirección guardada del cliente y crea una sesión de Stripe en MXN. El servidor debe calcular los importes; nunca se debe confiar en totales enviados por el navegador.", {
        "200": response("Sesión de checkout creada.", objectSchema({
          url: { type: "string", format: "uri", example: "https://checkout.stripe.com/..." },
          sessionId: text("cs_test_..."),
        })),
        "400": response("Carrito o dirección inválidos.", ref("Error")),
        "409": response("Stock insuficiente.", ref("Error")),
      }, {
        tags: ["Checkout"],
        requestBody: body(objectSchema({ idDireccion: integer(3) }, ["idDireccion"])),
      }),
    },
    "/api/webhooks/stripe": {
      post: {
        tags: ["Stripe Webhooks"], summary: "Recibir eventos de Stripe",
        description: "Endpoint servidor-a-servidor. Verifica la firma Stripe-Signature usando el cuerpo original de la solicitud y procesa eventos de pago de forma idempotente. No utiliza la cookie de sesión.",
        parameters: [{
          name: "Stripe-Signature", in: "header", required: true,
          schema: { type: "string", example: "t=...,v1=..." },
          description: "Firma enviada por Stripe.",
        }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", additionalProperties: true, example: { id: "evt_123", type: "checkout.session.completed" } } } },
        },
        responses: {
          "200": response("Evento recibido y procesado."),
          "400": response("Firma o evento inválido.", ref("Error")),
          "500": response("Error al procesar el evento; Stripe puede reintentar.", ref("Error")),
        },
      },
    },
    "/api/pagos": {
      get: protectedOperation("Consultar pagos", "Consulta pagos asociados al usuario o a sus pedidos, según los permisos implementados.", {
        "200": response("Pagos consultados.", { type: "array", items: { type: "object", additionalProperties: true } }),
      }, { tags: ["Pagos"] }),
      post: protectedOperation("Registrar pago", "Registra o inicia un pago según el proveedor configurado. Para Stripe, la confirmación definitiva debe realizarse mediante webhook.", {
        "200": response("Operación de pago procesada.", { type: "object", additionalProperties: true }),
        "400": response("Datos de pago inválidos.", ref("Error")),
      }, { tags: ["Pagos"], requestBody: body(objectSchema({ id_pedido: integer(), id_tipo_pago: integer() }, ["id_pedido", "id_tipo_pago"])) }),
    },

    "/api/pedidos": collection("Pedidos", "pedidos", "Pedido"),
    "/api/pedidos/{id}": patchItem("Pedidos", "pedido", "Pedido"),
    "/api/pedidos/cancelar": {
      post: protectedOperation("Cancelar pedido", "Solicita la cancelación de un pedido. La política de cancelación depende de su estado y pago.", {
        "200": response("Pedido cancelado o solicitud registrada.", ref("Pedido")),
        "400": response("El pedido no se puede cancelar.", ref("Error")),
        "404": response("Pedido no encontrado.", ref("Error")),
      }, { tags: ["Pedidos"], requestBody: body(objectSchema({ idPedido: integer(), motivo: text("Solicitud del cliente") }, ["idPedido"])) }),
    },

    "/api/compras": collection("Compras", "compras", "Compra"),
    "/api/compras/{id}": item("Compras", "compra", "Compra"),
    "/api/devoluciones": {
      get: protectedOperation("Listar devoluciones", "Consulta las devoluciones disponibles para el usuario autorizado.", {
        "200": response("Devoluciones consultadas.", { type: "array", items: { type: "object", additionalProperties: true } }),
      }, { tags: ["Devoluciones"] }),
    },
    "/api/devoluciones/compras": {
      post: protectedOperation("Registrar devolución de compra", "Registra la devolución de productos de una compra a proveedor.", {
        "201": response("Devolución de compra registrada.", ref("DevolucionCompra")),
        "400": response("Datos inválidos.", ref("Error")),
      }, {
        tags: ["Devoluciones"],
        requestBody: body(objectSchema({ id_compra: integer(), id_producto: integer(), cantidad: integer(1) }, ["id_compra", "id_producto", "cantidad"])),
      }),
    },
    "/api/devoluciones/ventas": {
      post: protectedOperation("Solicitar devolución de venta", "Registra una solicitud de devolución de productos vendidos.", {
        "201": response("Devolución de venta registrada.", ref("DevolucionVenta")),
        "400": response("Datos inválidos.", ref("Error")),
      }, {
        tags: ["Devoluciones"],
        requestBody: body(objectSchema({ id_venta: integer(), id_producto: integer(), cantidad: integer(1) }, ["id_venta", "id_producto", "cantidad"])),
      }),
    },

    "/api/ventas": {
      get: protectedOperation("Listar ventas", "Obtiene las ventas autorizadas para el usuario autenticado.", {
        "200": response("Ventas obtenidas.", { type: "array", items: ref("Venta") }),
      }, { tags: ["Ventas"] }),
    },
    "/api/ventas/{id}": {
      get: protectedOperation("Obtener venta", "Obtiene una venta por su identificador.", {
        "200": response("Venta encontrada.", ref("Venta")),
        "404": response("Venta no encontrada.", ref("Error")),
      }, { tags: ["Ventas"], parameters: [idParam] }),
    },
    "/api/resenas": collection("Reseñas", "reseñas", "Resena"),
    "/api/resenas/{id}": item("Reseñas", "reseña", "Resena"),
    "/api/tarjetas": collection("Tarjetas", "tarjetas tokenizadas", "Tarjeta"),
    "/api/tarjetas/{id}": item("Tarjetas", "tarjeta", "Tarjeta"),
    "/api/envios": collection("Envíos", "envíos", "Envio"),
    "/api/envios/{id}": patchItem("Envíos", "envío", "Envio"),
    "/api/entregas": {
      get: protectedOperation("Consultar validaciones de entrega", "Obtiene las validaciones de entrega registradas.", {
        "200": response("Validaciones consultadas.", { type: "array", items: ref("ValidacionEntrega") }),
      }, { tags: ["Entregas"] }),
      post: protectedOperation("Registrar entrega", "Registra la validación de entrega de un envío.", {
        "201": response("Entrega registrada.", ref("ValidacionEntrega")),
        "400": response("Datos inválidos.", ref("Error")),
      }, {
        tags: ["Entregas"],
        requestBody: body(objectSchema({
          id_envio: integer(),
          fecha_entrega_real: { type: "string", format: "date-time", example: "2026-11-07T15:30:00Z" },
          estado: text("Entregado"),
        }, ["id_envio", "fecha_entrega_real", "estado"])),
      }),
    },
    "/api/garantias": collection("Garantías", "garantías", "Garantia"),
    "/api/garantias/{id}": item("Garantías", "garantía", "Garantia"),
    "/api/comprobantes": collection("Comprobantes", "comprobantes", "Comprobante"),
    "/api/comprobantes/{id}": item("Comprobantes", "comprobante", "Comprobante"),
  },
};
