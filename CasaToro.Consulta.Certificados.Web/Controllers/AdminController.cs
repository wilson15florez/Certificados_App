using CasaToro.Consulta.Certificados.BL.Services;
using CasaToro.Consulta.Certificados.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace CasaToro.Consulta.Certificados.Web.Controllers
{
    [Authorize(Roles = "Admin")]
    public class AdminController : Controller
    {
        private readonly CertificateServiceExcel _certificateServiceExcel;
        private readonly ProviderService _providerService;
        private readonly UsersService _usersService;
        private readonly AdminService _adminService;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly FormatService _formatService = new FormatService();


        // Constructor del controlador que recibe instacias de los servicios necesarios
        public AdminController(CertificateServiceExcel certificateServiceExcel, ProviderService providerService, IWebHostEnvironment webHostEnvironment, FormatService formatService, AdminService adminService, UsersService usersService)
        {
            _certificateServiceExcel = certificateServiceExcel;
            _providerService = providerService;
            _webHostEnvironment = webHostEnvironment;
            _formatService = formatService;
            _usersService = usersService;
            _adminService = adminService;
        }

        // Acción que muestra la vista principal del administrador
        public ActionResult UpdateInfo()
        {
            return View();
        }

        // Acción que muestra la vista para la administración de proveedores
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

        // Acción que muestra la vista para el formato unico de conocimiento del proveedor
        public ActionResult FormUnicProv()
        {
            return View();
        }


        // Acción que maneja la actualización de la información de los certificados desde un archivo Excel
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

        // Accion para obtener la lista paginada de proveedores
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

        // Acción para actualizar la informacion basica del proveedor en la tabla proveedores_master
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
                existingProvider.Direccion = provider.Direccion;
                existingProvider.Correo = provider.Correo;
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

        //Accion para actualizar persona natural
        [HttpPost]
        [Route("/Admin/UpdateProviderNatural")]
        public IActionResult UpdateProviderNatural([FromBody] Proveedores_Natural providerData, string typePerson)
        {
            try
            {
                if (providerData == null)
                {
                    return Json(new { error = "Datos del proveedor no recibidos." });
                }
                Console.WriteLine("UpdateProviderNatural payload: " + Newtonsoft.Json.JsonConvert.SerializeObject(providerData));
                string fullName = providerData.pnNombres + " " + providerData.pnPrimerApell + " " + providerData.pnSegundoApell;
                _providerService.UpdateNaturalInfo(providerData, fullName, typePerson);
                return Json(new { message = "Información de persona natural actualizada correctamente." });
            }
            catch (Exception ex)
            {
                return Json(new { error = "Error al actualizar la persona natural: " + ex.Message });
            }
        }

        //accion para actualizar persona juridica
        [HttpPost]
        [Route("/Admin/UpdateProviderJuridica")]
        public IActionResult UpdateProviderJuridica([FromBody] Proveedores_Juridica providerData, string typePerson)
        {
            try
            {
                if (providerData == null)
                    return Json(new { error = "Datos del proveedor no recibidos." });

                var pmaster = _providerService.getProviderByNit(providerData.Nit);
                if (pmaster == null)
                    return Json(new { error = "El proveedor no esta registrado en el sistema." });

                _providerService.UpdateJuridicaInfo(providerData, typePerson);
                return Json(new { message = "Información de persona jurídica actualizada correctamente." });
            }
            catch (Exception ex)
            {
                return Json(new { error = "Error al actualizar la persona jurídica: " + ex.Message });
            }
        }

        //accion para actualizar informacion financiera del proveedor
        [HttpPost]
        [Route("/Admin/UpdateProvFinanceInfo")]
        public IActionResult UpdateProvFinanceInfo([FromBody] Proveedores_InfoFinanciera providerData)
        {
            try
            {
                if (providerData == null)
                    return Json(new { status = "error", message = "Datos no recibidos." });

                var existing = _providerService.getProvFinanceInfByNit(providerData.Nit);
                if (existing == null)
                    return Json(new { status = "error", message = "El proveedor no está registrado en el sistema." });

                _providerService.UpdateFinanceInfo(providerData);

                return Json(new { status = "success", message = "Información Financiera actualizada correctamente." });
            }
            catch (Exception ex)
            {
                return Json(new { status = "error", message = "Error al actualizar la información Financiera: " + ex.Message });
            }
        }

        //accion para consultar proveedor y traer la informacion
        [HttpGet]
        public async Task<IActionResult> CheckProvider(string idNum, string personType)
        {
            try
            {
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


                var tipoPersona = providerMaster?.TipoPersona?.Trim();

                // Si existe registro como natural y se está consultando juridica
                if ((natur || tipoPersona == "NATURAL") && personType == "juridica")
                    return Json(new { status = "misMatch", registeredType = "natural" });

                // Si existe registro como juridica y se está consultando natural
                if ((juri || tipoPersona == "JURIDICA") && personType == "natural")
                    return Json(new { status = "misMatch", registeredType = "juridica" });

                //si se encuentra en la tabla correspondiente al tipo de persona
                if (personType == "natural" && (tipoPersona == "NATURAL" && natur))
                    return Json(new { status = "foundDetail", data = naturalData });

                if (personType == "juridica" && (tipoPersona == "JURIDICA" && juri))
                    return Json(new { status = "foundDetail", data = juridicaData });

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

        // Acción para consultar y traer los documentos cargados del proveedor
        [HttpGet]
        public IActionResult GetProviderFiles(string idNum)
        {
            try
            {
                var documentos = _providerService.GetDocumentsByNit(idNum);
                var dataFinanInf = _providerService.getProvFinanceInfByNit(idNum);
                return Json(new { status = "success", data = documentos, isOEA = dataFinanInf?.upIsOEA });
            }
            catch (Exception ex)
            {
                return Json(new { status = "error", message = ex.Message });
            }
        }

        // Acción que permite obtener la informacion del proveedor en el formato para imprimir
        [HttpGet]
        public async Task<IActionResult> PrintFormat(string nit)
        {
            try
            {
                dynamic dataProvider = await _providerService.getProviderDetails(nit, "juridica");

                if (dataProvider == null || dataProvider.juridica == null)
                {
                    return Json(new { error = "Es necesario llenar primero el Formato Único de Conocimiento de Proveedores (Persona Jurídica)." });
                }

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

                string relativePath = _formatService.FillFormatoPDF(dataProvider, _webHostEnvironment.WebRootPath);

                string fullPath = Path.Combine(_webHostEnvironment.WebRootPath, relativePath.TrimStart('/'));

                //byte[] fileBytes = System.IO.File.ReadAllBytes(fullPath);

                //return File(fileBytes, "application/pdf", $"Formato_{idNum}.pdf");
                return Json(new { url = relativePath });
            }
            catch (Exception ex)
            {
                return Json(new { status = "error", message = ex.Message });
            }
        }

        //accion para agregar proveedor natural
        [HttpPost]
        [Route("/Admin/AddProviderNatural")]
        public async Task<IActionResult> AddProviderNatural([FromBody] Proveedores_Natural provider, string typePerson)
        {
            try
            {
                if (provider == null) return Json(new { error = "Datos del proveedor no recibidos." });

                //validar la existencia del proveedor en la tabla Proveedores_Master
                var pmaster = _providerService.getProviderByNit(provider.Nit);
                if (pmaster == null) return Json(new { error = "El proveedor no esta registrado en el sistema." });

                //validar que no exista ya el registro en proveedor_natural
                dynamic existingNatural = await _providerService.getProviderDetails(provider.Nit, "natural");
                if (existingNatural.existNatu) return Json(new { error = "El proveedor ya tiene registrada su información como persona natural." });

                string fullName = provider.pnNombres + " " + provider.pnPrimerApell + " " + provider.pnSegundoApell;
                //insertar registro de persona natural
                _providerService.AddProveedorNatural(provider, fullName, typePerson);
                return Json(new { message = "Proveedor de persona natural registrado correctamente." });
            }
            catch (Exception ex)
            {
                return Json(new { error = ex.Message });
            }
        }

        //accion para agregar proveedor juridico
        [HttpPost]
        [Route("/Admin/AddProviderJuridica")]
        public async Task<IActionResult> AddProviderJuridica([FromBody] Proveedores_Juridica provider, string typePerson)
        {
            try
            {
                if (provider == null) return Json(new { error = "Datos del proveedor no recibidos." });

                //validar la existencia del proveedor en la tabla Proveedores_Master
                var pmaster = _providerService.getProviderByNit(provider.Nit);
                if (pmaster == null) return Json(new { error = "El proveedor no esta registrado en el sistema." });

                //validar que no exista ya el registro en proveedor_juridica
                dynamic existingJuridica = await _providerService.getProviderDetails(provider.Nit, "juridica");
                if (existingJuridica.existJuri) return Json(new { error = "El proveedor ya tiene registrada su información como persona jurídica." });

                //insertar registro de persona juridica
                _providerService.AddProveedorJuridica(provider, typePerson);
                return Json(new { message = "Proveedor de persona jurídica registrado correctamente." });
            }
            catch (Exception ex)
            {
                return Json(new { error = ex.Message });
            }
        }

        //accion para agregar la informcion financiera del proveedor
        [HttpPost]
        [Route("/Admin/AddProvFinanceInfo")]
        public IActionResult AddProvFinanceInfo([FromBody] Proveedores_InfoFinanciera provider)
        {
            try
            {
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

        // Acción para subir los documentos del proveedor
        [HttpPost]
        [Route("/Admin/UploadDocuments")]
        public async Task<IActionResult> UploadDocuments(string Nit, string personType, string isOEA)
        {
            try
            {
                var files = Request.Form.Files;
                if (files.Count == 0) return Json(new { status = "error", message = "No se recibieron archivos." });

                foreach (var file in files)
                {
                    string categoria = file.Name;

                    string nameDoc = Path.GetFileNameWithoutExtension(file.FileName);

                    string rutaRel = await _providerService.SaveDocuments(file, Nit, personType, categoria, nameDoc, _webHostEnvironment.WebRootPath);

                    _providerService.SaveDocumentMD(Nit, categoria, file.FileName, rutaRel);
                }

                _providerService.UpdateStatusOEA(Nit, isOEA);

                return Json(new { status = "success", message = "Archivos cargados y registrados correctamente." });

            }
            catch (Exception ex)
            {
                return Json(new { status = "error", message = ex.Message });
            }
        }

        //accion para restaurar contrasena de proveedor
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
