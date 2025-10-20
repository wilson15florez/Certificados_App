using System;
using System.Collections.Generic;

namespace CasaToro.Consulta.Certificados.Entities;

public partial class Proveedores_Juridica
{
    public string Nit { get; set; } = null!;

    public string pjRazSocial { get; set; } = null!;

    public string? pjDirPrincipal { get; set; }

    public string? pjCiudadDirPrincipal { get; set; }

    public string? pjEmailDirPrincipal { get; set; }

    public string? pjTelDirPrincipal { get; set; }

    public virtual ICollection<AccionistasControlPJuridica> AccionistasControlPJuridica { get; set; } = new List<AccionistasControlPJuridica>();

    public virtual ICollection<Sucursales_PJuridica> Sucursales_PJuridica { get; set; } = new List<Sucursales_PJuridica>();
}
