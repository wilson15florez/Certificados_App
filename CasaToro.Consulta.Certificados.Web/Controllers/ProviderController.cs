using CasaToro.Consulta.Certificados.BL.Services;
using CasaToro.Consulta.Certificados.Entities;
using CasaToro.Consulta.Certificados.Web.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;


namespace CasaToro.Consulta.Certificados.Web.Controllers
{
    /// <summary>
    /// Controlador para las operaciones del proveedor autenticado.
    /// Requiere autenticación (<c>[Authorize]</c>). Gestiona certificados, facturas,
    /// perfil, formato único de conocimiento (FUCP) y documentos del proveedor.
    /// El NIT del proveedor se obtiene del claim de sesión en cada acción.
    /// </summary>
    [Authorize]
    public class ProviderController : Controller
    {
        private readonly BillService _billService;
        private readonly ProviderService _providerService;
        private readonly UsersService _usersService;
        private readonly CertificatesService _certificatesService;
        private readonly LogService _logService;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly FormatService _formatService = new FormatService();

        /// <summary>
        /// Constructor. Recibe los servicios necesarios por inyección de dependencias.
        /// </summary>
        public ProviderController(BillService billService, ProviderService providerService, CertificatesService certificatesServices, LogService logService, IWebHostEnvironment webHostEnvironment, FormatService formatService, UsersService usersService)
        {
            _billService = billService;
            _providerService = providerService;
            _certificatesService = certificatesServices;
            _logService = logService;
            _webHostEnvironment = webHostEnvironment;
            _formatService = formatService;
            _usersService = usersService;
        }

        /// <summary>
        /// Muestra la vista de certificados disponibles para el proveedor autenticado.
        /// Carga las empresas asociadas, años y periodos disponibles.
        /// </summary>
        /// <returns>Vista con <see cref="CertificatesViewModel"/>.</returns>
        public ActionResult Certificates()
        {
            // Obtener las empresas asociadas al proveedor autenticado
            List<EmpresasMaster> companies = _providerService.GetCompaniesForProvider(User.FindFirst("NIT").Value);
            // Obtener los años y meses disponibles para los certificados
            HashSet<int> years = _certificatesService.GetAvalibleYears();
            HashSet<string> months = _certificatesService.GetAvalibleMonths();

            // Crear el modelo de vista con los datos obtenidos
            var model = new CertificatesViewModel
            {
                companies = companies,
                years = years,
                months = months
            };
            return View(model);
        }

        /// <summary>
        /// Muestra la vista de facturas asociadas al proveedor autenticado.
        /// </summary>
        /// <returns>Vista con <see cref="BillsViewModel"/>.</returns>
        public ActionResult Bill()
        {
            // Obtener el NIT del proveedor autenticado
            var nit = User.FindFirst("NIT").Value;
            // Obtener las facturas asociadas al proveedor
            var bills = _billService.GetBillsForProvider(nit);

            // Crear el modelo de vista con las facturas obtenidas
            var model = new BillsViewModel
            {
                Bills = bills
            };

            return View(model);
        }

        /// <summary>
        /// Muestra la vista de edición de perfil con los datos actuales del proveedor autenticado.
        /// </summary>
        /// <returns>Vista con <see cref="ProfileViewModel"/>, o vista de error si falla.</returns>
        public ActionResult editProfile()
        {
            try
            {
                // Obtener el NIT del proveedor autenticado
                var nit = User.FindFirst("NIT").Value;
                // Obtener el proveedor por su NIT
                var provider = _providerService.getProviderByNit(nit);
                var model = new ProfileViewModel
                {
                    Provider = provider
                };
                return View(model);
            }
            catch (Exception e)
            {
                ViewBag.Error = e.Message;
                return View("Error");
            }

        }

        /// <summary>
        /// Muestra la vista del Formato Único de Conocimiento de Proveedores (FUCP).
        /// El formulario se llena desde el frontend con los datos del proveedor.
        /// </summary>
        /// <returns>Vista del FUCP, o vista de error si falla.</returns>
        public ActionResult PV_FormUnicPro()
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
        /// Genera un certificado (IVA, ICA o RTF) para el proveedor autenticado.
        /// </summary>
        /// <param name="certificateType">Tipo: "1" = IVA, "2" = ICA, "3" = RTF.</param>
        /// <param name="companyId">ID de la empresa retenedora.</param>
        /// <param name="year">Año del certificado.</param>
        /// <param name="period">Periodo bimestral (ej: "ENERO-FEBRERO"). No aplica para RTF.</param>
        /// <returns>JSON con <c>url</c> del PDF generado, o <c>error</c> si falla.</returns>
        [HttpPost]
        public IActionResult GenerateCertificate(string certificateType, string companyId, string year, string period)
        {
            try
            {
                // Obtener el NIT del proveedor autenticado
                var nit = User.FindFirst("NIT").Value;

                // Generar el certificado utilizando el servicio de certificados
                var certificateUrl = _certificatesService.GenerateCertificate(certificateType, companyId, year, period, nit);
                return Json(new { url = certificateUrl });
            }
            catch (Exception e)
            {
                // Manejar cualquier excepción y devolver un mensaje de error
                return Json(new { error = e.Message });
            }
        }

        /// <summary>
        /// Elimina el PDF de un certificado del servidor después de registrar la descarga en el log.
        /// Se llama desde el frontend tras mostrar el certificado al proveedor.
        /// </summary>
        /// <param name="url">URL completa del archivo a eliminar.</param>
        /// <returns>JSON con <c>success: true</c> si se eliminó, o mensaje de error.</returns>
        [HttpPost]
        public IActionResult DeleteCertificate([FromBody] string url)
        {
            try
            {
                // Convertir la URL en una ruta de archivo en el servidor
                var uri = new Uri(url);
                var relativePath = uri.AbsolutePath.TrimStart('/');
                var filePathServer = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", relativePath.Replace("%20", " ").Replace("/", "\\"));

                // Verificar si el archivo existe en el servidor
                if (System.IO.File.Exists(filePathServer))
                {
                    var name = Path.GetFileName(filePathServer);
                    var nit = User.FindFirst("NIT").Value;

                    // Crear un registro de descarga en el log
                    var log = new LogDescarga
                    {
                        IdRegistroDescargas = new Guid(),
                        NitTercero = nit,
                        NombreTercero = User.FindFirst(ClaimTypes.Name).Value,
                        FecDesc = DateTime.Now,
                        DocumentoDesc = name
                    };
                    _logService.addLogDownload(log);

                    // Eliminar el archivo del servidor
                    System.IO.File.Delete(filePathServer);
                    return Json(new { success = true });
                }
                return Json(new { success = false, message = "Archivo no encontrado" });
            }
            catch (Exception ex)
            {
                // Manejar cualquier excepción y devolver un mensaje de error
                return Json(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Actualiza los datos básicos del proveedor autenticado en Proveedores_Master
        /// (Nombre, Dirección, Correo, Teléfono, TipoPersona).
        /// </summary>
        /// <param name="provider">Objeto con los nuevos valores.</param>
        /// <returns>JSON con mensaje de éxito, o vista de error si falla.</returns>
        public IActionResult UpdateProvider([FromBody] Proveedores_Master provider)
        {
            try
            {
                var nit = User.FindFirst("NIT").Value;
                // Verificar si el proveedor existe
                var existingProvider = _providerService.getProviderByNit(nit);
                if (existingProvider == null) return Json(new { error = "Proveedor no encontrado" });

                // Actualizar información del proveedor existente
                existingProvider.Nombre = provider.Nombre.ToUpper();
                existingProvider.Direccion = provider.Direccion;
                existingProvider.Correo = provider.Correo;
                existingProvider.Telefono = provider.Telefono;
                existingProvider.TipoPersona = provider.TipoPersona.Trim();

                // Actualizar información del proveedor en la base de datos
                _providerService.UpdateProvider(existingProvider);
                return Json(new { message = "Información actualizada correctamente" });
            }
            catch (Exception ex)
            {
                ViewBag.Error = ex.Message;
                return View("Error");
            }
        }

        /// <summary>
        /// Consulta el estado del registro del proveedor autenticado y retorna sus datos.
        /// Determina si el proveedor tiene registro completo (foundDetail), solo en Master
        /// (foundMasterOnly) o no tiene información.
        /// Para persona natural con foundMasterOnly, incluye sugerencia de separación del nombre.
        /// </summary>
        /// <returns>
        /// JSON con <c>status</c>:
        /// <list type="bullet">
        ///   <item><c>foundDetail</c>: datos completos de persona + financiero.</item>
        ///   <item><c>foundMasterOnly</c>: solo datos de Proveedores_Master.</item>
        ///   <item><c>error</c>: mensaje de error.</item>
        /// </list>
        /// </returns>
        [HttpGet]
        public async Task<IActionResult> GetProvPersonDetails()
        {
            try
            {
                var nit = User.FindFirst("NIT").Value;
                if (string.IsNullOrEmpty(nit)) return Unauthorized();

                //verifica en la tabla Proveedores_Master
                var provMaster = _providerService.getProviderByNit(nit);

                // intenta obtener los detalles de persona (natural o juridica) + Informacion Financiera
                dynamic naturalData = await _providerService.getProviderDetails(nit, "natural");
                dynamic juridicaData = await _providerService.getProviderDetails(nit, "juridica");

                bool natu = naturalData?.existNatu ?? false;
                bool jur = juridicaData?.existJuri ?? false;
                bool finInfNat = naturalData?.existFinanInf ?? false;
                bool finInfJur = juridicaData?.existFinanInf ?? false;

                // obtiene el tipo de persona registrado en proveedores_master para validar la consulta
                var tipoPersona = provMaster?.TipoPersona?.Trim();

                //si se encuentra en la tabla correspondiente al tipo de persona
                if (tipoPersona == "NATURAL" && natu)
                    return Json(new { status = "foundDetail", data = naturalData, typePerson = tipoPersona, dateValityFUCP = provMaster.FechaDiligencia_Formato });

                if (tipoPersona == "JURIDICA" && jur)
                    return Json(new { status = "foundDetail", data = juridicaData, typePerson = tipoPersona, dateValityFUCP = provMaster.FechaDiligencia_Formato });

                // separa el nombre si esta en proveedores_master y se asigno a persona natural
                if (tipoPersona == "NATURAL" && !natu)
                {
                    var sugerencia = _usersService.SplitFullName(provMaster.Nombre);
                    return Json(new
                    {
                        status = "foundMasterOnly",
                        data = provMaster,
                        typePerson = tipoPersona,
                        suggested = new
                        {
                            firstSurname = sugerencia.firstSurname,
                            secondSurname = sugerencia.secondSurname,
                            names = sugerencia.names
                        }
                    });
                }

                //si se encuentra en proveedores_Master pero no en las tablas de tipo de persona
                return Json(new { status = "foundMasterOnly", data = provMaster, typePerson = tipoPersona?.ToLower() });
            }
            catch (Exception ex)
            {
                return Json(new { status = "error", message = "Error al consultar proveedor: " + ex.Message });
            }
        }

        /// <summary>
        /// Obtiene los documentos activos del proveedor autenticado y su estado OEA.
        /// </summary>
        /// <returns>JSON con <c>data</c> (lista de documentos) e <c>isOEA</c> (estado OEA).</returns>
        [HttpGet]
        public IActionResult GetProviderFiles()
        {
            try
            {
                // Obtener el NIT del proveedor autenticado
                var nit = User.FindFirst("NIT").Value;
                // Verificar si el proveedor existe
                var existingProvider = _providerService.getProviderByNit(nit);
                if (existingProvider == null) return Json(new { error = "Proveedor no encontrado" });

                // Obtener los documentos asociados al proveedor
                var documentos = _providerService.GetDocumentsByNit(nit);
                // Obtener la información financiera del proveedor para verificar el estado de OEA
                var dataFinanInf = _providerService.getProvFinanceInfByNit(nit);
                return Json(new { status = "success", data = documentos, isOEA = dataFinanInf?.upIsOEA });
            }
            catch (Exception ex)
            {
                return Json(new { status = "error", message = ex.Message });
            }
        }

        /// <summary>
        /// Genera el Formato Único de Conocimiento de Proveedores (FUCP) en PDF
        /// para el proveedor autenticado (solo persona jurídica).
        /// Resuelve los IDs de país, estado, ciudad, CIIU y entidad bancaria a nombres legibles
        /// antes de llenar el formato.
        /// </summary>
        /// <returns>JSON con <c>url</c> relativa al PDF generado, o <c>error</c> si falta información jurídica.</returns>
        [HttpGet]
        public async Task<IActionResult> printFormat()
        {
            try
            {
                // Obtener el NIT del proveedor autenticado
                var nit = User.FindFirst("NIT").Value;

                // Verificar si el proveedor existe y obtener su información básica
                var master = _providerService.getProviderByNit(nit);
                if (master == null) return Json(new { error = "Proveedor no encontrado" });

                // intenta obtener los detalles de persona jurídica + Informacion Financiera para llenar el formato
                dynamic dataProvider = await _providerService.getProviderDetails(nit, "juridica");

                dataProvider.master = master;

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
        /// Inserta el primer registro de persona natural para el proveedor autenticado.
        /// Valida que el proveedor exista en Master y que no tenga ya un registro natural.
        /// </summary>
        /// <param name="provider">Datos del proveedor natural con tipos PEP.</param>
        /// <param name="typePerson">Tipo de persona ("natural").</param>
        /// <returns>JSON con mensaje de éxito o <c>error</c>.</returns>
        [HttpPost]
        [Route("/Proveedor/AddProviderNatural")]
        public async Task<IActionResult> AddProviderNatural([FromBody] Proveedores_Natural provider, string typePerson)
        {
            try
            {
                // Obtener el NIT del proveedor autenticado
                var nit = User.FindFirst("NIT").Value;

                //validar la existencia del proveedor en la tabla Proveedores_Master
                var pmaster = _providerService.getProviderByNit(nit);
                if (pmaster == null) return Json(new { error = "El proveedor no esta registrado en el sistema." });

                // validar que se reciba la informacion del proveedor
                if (provider == null) return Json(new { error = "Datos del proveedor no recibidos." });

                //validar que no exista ya el registro en proveedor_natural
                dynamic existingNatural = await _providerService.getProviderDetails(nit, "natural");
                if (existingNatural.existNatu) return Json(new { error = "El proveedor ya tiene registrada su información como persona natural." });

                // concatenar el nombre completo para actualizarlo en proveedores_master
                string fullName = provider.pnNombres + " " + provider.pnPrimerApell + " " + provider.pnSegundoApell;

                // fecha del dilligenciamiento
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
        /// Inserta el primer registro de persona jurídica para el proveedor autenticado.
        /// Valida que el proveedor exista en Master y que no tenga ya un registro jurídico.
        /// </summary>
        /// <param name="provider">Datos del proveedor jurídico.</param>
        /// <param name="typePerson">Tipo de persona ("juridica").</param>
        /// <returns>JSON con mensaje de éxito o <c>error</c>.</returns>
        [HttpPost]
        [Route("/Proveedor/AddProviderJuridica")]
        public async Task<IActionResult> AddProviderJuridica([FromBody] Proveedores_Juridica provider, string typePerson)
        {
            try
            {
                // Obtener el NIT del proveedor autenticado
                var nit = User.FindFirst("NIT").Value;

                //validar la existencia del proveedor en la tabla Proveedores_Master
                var pmaster = _providerService.getProviderByNit(nit);
                if (pmaster == null) return Json(new { error = "El proveedor no esta registrado en el sistema." });

                // validar que se reciba la informacion del proveedor
                if (provider == null) return Json(new { error = "Datos del proveedor no recibidos." });

                //validar que no exista ya el registro en proveedor_juridica
                dynamic existingJuridica = await _providerService.getProviderDetails(nit, "juridica");
                if (existingJuridica.existJuri) return Json(new { error = "El proveedor ya tiene registrada su información como persona jurídica." });

                // fecha del diligenciamiento
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
        /// Inserta el primer registro de información financiera para el proveedor autenticado.
        /// Valida que el proveedor exista en Master y que no tenga ya información financiera registrada.
        /// </summary>
        /// <param name="provider">Datos de información financiera.</param>
        /// <returns>JSON con <c>status</c> y mensaje.</returns>
        [HttpPost]
        [Route("/Proveedor/AddProvFinanceInfo")]
        public IActionResult AddProvFinanceInfo([FromBody] Proveedores_InfoFinanciera provider)
        {
            try
            {
                // Obtener el NIT del proveedor autenticado
                var nit = User.FindFirst("NIT").Value;

                // Verificar si el proveedor existe
                var existingProvider = _providerService.getProviderByNit(nit);
                if (existingProvider == null) return Json(new { error = "Proveedor no encontrado" });

                // validar que se reciba la informacion del proveedor
                if (provider == null) return Json(new { status = "error", message = "Información Financiera del proveedor no recibida." });

                //validar que no exista ya el registro en proveedores_InfoFinanciera
                var existFinanInf = _providerService.getProvFinanceInfByNit(nit);
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
        /// Procesa la carga de documentos del proveedor autenticado.
        /// Sincroniza los archivos existentes (soft delete de los removidos),
        /// guarda los nuevos archivos en el servidor y registra sus metadatos en DB.
        /// Actualiza el estado OEA del proveedor.
        /// </summary>
        /// <param name="isOEA">Estado OEA del proveedor ("Si" o "No").</param>
        /// <param name="existingFilesJSON">JSON con mapa de archivos que el usuario decidió conservar.</param>
        /// <returns>JSON con <c>status</c> y mensaje.</returns>
        [HttpPost]
        [Route("/Proveedor/UploadDocuments")]
        public async Task<IActionResult> UploadDocuments(string isOEA, string existingFilesJSON)
        {
            try
            {
                // Obtener el NIT del proveedor autenticado
                var nit = User.FindFirst("NIT").Value;

                // Verificar si el proveedor existe
                var existingProvider = _providerService.getProviderByNit(nit);
                if (existingProvider == null) return Json(new { error = "Proveedor no encontrado" });

                // Obtener el tipo de persona del proveedor para determinar la ruta de almacenamiento
                var personType = existingProvider.TipoPersona;
                var tipPersona = personType == "NATURAL" ? "PersonaNatural" : "PersonaJuridica";

                // Procesa que archivos deben permanecer en la DB y el servidor
                var existingFilesMap = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, List<string>>>(existingFilesJSON);

                // Eliminar del Servidor y la DB los archivos que el usuario quito en el panel
                _providerService.ActiveDocument(nit, existingFilesMap, _webHostEnvironment.WebRootPath);

                // Verificar que se hayan recibido archivos en la solicitud
                var files = Request.Form.Files;

                // Procesar cada archivo recibido
                foreach (var file in files)
                {
                    string categoria = file.Name;
                    string nameDoc = Path.GetFileNameWithoutExtension(file.FileName);

                    // Guardar el archivo en el servidor y obtener la ruta relativa
                    string rutaRel = await _providerService.SaveDocuments(file, nit, tipPersona, categoria, nameDoc, _webHostEnvironment.WebRootPath);

                    // Guardar la información metadatos del documento en la base de datos
                    _providerService.SaveDocumentMD(nit, categoria, file.FileName, rutaRel);
                }

                // Actualizar el estado de OEA del proveedor
                _providerService.UpdateStatusOEA(nit, isOEA);

                return Json(new { status = "success", message = "Archivos cargados y registrados correctamente." });

            }
            catch (Exception ex)
            {
                return Json(new { status = "error", message = ex.Message });
            }
        }

        /// <summary>
        /// Actualiza la información de persona natural del proveedor autenticado.
        /// Siempre establece <c>TipoTramite = "ACTUALIZACION"</c>.
        /// </summary>
        /// <param name="providerData">Datos actualizados del proveedor natural.</param>
        /// <param name="typePerson">Tipo de persona ("natural").</param>
        /// <returns>JSON con mensaje de éxito o <c>error</c>.</returns>
        [HttpPost]
        [Route("/Proveedor/UpdateProviderNatural")]
        public IActionResult UpdateProviderNatural([FromBody] Proveedores_Natural providerData, string typePerson)
        {
            try
            {
                // Verificar que se reciba la informacion del proveedor
                if (providerData == null)
                {
                    Console.WriteLine("UpdateProviderNatural: Provider data is null");
                    return Json(new { error = "Datos del proveedor no recibidos." });
                }

                // concatenar el nombre completo para actualizarlo en proveedores_master
                string fullName = providerData.pnNombres + " " + providerData.pnPrimerApell + " " + providerData.pnSegundoApell;

                // fecha del dilligenciamiento
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
        /// Actualiza la información de persona jurídica del proveedor autenticado.
        /// Siempre establece <c>TipoTramite = "ACTUALIZACION"</c>.
        /// Además inactiva el FUCP firmado anterior, ya que el formato queda desactualizado.
        /// </summary>
        /// <param name="providerData">Datos actualizados del proveedor jurídico.</param>
        /// <param name="typePerson">Tipo de persona ("juridica").</param>
        /// <returns>JSON con mensaje de éxito o <c>error</c>.</returns>
        [HttpPost]
        [Route("/Proveedor/UpdateProviderJuridica")]
        public IActionResult UpdateProviderJuridica([FromBody] Proveedores_Juridica providerData, string typePerson)
        {
            try
            {
                // Verificar que se reciba la informacion del proveedor
                if (providerData == null)
                    return Json(new { error = "Datos del proveedor no recibidos." });

                // Verificar la existencia del proveedor en la tabla Proveedores_Master
                var pmaster = _providerService.getProviderByNit(providerData.Nit);
                if (pmaster == null)
                    return Json(new { error = "El proveedor no esta registrado en el sistema." });

                // fecha del dilligenciamiento
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
        /// Actualiza la información financiera del proveedor autenticado.
        /// Valida que el registro de información financiera exista antes de actualizar.
        /// </summary>
        /// <param name="providerData">Datos financieros actualizados.</param>
        /// <returns>JSON con <c>status</c> y mensaje.</returns>
        [HttpPost]
        [Route("/Proveedor/UpdateProvFinanceInfo")]
        public IActionResult UpdateProvFinanceInfo([FromBody] Proveedores_InfoFinanciera providerData)
        {
            try
            {
                // Obtener el NIT del proveedor autenticado
                var nit = User.FindFirst("NIT").Value;

                // Verificar que se reciba la informacion del proveedor
                if (providerData == null)
                    return Json(new { status = "error", message = "Datos no recibidos." });

                // Verificar la existencia del proveedor en la tabla Proveedores_Master
                var existing = _providerService.getProvFinanceInfByNit(nit);
                if (existing == null)
                    return Json(new { status = "error", message = "El proveedor no está registrado en el sistema." });

                // Actualizar registro de informacion financiera
                providerData.Nit = nit;
                _providerService.UpdateFinanceInfo(providerData);

                return Json(new { status = "success", message = "Información Financiera actualizada correctamente." });
            }
            catch (Exception ex)
            {
                return Json(new { status = "error", message = "Error al actualizar la información Financiera: " + ex.Message });
            }
        }

        /// <summary>
        /// Actualiza la contraseña del proveedor autenticado.
        /// La contraseña debe llegar ya hasheada desde el frontend.
        /// </summary>
        /// <param name="password">Nueva contraseña hasheada.</param>
        /// <returns>JSON con mensaje de éxito o <c>error</c>.</returns>
        [HttpPost]
        public IActionResult UpdatePassword([FromBody] string password)
        {
            try
            {
                var existingProvider = _providerService.getProviderByNit(User.FindFirst("NIT").Value);

                if (existingProvider == null) return Json(new { error = "Proveedor no encontrado" });

                existingProvider.Contrasena = password;

                _providerService.UpdateProvider(existingProvider);
                return Json(new { message = "Contraseña actualizada correctamente" });
            }
            catch (Exception ex)
            {
                return Json(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Verifica que la contraseña actual ingresada por el proveedor sea correcta.
        /// Se usa como paso previo al cambio de contraseña.
        /// </summary>
        /// <param name="currentPassword">Contraseña actual en texto plano (se hashea internamente para comparar).</param>
        /// <returns>JSON con mensaje de éxito o <c>error</c> si la contraseña no coincide.</returns>
        [HttpPost]
        public IActionResult VerifyPassword([FromBody] string currentPassword)
        {
            try
            {
                var provider = _providerService.getProviderByNit(User.FindFirst("NIT").Value);
                if (provider == null) return Json(new { error = "Proveedor no encontrado" });

                string hashedPassword = LoginService.HashSHA256(currentPassword);
                if (provider.Contrasena != hashedPassword) return Json(new { error = "La contraseña actual ingresada no es correcta. Inténtalo nuevamente." });

                return Json(new { message = "La contraseña ha sido verificada con éxito." });
            }
            catch (Exception ex)
            {
                return Json(new { error = "Ocurrió un error inesperado. Por favor, inténtalo más tarde." });
            }
        }
    }
}
