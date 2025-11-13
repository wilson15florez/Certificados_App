using System;
using System.Collections.Generic;

namespace CasaToro.Consulta.Certificados.Entities;

public partial class Proveedores_Juridica
{
    public int Id_ProJuri { get; set; }

    public string Nit { get; set; } = null!;

    public string pjRazSocial { get; set; } = null!;

    public string? pjDirPrincipal { get; set; }

    public string? pjDepartDirPrincipal { get; set; }

    public string? pjCiudadDirPrincipal { get; set; }

    public string? pjEmailDirPrincipal { get; set; }

    public string? pjTelDirPrincipal { get; set; }

    public string? pjNomReLeg { get; set; }

    public string? pjRLTipNacionalidad { get; set; }

    public string? pjRLRadNac { get; set; }

    public string? pjRLRadExtr { get; set; }

    public string? pjRLDocNum { get; set; }

    public DateOnly? pjRLFechExpDoc { get; set; }

    public string? pjRLDepExpDoc { get; set; }

    public string? pjRLCiuExpDoc { get; set; }

    public DateOnly? pjRLFechaNac { get; set; }

    public string? pjRLNacionalidad { get; set; }

    public string? pjRLDepartNac { get; set; }

    public string? pjRLCiudadNac { get; set; }

    public virtual ICollection<AccionistasControlPJuridica> AccionistasControlPJuridica { get; set; } = new List<AccionistasControlPJuridica>();

    public virtual ICollection<Sucursales_PJuridica> Sucursales_PJuridica { get; set; } = new List<Sucursales_PJuridica>();
}
