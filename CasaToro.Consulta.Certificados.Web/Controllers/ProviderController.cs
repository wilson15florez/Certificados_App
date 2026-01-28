using CasaToro.Consulta.Certificados.BL.Services;
using CasaToro.Consulta.Certificados.Entities;
using CasaToro.Consulta.Certificados.Web.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;


namespace CasaToro.Consulta.Certificados.Web.Controllers
{
    [Authorize]
    public class ProviderController : Controller
    {
        private readonly BillService _billService;
        private readonly ProviderService _providerService;
        private readonly CertificatesService _certificatesService;
        private readonly LogService _logService;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly FormatService _formatService = new FormatService();

        // Constructor del controlador que recibe instancias de los servicios necesarios
        public ProviderController(BillService billService, ProviderService providerService, CertificatesService certificatesServices, LogService logService, IWebHostEnvironment webHostEnvironment, FormatService formatService)
        {
            _billService = billService;
            _providerService = providerService;
            _certificatesService = certificatesServices;
            _logService = logService;
            _webHostEnvironment = webHostEnvironment;
            _formatService = formatService;
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
                existingProvider.TipoPersona = provider.TipoPersona;

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

        [HttpGet]
        public async Task<IActionResult> printFormat(string nit)
        {
            dynamic dataProvider = await _providerService.getProviderDetails(nit, "juridica");

            if (dataProvider == null) return NotFound("No se encontro informacion para el Nit proporcionado.");

            string relativePath = _formatService.FillFormatoPDF(dataProvider, _webHostEnvironment.WebRootPath);

            string fullPath = Path.Combine(_webHostEnvironment.WebRootPath, relativePath.TrimStart('/'));

            return File(System.IO.File.ReadAllBytes(fullPath), "application/pdf", $"Formato_{nit}.pdf");
        }

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
