namespace CasaToro.Consulta.Certificados.Web.Models
{
    /// <summary>
    /// Representa los requerimientos de informacion para un usuario iniciar secion, incluye las credenciales de usuario.
    /// </summary>
    public class LoginViewModel
    {
        public string UserName { get; set; }
        public string Password { get; set; }
    }
}
