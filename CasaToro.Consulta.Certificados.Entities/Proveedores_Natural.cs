using System;
using System.Collections.Generic;

namespace CasaToro.Consulta.Certificados.Entities;

public partial class Proveedores_Natural
{
    public int Id_ProNatu { get; set; }

    public string Nit { get; set; } = null!;

    public string? pnNombreCompl { get; set; }

    public string? pnNacDoc { get; set; }

    public string? pnExtDoc { get; set; }

    public DateOnly? pnFechaExpDoc { get; set; }

    public string? pnLugExpDoc { get; set; }

    public DateOnly? pnFechaNac { get; set; }

    public string? pnLugNac { get; set; }

    public string? pnNacionalidad { get; set; }

    public string? pnDiResidencia { get; set; }

    public string? pnCiudad { get; set; }

    public string? pnTelefono { get; set; }

    public string? pnCelular { get; set; }

    public string? pnEmail { get; set; }

    public string? pnOficProfe { get; set; }

    public string? pnActividad { get; set; }

    public string? pnReconoPublic { get; set; }

    public string? pnManRePub { get; set; }

    public string? pnPEP { get; set; }

    public string? pnPEP_Entidad { get; set; }
}
