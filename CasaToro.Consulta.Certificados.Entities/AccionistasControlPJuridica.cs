using System;
using System.Collections.Generic;

namespace CasaToro.Consulta.Certificados.Entities;

public partial class AccionistasControlPJuridica
{
    public int Id_Control { get; set; }

    public string NitProveedor { get; set; } = null!;

    public string? razonSocial { get; set; }

    public string? idType { get; set; }

    public string? idNum { get; set; }

    public decimal? porcentaje { get; set; }

    public virtual Proveedores_Juridica NitProveedorNavigation { get; set; } = null!;
}
