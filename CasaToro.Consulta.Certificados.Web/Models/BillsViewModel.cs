using CasaToro.Consulta.Certificados.Entities;

namespace CasaToro.Consulta.Certificados.Web.Models
{
    /// <summary>
    /// Representa el modelo de vista que contiene una coleccion de facturas para presentar en la UI.
    /// </summary>
    public class BillsViewModel
    {
        public List<FacturasProveedore> Bills { get; set; }
    }
}
