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

        // Constructor del controlador que recibe instancias de los servicios necesarios
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

        // Acción que muestra la vista de certificados para el proveedor autenticado
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

        // Acción que muestra la vista de facturas para el proveedor autenticado
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

        // Acción que muestra la vista de editar perfil para el proveedor
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

        // Acción que muestra la vista de Formulario unico de conocmiento para el proveedor
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

        // Acción que genera un certificado basado en los parámetros proporcionados
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

        // Acción que elimina un certificado basado en la URL proporcionada
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

        // Acción que actualiza la informacion del proveedor en la tabla proveedores_master
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

        // Acción que permite obtener la informacion de un proveedor
        [HttpGet]
        public async Task<IActionResult> GetProvPersonDetails()
        {
            try
            {
                var nit = User.FindFirst("NIT").Value;
                if (string.IsNullOrEmpty(nit)) return Unauthorized();

                //verifica en la tabla Proveedores_Master
                var provMaster = _providerService.getProviderByNit(nit);

                dynamic naturalData = await _providerService.getProviderDetails(nit, "natural");
                dynamic juridicaData = await _providerService.getProviderDetails(nit, "juridica");

                bool natu = naturalData?.existNatu ?? false;
                bool jur = juridicaData?.existJuri ?? false;
                bool finInfNat = naturalData?.existFinanInf ?? false;
                bool finInfJur = juridicaData?.existFinanInf ?? false;


                var tipoPersona = provMaster?.TipoPersona?.Trim();

                //si se encuentra en la tabla correspondiente al tipo de persona
                if (tipoPersona == "NATURAL" && natu)
                    return Json(new { status = "foundDetail", data = naturalData, typePerson = tipoPersona });

                if (tipoPersona == "JURIDICA" && jur)
                    return Json(new { status = "foundDetail", data = juridicaData, typePerson = tipoPersona });

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

        // Acción para consultar y traer los documentos cargados del proveedor
        [HttpGet]
        public IActionResult GetProviderFiles()
        {
            try
            {
                var nit = User.FindFirst("NIT").Value;
                // Verificar si el proveedor existe
                var existingProvider = _providerService.getProviderByNit(nit);
                if (existingProvider == null) return Json(new { error = "Proveedor no encontrado" });

                var documentos = _providerService.GetDocumentsByNit(nit);
                var dataFinanInf = _providerService.getProvFinanceInfByNit(nit);
                return Json(new { status = "success", data = documentos, isOEA = dataFinanInf?.upIsOEA });
            }
            catch (Exception ex)
            {
                return Json(new { status = "error", message = ex.Message });
            }
        }

        // Acción que permite obtener la informacion del proveedor en el formato para imprimir
        [HttpGet]
        public async Task<IActionResult> printFormat()
        {
            try
            {
                var nit = User.FindFirst("NIT").Value;
                // Verificar si el proveedor existe
                var existingProvider = _providerService.getProviderByNit(nit);
                if (existingProvider == null) return Json(new { error = "Proveedor no encontrado" });

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
        [Route("/Proveedor/AddProviderNatural")]
        public async Task<IActionResult> AddProviderNatural([FromBody] Proveedores_Natural provider, string typePerson)
        {
            try
            {
                var nit = User.FindFirst("NIT").Value;
                // Verificar si el proveedor existe
                var existingProvider = _providerService.getProviderByNit(nit);
                if (existingProvider == null) return Json(new { error = "Proveedor no encontrado" });

                if (provider == null) return Json(new { error = "Datos del proveedor no recibidos." });

                //validar la existencia del proveedor en la tabla Proveedores_Master
                var pmaster = _providerService.getProviderByNit(nit);
                if (pmaster == null) return Json(new { error = "El proveedor no esta registrado en el sistema." });

                //validar que no exista ya el registro en proveedor_natural
                dynamic existingNatural = await _providerService.getProviderDetails(nit, "natural");
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
        [Route("/Proveedor/AddProviderJuridica")]
        public async Task<IActionResult> AddProviderJuridica([FromBody] Proveedores_Juridica provider, string typePerson)
        {
            try
            {
                var nit = User.FindFirst("NIT").Value;
                // Verificar si el proveedor existe
                var existingProvider = _providerService.getProviderByNit(nit);
                if (existingProvider == null) return Json(new { error = "Proveedor no encontrado" });

                if (provider == null) return Json(new { error = "Datos del proveedor no recibidos." });

                //validar la existencia del proveedor en la tabla Proveedores_Master
                var pmaster = _providerService.getProviderByNit(nit);
                if (pmaster == null) return Json(new { error = "El proveedor no esta registrado en el sistema." });

                //validar que no exista ya el registro en proveedor_juridica
                dynamic existingJuridica = await _providerService.getProviderDetails(nit, "juridica");
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
        [Route("/Proveedor/AddProvFinanceInfo")]
        public IActionResult AddProvFinanceInfo([FromBody] Proveedores_InfoFinanciera provider)
        {
            try
            {
                var nit = User.FindFirst("NIT").Value;
                // Verificar si el proveedor existe
                var existingProvider = _providerService.getProviderByNit(nit);
                if (existingProvider == null) return Json(new { error = "Proveedor no encontrado" });

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

        // Acción para subir los documentos del proveedor
        [HttpPost]
        [Route("/Proveedor/UploadDocuments")]
        public async Task<IActionResult> UploadDocuments(string isOEA)
        {
            try
            {
                var nit = User.FindFirst("NIT").Value;
                // Verificar si el proveedor existe
                var existingProvider = _providerService.getProviderByNit(nit);
                if (existingProvider == null) return Json(new { error = "Proveedor no encontrado" });

                var personType = existingProvider.TipoPersona;
                var tipPersona = personType == "NATURAL" ? "PersonaNatural" : "PersonaJuridica";

                var files = Request.Form.Files;
                if (files.Count == 0) return Json(new { status = "error", message = "No se recibieron archivos." });

                foreach (var file in files)
                {
                    string categoria = file.Name;

                    string nameDoc = Path.GetFileNameWithoutExtension(file.FileName);

                    string rutaRel = await _providerService.SaveDocuments(file, nit, tipPersona, categoria, nameDoc, _webHostEnvironment.WebRootPath);

                    _providerService.SaveDocumentMD(nit, categoria, file.FileName, rutaRel);
                }

                _providerService.UpdateStatusOEA(nit, isOEA);

                return Json(new { status = "success", message = "Archivos cargados y registrados correctamente." });

            }
            catch (Exception ex)
            {
                return Json(new { status = "error", message = ex.Message });
            }
        }

        //Accion para actualizar persona natural
        [HttpPost]
        [Route("/Proveedor/UpdateProviderNatural")]
        public IActionResult UpdateProviderNatural([FromBody] Proveedores_Natural providerData, string typePerson)
        {
            try
            {
                if (providerData == null)
                {
                    Console.WriteLine("UpdateProviderNatural: Provider data is null");
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
        [Route("/Proveedor/UpdateProviderJuridica")]
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
        [Route("/Proveedor/UpdateProvFinanceInfo")]
        public IActionResult UpdateProvFinanceInfo([FromBody] Proveedores_InfoFinanciera providerData)
        {
            try
            {
                var nit = User.FindFirst("NIT").Value;

                if (providerData == null)
                    return Json(new { status = "error", message = "Datos no recibidos." });

                var existing = _providerService.getProvFinanceInfByNit(nit);
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

        // Acción que permite actualizar la contraseña del proveedor
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

        // Acción que permite verificar la contraseña al inicio de sesion 
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
