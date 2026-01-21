using System;
using System.Collections.Generic;

namespace CasaToro.Consulta.Certificados.Entities;

public partial class Proveedores_FUCP
{
    public int Id_ProFUCP { get; set; }

    public string Nit { get; set; } = null!;

    public string? pvIngrMens { get; set; }

    public string? pvEgrMens { get; set; }

    public string? pvActivos { get; set; }

    public string? pvPasivos { get; set; }

    public string? pvPatrimonio { get; set; }

    public string? pvOtrIngr { get; set; }

    public string? pvPorNacional { get; set; }

    public string? pvPorExtranjero { get; set; }

    public string? pvPorPais { get; set; }

    public string? pvTipEmp { get; set; }

    public string? pvOtrTipEmp { get; set; }

    public string? pvAcEconomica { get; set; }

    public string? pvCodCIIU { get; set; }

    public string? pvCapSocReg { get; set; }

    public DateOnly? pvFechConst { get; set; }

    public DateOnly? pvFechVen { get; set; }

    public string? pvGrCon { get; set; }

    public DateOnly? pvFechResolGC { get; set; }

    public string? pvNumResolGC { get; set; }

    public string? pvDeclIndCom { get; set; }

    public string? pvDepartDec { get; set; }

    public string? pvCiudadDec { get; set; }

    public string? pvAutRet { get; set; }

    public string? pvNumResDIAN { get; set; }

    public string? pvForPag { get; set; }

    public string? pvEntBenef { get; set; }

    public string? pvPosCuBan { get; set; }

    public string? pvEntidad { get; set; }

    public string? pvNumCueBanc { get; set; }

    public string? pvClasCueBan { get; set; }

    public string? pvDeAuRepresentacion { get; set; }

    public string? pvFuenteRecur { get; set; }

    public string? pvTDPMotMaq { get; set; }

    public string? pvTDPCasTor { get; set; }

    public string? pvTDPBonap { get; set; }

    public string? pvTDPBellpi { get; set; }

    public string? pvRadAut { get; set; }

    public string? upIsOEA { get; set; }
}
