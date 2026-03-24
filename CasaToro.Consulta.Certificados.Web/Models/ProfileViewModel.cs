using CasaToro.Consulta.Certificados.Entities;

namespace CasaToro.Consulta.Certificados.Web.Models
{
    /// <summary>
    /// Representa el modelo de vista para un perfil de usuario, conteniendo la informacion del proveedor.
    /// </summary>
    public class ProfileViewModel
    {
        public Proveedores_Master Provider { get; set; }
    }
}
