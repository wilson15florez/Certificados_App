using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace CasaToro.Consulta.Certificados.Entities;

public partial class Proveedores_Natural
{
    public int Id_ProNatu { get; set; }

    public string Nit { get; set; } = null!;

    public string? pnPrimerApell { get; set; }

    public string? pnSegundoApell { get; set; }

    public string pnNombres { get; set; } = null!;

    public string? pnTipoNacionalidad { get; set; }

    public string? pnTipoDoc { get; set; }

    public DateOnly? pnFechaExpDoc { get; set; }

    public string? pnDepExpDoc { get; set; }

    public string? pnCiuExpDoc { get; set; }

    public DateOnly? pnFechaNac { get; set; }

    public string? pnNacionalidad { get; set; }

    public string? pnEstadoNac { get; set; }

    public string? pnCiudadNac { get; set; }

    public string? pnDiResidencia { get; set; }

    public string? pnDepRes { get; set; }

    public string? pnCiudadRes { get; set; }

    public string? pnTelefono { get; set; }

    public string? pnCelular { get; set; }

    public string? pnEmail { get; set; }

    public string? pnOficProfe { get; set; }

    public string? pnActividad { get; set; }

    public string? pnReconoPublic { get; set; }

    public string? pnManRePub { get; set; }

    public string? pnPEP { get; set; }

    public string? pnPEP_Entidad { get; set; }

    public DateOnly? pnValidAnual { get; set; }

    [NotMapped]
    public List<int> PEPTypes { get; set; } = new List<int>();
}
