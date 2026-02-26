using System;
using System.Collections.Generic;

namespace CasaToro.Consulta.Certificados.Entities;

public partial class Proveedores_Master
{
    public string Nit { get; set; } = null!;

    public string? Direccion { get; set; }

    public string? Correo { get; set; }

    public string? Telefono { get; set; }

    public string Nombre { get; set; } = null!;

    public string? Contrasena { get; set; }

    public string? TipoPersona { get; set; }

    public DateOnly? FechaDiligencia_Formato { get; set; }

    public string? TipoTramite_Formato { get; set; }

    public virtual ICollection<CertificadosIca> CertificadosIcas { get; set; } = new List<CertificadosIca>();

    public virtual ICollection<CertificadosIva> CertificadosIvas { get; set; } = new List<CertificadosIva>();

    public virtual ICollection<CertificadosRtefte> CertificadosRteftes { get; set; } = new List<CertificadosRtefte>();

    public virtual ICollection<FacturasProveedore> FacturasProveedores { get; set; } = new List<FacturasProveedore>();

    public virtual ICollection<LogDescarga> LogDescargas { get; set; } = new List<LogDescarga>();

    public virtual ICollection<LogLogin> LogLogins { get; set; } = new List<LogLogin>();
}
