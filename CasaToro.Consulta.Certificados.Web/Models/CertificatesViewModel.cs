using CasaToro.Consulta.Certificados.Entities;

namespace CasaToro.Consulta.Certificados.Web.Models
{
    /// <summary>
    /// Representa el modelo de informacion para certificados, incluyendo empresas asociadas, años y meses.
    /// </summary>
    public class CertificatesViewModel
    {
        public List<EmpresasMaster> companies ;
        public HashSet<int> years;
        public HashSet<string> months;
    }
}
