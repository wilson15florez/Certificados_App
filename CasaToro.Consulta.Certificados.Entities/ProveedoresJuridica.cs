using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CasaToro.Consulta.Certificados.Entities
{
    public class ProveedoresJuridica
    {
        public string idNum { get; set; }
        public string pjRazonSocial { get; set; }

        public string pjDirPrincipal { get; set; }
        public string pjCiudadDirPrincipal { get; set; }
        public string pjEmailDirPrincipal { get; set; }
        public string pjTelDirPrincipal { get; set; }

        // Lista de sucursales asociadas a la persona jurídica
        public List<SucursalesPJuridica> Sucursales { get; set; } = new List<SucursalesPJuridica>();

        //tabla de control
        public List<AccionistContrPJ> ControlRow { get; set; } = new List<AccionistContrPJ>();
    }
}
