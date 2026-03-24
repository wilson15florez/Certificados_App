using CasaToro.Consulta.Certificados.BL.Services;
using CasaToro.Consulta.Certificados.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace CasaToro.Consulta.Certificados.Web.Controllers
{
    /// <summary>
    /// Controlador para las operaciones administrativas del sistema.
    /// Requiere rol "Admin" (<c>[Authorize(Roles = "Admin")]</c>).
    /// Gestiona la carga masiva de certificados desde Excel, administración de proveedores,
    /// generación del FUCP y mantenimiento de cuentas.
    /// </summary>
    [Authorize(Roles = "Admin")]
    public class AdminController : Controller
    {
        private readonly CertificateServiceExcel _certificateServiceExcel;
        private readonly ProviderService _providerService;
        private readonly UsersService _usersService;
        private readonly AdminService _adminService;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly FormatService _formatService = new FormatService();


        /// <summary>
        /// Constructor. Recibe los servicios necesarios por inyección de dependencias.
        /// </summary>
        public AdminController(CertificateServiceExcel certificateServiceExcel, ProviderService providerService, IWebHostEnvironment webHostEnvironment, FormatService formatService, AdminService adminService, UsersService usersService)
        {
            _certificateServiceExcel = certificateServiceExcel;
            _providerService = providerService;
            _webHostEnvironment = webHostEnvironment;
            _formatService = formatService;
            _usersService = usersService;
            _adminService = adminService;
        }

        /// <summary>
        /// Muestra la vista principal del administrador para carga de información de certificados.
        /// </summary>
        public ActionResult UpdateInfo()
        {
            return View();
        }

        /// <summary>
        /// Muestra la vista de listado y administración de proveedores.
        /// </summary>
        /// <returns>Vista de lista de proveedores, o vista de error si falla.</returns>
        public ActionResult ProviderList()
        {
            try
            {
                return View();
            }
            catch (Exception ex)
            {
                ViewBag.ErrorMessage = ex.Message;
                return View("Error");
            }
        }

        /// <summary>
        /// Muestra la vista del Formato Único de Conocimiento de Proveedores (FUCP)
        /// para que el administrador consulte o complete la información de un proveedor.
        /// </summary>
        public ActionResult FormUnicProv()
        {
            return View();
        }

        /// <summary>
        /// Procesa la carga masiva de certificados desde un archivo Excel.
        /// Delega al servicio correspondiente según el tipo (IVA, ICA o RTF).
        /// </summary>
        /// <param name="file">Archivo Excel (.xlsx) con los datos.</param>
        /// <param name="infoType">Tipo de certificado: "IVA", "ICA" o "RTF".</param>
        /// <returns>JSON con mensaje de éxito o <c>error</c> descriptivo.</returns>
        [HttpPost]
        public IActionResult UpdateCertificateInfo(IFormFile file, string infoType)
        {
            // Verificar si el archivo no es nulo y tiene contenido
            if (file != null && file.Length > 0)
            {
                // Procesar el archivo según el tipo de información especificado
                if (infoType == "IVA")
                {
                    var result = _certificateServiceExcel.AddInfoIvaFromExcel(file);
                    if (!result.success) return Json(new { error = result.message });
                    return Json(new { result.message });
                }

                if (infoType == "ICA")
                {
                    var result = _certificateServiceExcel.AddInfoIcaFromExcel(file);
                    if (!result.success) return Json(new { error = result.message });
                    return Json(new { result.message });
                }

                if (infoType == "RTF")
                {
                    var result = _certificateServiceExcel.AddInfoRtfFromExcel(file);
                    if (!result.success) return Json(new { error = result.message });
                    return Json(new { result.message });
                }

                // Si el tipo de información no es soportado, devolver un mensaje de error
                return Json(new { error = "Tipo de información no soportado" });
            }

            // Si el archivo es nulo o está vacío, devolver un mensaje de error
            return Json(new { error = "Ocurrio un error al procesar el archivo" });
        }

        /// <summary>
        /// Obtiene la lista paginada de proveedores con filtro de búsqueda opcional.
        /// </summary>
        /// <param name="pageNumber">Número de página (base 1, por defecto 1).</param>
        /// <param name="pageSize">Registros por página (por defecto 100).</param>
        /// <param name="search">Texto de búsqueda en NIT o Nombre (opcional).</param>
        /// <returns>JSON con <c>providers</c>, <c>currentPage</c>, <c>pageSize</c> y <c>totalProviders</c>.</returns>
        [HttpGet]
        public IActionResult GetProviders(int pageNumber = 1, int pageSize = 100, string? search = null)
        {
            try
            {
                // Obtener lista paginada con búsqueda en la base de datos
                var providers = _adminService.getProviders(pageNumber, pageSize, search);

                // Contar total de proveedores con filtro
                var totalProviders = _adminService.getProvidersCount(search);

                return Json(new
                {
                    providers,
                    currentPage = pageNumber,
                    pageSize,
                    totalProviders
                });
            }
            catch (Exception ex)
            {
                return Json(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Actualiza los datos básicos de un proveedor en Proveedores_Master
        /// (Nombre, Dirección, Correo, Teléfono). Acción exclusiva del administrador.
        /// </summary>
        /// <param name="provider">Objeto con NIT y nuevos valores.</param>
        /// <returns>JSON con mensaje de éxito o <c>error</c>.</returns>
        [HttpPost]
        public IActionResult UpdateProvider([FromBody] Proveedores_Master provider)
        {
            try
            {
                // Verificar si el proveedor existe
                var existingProvider = _providerService.getProviderByNit(provider.Nit);
                if (existingProvider == null) return Json(new { error = "Proveedor no encontrado" });

                // Actualizar información del proveedor existente
                existingProvider.Nombre = provider.Nombre.ToUpper();
                existingProvider.Direccion = provider.Direccion.ToUpper();
                existingProvider.Correo = provider.Correo.ToUpper();
                existingProvider.Telefono = provider.Telefono;

                // Actualizar información del proveedor en la base de datos
                _providerService.UpdateProvider(existingProvider);
                return Json(new { message = "Información actualizada correctamente" });
            }
            catch (Exception ex)
            {
                return Json(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Actualiza la información de persona natural de un proveedor consultado por el admin.
        /// Siempre establece <c>TipoTramite = "ACTUALIZACION"</c>.
        /// </summary>
        /// <param name="providerData">Datos actualizados del proveedor natural.</param>
        /// <param name="typePerson">Tipo de persona ("natural").</param>
        /// <returns>JSON con mensaje de éxito o <c>error</c>.</returns>
        [HttpPost]
        [Route("/Admin/UpdateProviderNatural")]
        public IActionResult UpdateProviderNatural([FromBody] Proveedores_Natural providerData, string typePerson)
        {
            try
            {
                // Verifica recepción de datos
                if (providerData == null)
                {
                    return Json(new { error = "Datos del proveedor no recibidos." });
                }

                // concatenar el nombre completo para actualizarlo en proveedores_master
                string fullName = providerData.pnNombres + " " + providerData.pnPrimerApell + " " + providerData.pnSegundoApell;

                // fecha del diligenciamiento para registrarlo en proveedores_master
                DateTime dateProcedure = DateTime.Now;

                // establece el tipo de tramite como actualizacion en la tabla proveedores_master
                string tipTramite = "ACTUALIZACION";

                // actualizar registro de persona natural
                _providerService.UpdateNaturalInfo(providerData, fullName, typePerson, dateProcedure, tipTramite);

                return Json(new { message = "Información de persona natural actualizada correctamente." });
            }
            catch (Exception ex)
            {
                return Json(new { error = "Error al actualizar la persona natural: " + ex.Message });
            }
        }

        /// <summary>
        /// Actualiza la información de persona jurídica de un proveedor consultado por el admin.
        /// Siempre establece <c>TipoTramite = "ACTUALIZACION"</c>.
        /// Inactiva el FUCP firmado anterior ya que el formato queda desactualizado.
        /// </summary>
        /// <param name="providerData">Datos actualizados del proveedor jurídico.</param>
        /// <param name="typePerson">Tipo de persona ("juridica").</param>
        /// <returns>JSON con mensaje de éxito o <c>error</c>.</returns>
        [HttpPost]
        [Route("/Admin/UpdateProviderJuridica")]
        public IActionResult UpdateProviderJuridica([FromBody] Proveedores_Juridica providerData, string typePerson)
        {
            try
            {
                // Verifica recepción de datos
                if (providerData == null)
                    return Json(new { error = "Datos del proveedor no recibidos." });

                // Verificar existencia del proveedor en la tabla Proveedores_Master
                var pmaster = _providerService.getProviderByNit(providerData.Nit);
                if (pmaster == null)
                    return Json(new { error = "El proveedor no esta registrado en el sistema." });

                // fecha del diligenciamiento para registrarlo en proveedores_master
                DateTime dateProcedure = DateTime.Now;

                // establece el tipo de tramite como actualizacion en la tabla proveedores_master
                string tipTramite = "ACTUALIZACION";

                // actualizar registro de persona juridica
                _providerService.UpdateJuridicaInfo(providerData, typePerson, dateProcedure, tipTramite);

                //inactiva el formato que proveedor subio firmado, para que suba el actualizado firmado
                _providerService.DeactiveJuriFUCP(providerData.Nit);

                return Json(new { message = "Información de persona jurídica actualizada correctamente." });
            }
            catch (Exception ex)
            {
                return Json(new { error = "Error al actualizar la persona jurídica: " + ex.Message });
            }
        }

        /// <summary>
        /// Actualiza la información financiera de un proveedor consultado por el admin.
        /// Valida que el registro de información financiera exista antes de actualizar.
        /// </summary>
        /// <param name="providerData">Datos financieros actualizados. Debe incluir el NIT del proveedor.</param>
        /// <returns>JSON con <c>status</c> y mensaje.</returns>
        [HttpPost]
        [Route("/Admin/UpdateProvFinanceInfo")]
        public IActionResult UpdateProvFinanceInfo([FromBody] Proveedores_InfoFinanciera providerData)
        {
            try
            {
                // Verifica recepción de datos
                if (providerData == null)
                    return Json(new { status = "error", message = "Datos no recibidos." });

                // Verificar existencia del proveedor en la tabla Proveedores_Master
                var existing = _providerService.getProvFinanceInfByNit(providerData.Nit);
                if (existing == null)
                    return Json(new { status = "error", message = "El proveedor no está registrado en el sistema." });

                // Actualizar información financiera del proveedor
                _providerService.UpdateFinanceInfo(providerData);

                return Json(new { status = "success", message = "Información Financiera actualizada correctamente." });
            }
            catch (Exception ex)
            {
                return Json(new { status = "error", message = "Error al actualizar la información Financiera: " + ex.Message });
            }
        }

        /// <summary>
        /// Consulta el estado del registro de un proveedor por NIT y tipo de persona.
        /// Detecta inconsistencias de tipo (misMatch), registros completos (foundDetail),
        /// solo en Master (foundMasterOnly) o no encontrado (notFound).
        /// Para persona natural con foundMasterOnly incluye sugerencia de separación del nombre.
        /// </summary>
        /// <param name="idNum">NIT del proveedor a consultar.</param>
        /// <param name="personType">Tipo de persona: "natural" o "juridica".</param>
        /// <returns>
        /// JSON con <c>status</c> </returns>
        [HttpGet]
        public async Task<IActionResult> CheckProvider(string idNum, string personType)
        {
            try
            {
                // Verificar que se recibieron los parámetros necesarios
                if (string.IsNullOrEmpty(idNum) || string.IsNullOrEmpty(personType))
                    return Json(new { status = "error", message = "ID y Tipo de persona son requeridos." });

                //verifica si el proveedor existe en la tabla Proveedores_Master
                var providerMaster = _providerService.getProviderByNit(idNum);

                //si no lo encuentra en proveedores_Master
                if (providerMaster == null)
                {
                    return Json(new { status = "notFound", idNum });
                }

                //intenta obtener los detalles de persona (natural o juridica) + Informacion Financiera
                dynamic naturalData = await _providerService.getProviderDetails(idNum, "natural");
                dynamic juridicaData = await _providerService.getProviderDetails(idNum, "juridica");

                bool natur = naturalData?.existNatu ?? false;
                bool juri = juridicaData?.existJuri ?? false;
                bool finInfNat = naturalData?.existFinanInf ?? false;
                bool finInfJur = juridicaData?.existFinanInf ?? false;

                //obtiene el tipo de persona registrado en proveedores_Master para validar la consulta
                var tipoPersona = providerMaster?.TipoPersona?.Trim();

                // Si existe registro como natural y se está consultando juridica
                if ((natur || tipoPersona == "NATURAL") && personType == "juridica")
                    return Json(new { status = "misMatch", registeredType = "natural" });

                // Si existe registro como juridica y se está consultando natural
                if ((juri || tipoPersona == "JURIDICA") && personType == "natural")
                    return Json(new { status = "misMatch", registeredType = "juridica" });

                //si se encuentra en la tabla correspondiente al tipo de persona
                if (personType == "natural" && (tipoPersona == "NATURAL" && natur))
                    return Json(new { status = "foundDetail", data = naturalData, dateValityFUCP = providerMaster.FechaDiligencia_Formato });

                if (personType == "juridica" && (tipoPersona == "JURIDICA" && juri))
                    return Json(new { status = "foundDetail", data = juridicaData, dateValityFUCP = providerMaster.FechaDiligencia_Formato });

                // separa el nombre si esta en proveedores_master y se asigno a persona natural
                if (((tipoPersona == null || tipoPersona == "NATURAL") && !natur) && personType == "natural")
                {
                    var sugerencia = _usersService.SplitFullName(providerMaster.Nombre);
                    return Json(new
                    {
                        status = "foundMasterOnly",
                        data = providerMaster,
                        suggested = new
                        {
                            firstSurname = sugerencia.firstSurname,
                            secondSurname = sugerencia.secondSurname,
                            names = sugerencia.names
                        }
                    });
                }

                //si se encuentra en proveedores_Master pero no en las tablas de tipo de persona
                return Json(new { status = "foundMasterOnly", data = providerMaster });

            }
            catch (Exception ex)
            {
                return Json(new { status = "error", message = "Error al consultar proveedor: " + ex.Message });
            }
        }

        /// <summary>
        /// Obtiene los documentos activos de un proveedor y su estado OEA.
        /// </summary>
        /// <param name="idNum">NIT del proveedor.</param>
        /// <returns>JSON con <c>data</c> (lista de documentos) e <c>isOEA</c>.</returns>
        [HttpGet]
        public IActionResult GetProviderFiles(string idNum)
        {
            try
            {
                // obtiene los documentos cargados del proveedor
                var documentos = _providerService.GetDocumentsByNit(idNum);
                // obtiene la informacion financiera para validar si es OEA y mostrar esa informacion en la vista de documentos
                var dataFinanInf = _providerService.getProvFinanceInfByNit(idNum);
                return Json(new { status = "success", data = documentos, isOEA = dataFinanInf?.upIsOEA });
            }
            catch (Exception ex)
            {
                return Json(new { status = "error", message = ex.Message });
            }
        }

        /// <summary>
        /// Genera el FUCP en PDF para un proveedor jurídico consultado por el admin.
        /// Resuelve IDs de país, estado, ciudad, CIIU y banco a nombres legibles antes de llenar.
        /// </summary>
        /// <param name="nit">NIT del proveedor jurídico.</param>
        /// <returns>JSON con <c>url</c> relativa del PDF, o <c>error</c> si falta información.</returns>
        [HttpGet]
        public async Task<IActionResult> PrintFormat(string nit)
        {
            try
            {
                //intenta obtener los detalles de persona juridica + Informacion Financiera para llenar el formato unico de conocimiento del proveedor
                dynamic dataProvider = await _providerService.getProviderDetails(nit, "juridica");

                // obtiene la informacion basica del proveedor para llenar el formato unico de conocimiento del proveedor
                var master = _providerService.getProviderByNit(nit);

                if (master != null)
                {
                    dataProvider.master = master;
                }

                if (dataProvider == null || dataProvider.juridica == null)
                {
                    return Json(new { error = "Es necesario llenar primero el Formato Único de Conocimiento de Proveedores (Persona Jurídica)." });
                }

                // Consulta y reemplaza los campos de pais, departamento, ciudad, actividad economica y entidad bancaria por su descripcion y no su id para llenar el formato
                var juri = dataProvider.juridica as Dictionary<string, object>;
                var finanInf = dataProvider.finanInf as Dictionary<string, object>;

                if (juri != null && finanInf != null)
                {
                    if (juri.ContainsKey("pjRLNacionalidad"))
                        juri["pjRLNacionalidad"] = _usersService.ConsultCountry(juri["pjRLNacionalidad"]?.ToString(), _webHostEnvironment.WebRootPath);

                    if (juri.ContainsKey("pjRLDepartNac"))
                        juri["pjRLDepartNac"] = _usersService.ConsultState(juri["pjRLDepartNac"]?.ToString(), _webHostEnvironment.WebRootPath);

                    if (juri.ContainsKey("pjRLCiudadNac"))
                        juri["pjRLCiudadNac"] = _usersService.ConsultCity(juri["pjRLCiudadNac"]?.ToString(), _webHostEnvironment.WebRootPath);

                    if (finanInf.ContainsKey("pvPorPais"))
                        finanInf["pvPorPais"] = _usersService.ConsultCountry(finanInf["pvPorPais"]?.ToString(), _webHostEnvironment.WebRootPath);

                    if (finanInf.ContainsKey("pvAcEconomica"))
                        finanInf["pvAcEconomica"] = _usersService.ConsultEconomic(finanInf["pvAcEconomica"]?.ToString(), _webHostEnvironment.WebRootPath);

                    if (finanInf.ContainsKey("pvEntidad"))
                        finanInf["pvEntidad"] = _usersService.ConsultBank(finanInf["pvEntidad"]?.ToString(), _webHostEnvironment.WebRootPath);
                }

                // enviar la informacion para generar el formato y obtener la ruta del pdf generado para mostrarlo en la vista
                string relativePath = _formatService.FillFormatoPDF(dataProvider, _webHostEnvironment.WebRootPath);

                string fullPath = Path.Combine(_webHostEnvironment.WebRootPath, relativePath.TrimStart('/'));

                return Json(new { url = relativePath });
            }
            catch (Exception ex)
            {
                return Json(new { status = "error", message = ex.Message });
            }
        }

        /// <summary>
        /// Inserta el primer registro de persona natural para un proveedor consultado por el admin.
        /// Valida existencia en Master y que no exista registro natural previo.
        /// </summary>
        /// <param name="provider">Datos del proveedor natural con NIT explícito.</param>
        /// <param name="typePerson">Tipo de persona ("natural").</param>
        /// <returns>JSON con mensaje de éxito o <c>error</c>.</returns>
        [HttpPost]
        [Route("/Admin/AddProviderNatural")]
        public async Task<IActionResult> AddProviderNatural([FromBody] Proveedores_Natural provider, string typePerson)
        {
            try
            {
                // Verifica recepción de datos
                if (provider == null) return Json(new { error = "Datos del proveedor no recibidos." });

                //validar la existencia del proveedor en la tabla Proveedores_Master
                var pmaster = _providerService.getProviderByNit(provider.Nit);
                if (pmaster == null) return Json(new { error = "El proveedor no esta registrado en el sistema." });

                //validar que no exista ya el registro en proveedor_natural
                dynamic existingNatural = await _providerService.getProviderDetails(provider.Nit, "natural");
                if (existingNatural.existNatu) return Json(new { error = "El proveedor ya tiene registrada su información como persona natural." });

                // concatenar el nombre completo para actualizarlo en proveedores_master
                string fullName = provider.pnNombres + " " + provider.pnPrimerApell + " " + provider.pnSegundoApell;

                // fecha del diligenciamiento para registrarlo en proveedores_master
                DateTime dateProcedure = DateTime.Now;

                // determina si el tipo de tramite, dependiendo si es un nuevo proveedor o si es una actualizacion de uno existente
                string tipTramite = (pmaster.TipoTramite_Formato == "VINCULACION") ? "VINCULACION" : "ACTUALIZACION";
                                
                //insertar registro de persona natural
                _providerService.AddProveedorNatural(provider, fullName, typePerson, dateProcedure, tipTramite);

                return Json(new { message = "Proveedor de persona natural registrado correctamente." });
            }
            catch (Exception ex)
            {
                return Json(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Inserta el primer registro de persona jurídica para un proveedor consultado por el admin.
        /// Valida existencia en Master y que no exista registro jurídico previo.
        /// </summary>
        /// <param name="provider">Datos del proveedor jurídico con NIT explícito.</param>
        /// <param name="typePerson">Tipo de persona ("juridica").</param>
        /// <returns>JSON con mensaje de éxito o <c>error</c>.</returns>
        [HttpPost]
        [Route("/Admin/AddProviderJuridica")]
        public async Task<IActionResult> AddProviderJuridica([FromBody] Proveedores_Juridica provider, string typePerson)
        {
            try
            {
                // Verifica recepción de datos
                if (provider == null) return Json(new { error = "Datos del proveedor no recibidos." });

                //validar la existencia del proveedor en la tabla Proveedores_Master
                var pmaster = _providerService.getProviderByNit(provider.Nit);
                if (pmaster == null) return Json(new { error = "El proveedor no esta registrado en el sistema." });

                //validar que no exista ya el registro en proveedor_juridica
                dynamic existingJuridica = await _providerService.getProviderDetails(provider.Nit, "juridica");
                if (existingJuridica.existJuri) return Json(new { error = "El proveedor ya tiene registrada su información como persona jurídica." });

                // fecha del diligenciamiento para registrarlo en proveedores_master
                DateTime dateProcedure = DateTime.Now;

                // determina si el tipo de tramite, dependiendo si es un nuevo proveedor o si es una actualizacion de uno existente
                string tipTramite = (pmaster.TipoTramite_Formato == "VINCULACION") ? "VINCULACION" : "ACTUALIZACION";

                //insertar registro de persona juridica
                _providerService.AddProveedorJuridica(provider, typePerson, dateProcedure, tipTramite);

                return Json(new { message = "Proveedor de persona jurídica registrado correctamente." });
            }
            catch (Exception ex)
            {
                return Json(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Inserta el primer registro de información financiera para un proveedor consultado por el admin.
        /// Valida que el proveedor exista en Master y que no tenga ya información financiera.
        /// </summary>
        /// <param name="provider">Datos de información financiera con NIT explícito.</param>
        /// <returns>JSON con <c>status</c> y mensaje.</returns>
        [HttpPost]
        [Route("/Admin/AddProvFinanceInfo")]
        public IActionResult AddProvFinanceInfo([FromBody] Proveedores_InfoFinanciera provider)
        {
            try
            {
                // Verifica recepción de datos
                if (provider == null) return Json(new { status = "error", message = "Información Financiera del proveedor no recibida." });

                //validar la existencia del proveedor en la tabla Proveedores_Master
                var pmaster = _providerService.getProviderByNit(provider.Nit);
                if (pmaster == null) return Json(new { status = "error", message = "El provedor no esta registrado en el sistema." });

                //validar que no exista ya el registro en proveedores_InfoFinanciera
                var existFinanInf = _providerService.getProvFinanceInfByNit(provider.Nit);
                if (existFinanInf != null) return Json(new { status = "error", message = "El proveedor ya tiene información financiera registrada." });

                //insertar registro en Informacion Financiera
                _providerService.AddProvFinanceInf(provider);

                return Json(new { status = "success", message = "Información Financiera del Proveedor registrada correctamente." });
            }
            catch (Exception ex)
            {
                return Json(new { status = "error", message = "Error al agregar Información Financiera: " + ex.Message });
            }
        }

        /// <summary>
        /// Procesa la carga de documentos de un proveedor desde la vista de administración.
        /// A diferencia del flujo del proveedor, recibe el NIT y tipo de persona explícitamente.
        /// Sincroniza archivos existentes, guarda nuevos y actualiza el estado OEA.
        /// </summary>
        /// <param name="Nit">NIT del proveedor.</param>
        /// <param name="personType">Tipo de persona ("PersonaNatural" o "PersonaJuridica").</param>
        /// <param name="isOEA">Estado OEA del proveedor ("Si" o "No").</param>
        /// <param name="existingFilesJSON">JSON con mapa de archivos a conservar.</param>
        /// <returns>JSON con <c>status</c> y mensaje.</returns>
        [HttpPost]
        [Route("/Admin/UploadDocuments")]
        public async Task<IActionResult> UploadDocuments(string Nit, string personType, string isOEA, string existingFilesJSON)
        {
            try
            {
                // Procesa que archivos deben permanecer en la DB y el servidor
                var existingFilesMap = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, List<string>>>(existingFilesJSON);

                // Eliminar del Servidor y la DB los archivos que el usuario quito en el panel
                _providerService.ActiveDocument(Nit, existingFilesMap, _webHostEnvironment.WebRootPath);

                // verifica que se hayan recivido los documentos y los datos necesarios
                var files = Request.Form.Files;

                // procesa cada documento recibido
                foreach (var file in files)
                {
                    string categoria = file.Name;
                    string nameDoc = Path.GetFileNameWithoutExtension(file.FileName);

                    // guarda el documento en el servidor y obtiene la ruta relativa
                    string rutaRel = await _providerService.SaveDocuments(file, Nit, personType, categoria, nameDoc, _webHostEnvironment.WebRootPath);

                    // guardar la informacion metadatos del documento en la base de datos
                    _providerService.SaveDocumentMD(Nit, categoria, file.FileName, rutaRel);
                }

                // actualiza el estado de OEA del proveedor
                _providerService.UpdateStatusOEA(Nit, isOEA);

                return Json(new { status = "success", message = "Archivos cargados y registrados correctamente." });

            }
            catch (Exception ex)
            {
                return Json(new { status = "error", message = ex.Message });
            }
        }

        /// <summary>
        /// Restaura la contraseña de un proveedor a su NIT (contraseña por defecto).
        /// </summary>
        /// <param name="nit">NIT del proveedor.</param>
        /// <returns>JSON con mensaje de éxito o <c>error</c>.</returns>
        [HttpGet]
        public IActionResult RestoreProviderPassword(string nit)
        {
            try
            {
                if (string.IsNullOrEmpty(nit)) return Json(new { error = "NIT del proveedor no recibido" });

                // Verificar si el proveedor existe
                var existingProvider = _providerService.getProviderByNit(nit);
                if (existingProvider == null) return Json(new { error = "Proveedor no encontrado" });
                // Restaurar contraseña del proveedor
                _adminService.RestoreProviderPassword(nit);
                return Json(new { message = "Contraseña restaurada correctamente" });
            }
            catch (Exception ex)
            {
                return Json(new { error = ex.Message });
            }
        }
    }
}
