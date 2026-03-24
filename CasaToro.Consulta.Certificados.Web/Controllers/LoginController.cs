using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using CasaToro.Consulta.Certificados.Web.Models;
using CasaToro.Consulta.Certificados.BL.Services;


namespace CasaToro.Consulta.Certificados.Web.Controllers
{
    /// <summary>
    /// Controlador de autenticación del sistema.
    /// Gestiona el inicio de sesión de proveedores y administradores,
    /// y el cierre de sesión. No requiere autorización previa.
    /// </summary>
    public class LoginController : Controller
    {
        private readonly LoginService _loginService;

        /// <summary>
        /// Constructor. Recibe el servicio de autenticación por inyección de dependencias.
        /// </summary>
        public LoginController(LoginService loginService)
        {
            _loginService = loginService;
        }

        /// <summary>
        /// Muestra la vista de inicio de sesión.
        /// </summary>
        /// <returns>Vista del formulario de login.</returns>
        public ActionResult Index()
        {
            return View();
        }

        /// <summary>
        /// Procesa el formulario de inicio de sesión.
        /// Autentica al usuario, crea la cookie de sesión y redirige según el rol:
        /// proveedores van a <c>Provider/Certificates</c>, administradores a <c>Admin/UpdateInfo</c>.
        /// </summary>
        /// <param name="model">Modelo con <c>UserName</c> y <c>Password</c>.</param>
        /// <returns>
        /// Redirección a la vista principal del rol correspondiente si la autenticación es exitosa,
        /// o vista de login con mensaje de error si falla.
        /// </returns>
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

        /// <summary>
        /// Cierra la sesión del usuario autenticado y redirige a la página de login.
        /// </summary>
        /// <returns>Redirección a <c>Login/Index</c>.</returns>
        public ActionResult Logout()
        {
            // Cerrar sesión y redirigir a la página de inicio de sesión
            HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return RedirectToAction("Index");
        }
    }
}
