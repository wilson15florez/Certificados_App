using System;
using System.Collections.Generic;

namespace CasaToro.Consulta.Certificados.Entities;

public partial class Proveedores_FUCP
{
    public int Id_ProFUCP { get; set; }

    public string Nit { get; set; } = null!;

    public string? ingrMensuales { get; set; }

    public string? egreMensuales { get; set; }

    public string? activos { get; set; }

    public string? pasivos { get; set; }

    public string? patrimonio { get; set; }

    public string? otrosIngre { get; set; }

    public string? ocNacional { get; set; }

    public string? ocExtranjero { get; set; }

    public string? ocPaisExtr { get; set; }

    public string? tipEmpresa { get; set; }

    public string? actEconomica { get; set; }

    public int? codCIIU { get; set; }

    public string? capSoRegis { get; set; }

    public DateOnly? fechConsti { get; set; }

    public DateOnly? fechVenc { get; set; }

    public string? GranContrib { get; set; }

    public string? DeclaIndCom { get; set; }

    public string? autReten { get; set; }

    public string? fechNumResol { get; set; }

    public string? ciudad { get; set; }

    public string? numResulDIAN { get; set; }

    public string? formPagComExt { get; set; }

    public string? persEmprBenef { get; set; }

    public string? posCuenBanc { get; set; }

    public string? entidad { get; set; }

    public string? numCuenta { get; set; }

    public string? clasCuenta { get; set; }

    public string? aut_representacion { get; set; }

    public string? aut_fuentRecurs { get; set; }

    public string? aut_motorysa { get; set; }

    public string? aut_casatoro { get; set; }

    public string? aut_bonaparte { get; set; }

    public string? aut_bellpi { get; set; }

    public string? aut_TraDatos { get; set; }
}
