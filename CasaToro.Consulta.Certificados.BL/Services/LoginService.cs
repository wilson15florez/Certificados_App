using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Extensions.Configuration;
using CasaToro.Consulta.Certificados.Entities;
using System.Security.Cryptography;
using System.Text;
using System.Security.Policy;

namespace CasaToro.Consulta.Certificados.BL.Services
{
    public class LoginService
    {
        private readonly ProviderService _providerService;
        private readonly LogService _logService;
        private readonly AdminService _adminService;

        /// <summary>
        /// Constructor de la clase LoginService.
        /// </summary>
        /// <param name="providerService">Servicio para manejar proveedores.</param>
        /// <param name="logService">Servicio para manejar logs.</param>
        /// <param name="adminService">Servicio para manejar administradores.</param>
        public LoginService(ProviderService providerService, LogService logService, AdminService adminService)
        {
            _providerService = providerService;
            _logService = logService;
            _adminService = adminService;
        }

        /// <summary>
        /// Autentica a un usuario basado en su nombre de usuario y contraseña.
        /// </summary>
        /// <param name="user">Nombre de usuario o NIT del usuario.</param>
        /// <param name="pass">Contraseña del usuario.</param>
        /// <returns>Una tupla que indica si la autenticación fue exitosa, el ClaimsPrincipal del usuario, un mensaje de error si lo hay, y si el usuario es un administrador.</returns>

        public (bool IsAuthenticated, ClaimsPrincipal Principal, string ErrorMessage, bool isAdmin) Authenticate(string user, string pass)
        {
            try
            {
                Administradore admin = _adminService.getAdminById(user);
                if (admin != null && admin.Contrasena == HashSHA256(pass))
                {
                    return CreateClaimsPrincipal(admin.Nombre, admin.IdAdmin, true);
                }

                Proveedores_Master provider = _providerService.getProviderByNit(user);
                if (provider != null && provider.Contrasena == HashSHA256(pass))
                {
                    return CreateClaimsPrincipal(provider.Nombre, provider.Nit, false);
                }

                return (false, null, "Usuario o contraseña incorrectos", false);
            }
            catch (Exception ex)
            {
                return (false, null, "Ocurrió un error durante la autenticación", false);
            }
        }

        /// <summary>
        /// Crea un ClaimsPrincipal con la información del usuario autenticado.
        /// </summary>
        /// <param name="name">Nombre del usuario.</param>
        /// <param name="id">Identificador del usuario (NIT o ID de administrador).</param>
        /// <param name="isAdmin">Indica si el usuario es un administrador.</param>
        /// <returns>Una tupla que indica si la autenticación fue exitosa, el ClaimsPrincipal del usuario, un mensaje de error si lo hay, y si el usuario es un administrador.</returns>
        private (bool IsAuthenticated, ClaimsPrincipal Principal, string ErrorMessage, bool isAdmin) CreateClaimsPrincipal(string name, string id, bool isAdmin)
        {
            var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.Name, name),
                    new Claim("NIT", id),
                    new Claim(ClaimTypes.Role, isAdmin ? "Admin" : "Provider")
                };

            var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

            if (isAdmin)
            {
                var logAdmin = new LogLoginAdmin
                {
                    IdRegistroLogin = Guid.NewGuid(),
                    IdAdmin = id,
                    NombreAdmin = name,
                    FecLogin = DateTime.Now
                };
                _logService.addLogLoginAdmin(logAdmin);
                return (true, new ClaimsPrincipal(claimsIdentity), null, isAdmin);
            }
            else
            {
                var log = new LogLogin
                {
                    IdRegistroLogin = Guid.NewGuid(),
                    NitTercero = id,
                    NombreTercero = name,
                    FecLogin = DateTime.Now
                };

                _logService.addLogLogin(log);
            }

            return (true, new ClaimsPrincipal(claimsIdentity), null, isAdmin);
        }

        /// <summary>
        /// Hashea una cadena de texto utilizando el algoritmo SHA256.
        /// </summary>
        /// <param name="input">Cadena de texto a hashear.</param>
        /// <returns>Cadena de texto hasheada en formato hexadecimal.</returns>
        public static string HashSHA256(string input)
        {
            using (SHA256 sha256 = SHA256.Create())
            {
                byte[] bytes = Encoding.Unicode.GetBytes(input);
                byte[] hash = sha256.ComputeHash(bytes);

                return BitConverter.ToString(hash).Replace("-", "");
            }
        }
    }
}
