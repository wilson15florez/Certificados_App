using System;
using System.Collections.Generic;

namespace CasaToro.Consulta.Certificados.Entities;

public partial class Sucursales_PJuridica
{
    public int Id_SucJuri { get; set; }

    public string NitProveedor { get; set; } = null!;

    public string? Direccion { get; set; }

    public string? Ciudad { get; set; }

    public string? Email { get; set; }

    public string? Telefono { get; set; }

    public virtual Proveedores_Juridica NitProveedorNavigation { get; set; } = null!;
}
