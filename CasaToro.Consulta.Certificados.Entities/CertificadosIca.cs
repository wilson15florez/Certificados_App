using System;
using System.Collections.Generic;

namespace CasaToro.Consulta.Certificados.Entities;

public partial class CertificadosIca
{
    public Guid IdIca { get; set; }

    public string Nit { get; set; } = null!;

    public int IdEmpresa { get; set; }

    public string Concepto { get; set; } = null!;

    public decimal Porcentaje { get; set; }

    public decimal Base { get; set; }

    public decimal Retenido { get; set; }

    public int Ano { get; set; }

    public int Periodo { get; set; }

    public string CiudadPago { get; set; } = null!;

    public string CiudadExpedido { get; set; } = null!;

    public DateOnly FechaExpedicion { get; set; }

    public virtual EmpresasMaster IdEmpresaNavigation { get; set; } = null!;

    public virtual Proveedores_Master NitNavigation { get; set; } = null!;

    public override string ToString()
    {
        return $"\nNit: {Nit}\nIdEmpresa: {IdEmpresa}\nConcepto: {Concepto}\nPorcentaje: {Porcentaje}\nBase: {Base}\nRetenido: {Retenido}\nAño: {Ano}\nPeriodo: {Periodo}\nCiudadPago: {CiudadPago}\nCiudadExpedido: {CiudadExpedido}\nFechaExpedicion: {FechaExpedicion}";
    }
}
