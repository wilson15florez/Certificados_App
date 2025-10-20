using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CasaToro.Consulta.Certificados.Entities
{
    public class ProveedoresNatural
    {
        public string idNum { get; set; }
        public string pnNombreCompl { get; set; }
        public string pnNacDoc { get; set; }
        public string pnExtDoc { get; set; }

        public string pnFechaExpDoc { get; set; }
        public string pnLugExpDoc { get; set; }
        public string pnFechaNac { get; set; }
        public string pnLugNac { get; set; }
        public string pnNacionalidad { get; set; }

        public string pnDiResidencia { get; set; }
        public string pnCiudad { get; set; }
        public string pnTelefono { get; set; }
        public string pnCelular { get; set; }
        public string pnEmail { get; set; }

        public string pnOficProfe { get; set; }
        public string pnActividad { get; set; }

        public string pnReconoPublic { get; set; }
        public string pnManRePub { get; set; }
        public string pnPEP { get; set; }
        public string pnPEP_Entidad { get; set; }
        public List<string> pnPEPType { get; set; }
    }
}
