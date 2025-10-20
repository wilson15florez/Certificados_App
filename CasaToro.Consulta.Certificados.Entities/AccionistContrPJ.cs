using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CasaToro.Consulta.Certificados.Entities
{
    public class AccionistContrPJ
    {
        public string NitProveedor { get; set; }
        public string razonSocial { get; set; }
        public string idType { get; set; }
        public string idNum { get; set; }
        public decimal porcentaje { get; set; }
    }
}
