using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using CasaToro.Consulta.Certificados.Web.Models;
using CasaToro.Consulta.Certificados.BL.Services;


namespace CasaToro.Consulta.Certificados.Web.Controllers
{
    public class LoginController : Controller
    {
        private readonly LoginService _loginService;

        // Constructor del controlador que recibe una instancia de LoginService
        public LoginController(LoginService loginService)
        {
            _loginService = loginService;
        }

        // Acción que muestra la vista de inicio de sesión
        public ActionResult Index()
        {
            return View();
        }

        // Acción que maneja el envío del formulario de inicio de sesión
        [HttpPost]
        public async Task<ActionResult> Login(LoginViewModel model)
        {
            try
            {
                // Autenticar al usuario utilizando el servicio de login
                var result = _loginService.Authenticate(model.UserName, model.Password);

                // Si el usuario está autenticado y no es administrador
                if (result.IsAuthenticated && !result.isAdmin)
                {
                    // Iniciar sesión y redirigir a la página de certificados del proveedor
                    await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, result.Principal);
                    return RedirectToAction("Certificates", "Provider");
                }

                // Si el usuario está autenticado y es administrador
                if (result.IsAuthenticated && result.isAdmin)
                {
                    // Iniciar sesión y redirigir a la página de administración
                    await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, result.Principal);
                    return RedirectToAction("UpdateInfo", "Admin");
                }

                // Si la autenticación falla, mostrar el mensaje de error en la vista de inicio de sesión
                ViewBag.ErrorMessage = result.ErrorMessage;
                return View("Index", model);
            }
            catch (Exception ex)
            {
                // Manejar cualquier excepción y mostrar el mensaje de error en la vista de inicio de sesión
                ViewBag.ErrorMessage = ex.Message;
                return View("Index", model);
            }
        }

        // Acción que maneja el cierre de sesión
        public ActionResult Logout()
        {
            // Cerrar sesión y redirigir a la página de inicio de sesión
            HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return RedirectToAction("Index");
        }
    }
}
