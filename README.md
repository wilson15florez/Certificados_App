# Portal de Proveedores
Plataforma diseñada para la gestión integral de proveedores y la administración de certificados tributarios (CasaToro, Motorysa, Bonaparte). El sistema centraliza el registro detallado de información legal y financiera, el procesamiento de datos contables desde archivos Excel y la consulta de estado de facturación bajo un entorno seguro basado en roles.

## Funcionalidades Principales
### 1. Autenticación y Sistema de Roles
- **Control de Acceso basado en Claims:** Entornos completamente aislados para `Administradores` y `Proveedores`.

### 2. Gestión de Proveedores
- **Información Legal y Tributaria:** Formularios dinamicos de captura de datos adaptados para Personas Naturales y Jurídicas, incluyendo manejo de sucursales, composición accionaria.

- **Documentación Anexa:** Módulo para la carga y actualización de documentos legales con validación de extensiones (PDF) y previsualización integrada.

### 3. Generación de Certificados y Formatos
- **Certificados Tributarios:** Creación dinámica de certificados tributarios (**IVA**, **ICA**, **Retefuente**) en formato PDF mediante la librería iText7, para la consulta y descarga por parte de los proveedores.

- **Formato Único de Conocimiento de Proveedores (FUCP):** Generación automatica del documento legal mapeando los datos del proveedor directamente sobre la plantilla PDF estructurada (AcroForms).

### 4. Operaciones Administrativas (Backoffice)
- **Carga de la información (Excel):** Procesamiento de archivos `.xlsx` para subir la información de certificados triutarios utilizando OpenXML, con validación de integridad de datos e inserción transaccional.
- **Panel de Control:** Búsqueda en tiempo real de proveedores, revisión de formatos y getion de recuperación de contraseñas.

### 5. Consulta de facturación
- Módulo especializado para la visualización detallada y seguimiento del estado de facturas asociadas al ID/NIT del proveedor.

## Stack Tecnológico
### Backend & Datos
- **Framework:** .NET 8 (ASP.NET Core MVC)
- **ORM:** Entity Framework Core
- **Base de Datos:** SQL Server
- **Librerias claves:** OpenXML SDK (Procesamiento Excel), iText7 (Generación y manipulación de PDFs).

### Frontend
- **Arquitectura:** JavaScript Modular (ES6+) con llamadas asíncronas (Fetch API).
- **Diseño & UI:** Bootstrap 5, CSS3 Personalizado
- **Componentes:** Select2 (selectores dinámicos y dependietes), Intl-Tel-Input (validación de formatos telefónicos E.164).

## Requisitos y Configuración local
1. **Base de Datos:** Se requiere una instancia de SQL Server. La cadena de conexión debe configurarse en el `appsettings.json`.

2. **Archivos Estáticos (`wwwroot`):** El sistema depende de catálogos locales JSON ubicados en `wwwroot/data/` (Bancos, Códigos CIIU - Actividad Economica, ubicaciones geográficas) para poblar los formularios sin saturar la base de datos.

3. **Plantilla FUCP PDF:** Asegurarse de que el directorio `wwwroot/data/ADM-FO-0002 V8/` contenga la plantilla base del FUCP con los campos de formulario (AcroFields) correctamente nombrados.
