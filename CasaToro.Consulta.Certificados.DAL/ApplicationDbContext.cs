using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using CasaToro.Consulta.Certificados.Entities;

namespace CasaToro.Consulta.Certificados.DAL;

public partial class ApplicationDbContext : DbContext
{
    public ApplicationDbContext()
    {
    }

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Administradore> Administradores { get; set; }

    public virtual DbSet<CertificadosIca> CertificadosIcas { get; set; }

    public virtual DbSet<CertificadosIva> CertificadosIvas { get; set; }

    public virtual DbSet<CertificadosRtefte> CertificadosRteftes { get; set; }

    public virtual DbSet<EmpresasMaster> EmpresasMasters { get; set; }

    public virtual DbSet<EmpresasProveedore> EmpresasProveedores { get; set; }

    public virtual DbSet<FacturasProveedore> FacturasProveedores { get; set; }

    public virtual DbSet<LogDescarga> LogDescargas { get; set; }

    public virtual DbSet<LogLogin> LogLogins { get; set; }

    public virtual DbSet<LogLoginAdmin> LogLoginAdmins { get; set; }

    public virtual DbSet<ProveedoresMaster> ProveedoresMasters { get; set; }

    public virtual DbSet<ProveedoresJuridica> ProveedoresJuridicas { get; set; }

    public virtual DbSet<ProveedoresNatural> ProveedoresNaturals { get; set; }

    public virtual DbSet<AccionistContrPJ> AccionistContrPjs { get; set; }

    public virtual DbSet<SucursalesPJuridica> SucursalesPJuridicas { get; set; }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Administradore>(entity =>
        {
            entity.HasKey(e => e.IdAdmin).HasName("PK__Administ__F727A09E9A013BD0");

            entity.ToTable(tb =>
                {
                    tb.HasTrigger("trg_HashContrasenaAdmin");
                    tb.HasTrigger("trg_HashContrasenaDespuesDeActualizarAdmins");
                });

            entity.Property(e => e.IdAdmin)
                .HasMaxLength(15)
                .HasColumnName("Id_admin");
            entity.Property(e => e.Contrasena).HasMaxLength(70);
            entity.Property(e => e.Nombre).HasMaxLength(50);
        });

        modelBuilder.Entity<CertificadosIca>(entity =>
        {
            entity.HasKey(e => e.IdIca).HasName("PK__Certific__57B6BC0D2A462B48");

            entity.ToTable("Certificados_Ica", tb => tb.HasTrigger("trg_InsertEmpresasProveedores_Ica"));

            entity.HasIndex(e => new { e.Nit, e.Periodo, e.Ano, e.Retenido, e.Concepto, e.IdEmpresa }, "UQ_Certificados_Ica").IsUnique();

            entity.Property(e => e.IdIca)
                .HasDefaultValueSql("(newid())")
                .HasColumnName("Id_ica");
            entity.Property(e => e.Base).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CiudadExpedido)
                .HasMaxLength(100)
                .HasColumnName("Ciudad_expedido");
            entity.Property(e => e.CiudadPago)
                .HasMaxLength(100)
                .HasColumnName("Ciudad_pago");
            entity.Property(e => e.Concepto).HasMaxLength(155);
            entity.Property(e => e.FechaExpedicion).HasColumnName("Fecha_expedicion");
            entity.Property(e => e.IdEmpresa).HasColumnName("Id_empresa");
            entity.Property(e => e.Nit).HasMaxLength(20);
            entity.Property(e => e.Porcentaje).HasColumnType("decimal(5, 4)");
            entity.Property(e => e.Retenido).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.IdEmpresaNavigation).WithMany(p => p.CertificadosIcas)
                .HasForeignKey(d => d.IdEmpresa)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Certifica__Id_em__3B75D760");

            entity.HasOne(d => d.NitNavigation).WithMany(p => p.CertificadosIcas)
                .HasForeignKey(d => d.Nit)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Certificado__Nit__3C69FB99");
        });

        modelBuilder.Entity<CertificadosIva>(entity =>
        {
            entity.HasKey(e => e.IdIva).HasName("PK__Certific__57B6CAA2F94A6135");

            entity.ToTable("Certificados_Iva", tb => tb.HasTrigger("trg_InsertEmpresasProveedores_Iva"));

            entity.HasIndex(e => new { e.Nit, e.Periodo, e.Ano, e.Retenido, e.Concepto, e.IdEmpresa }, "UQ_Certificados_Iva").IsUnique();

            entity.Property(e => e.IdIva)
                .HasDefaultValueSql("(newid())")
                .HasColumnName("Id_iva");
            entity.Property(e => e.Base).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CiudadExpedido)
                .HasMaxLength(100)
                .HasColumnName("Ciudad_expedido");
            entity.Property(e => e.CiudadPago)
                .HasMaxLength(100)
                .HasColumnName("Ciudad_pago");
            entity.Property(e => e.Concepto).HasMaxLength(155);
            entity.Property(e => e.FechaExpedicion).HasColumnName("Fecha_expedicion");
            entity.Property(e => e.IdEmpresa).HasColumnName("Id_empresa");
            entity.Property(e => e.Iva).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Nit).HasMaxLength(20);
            entity.Property(e => e.Porcentaje).HasColumnType("decimal(5, 4)");
            entity.Property(e => e.PorcentajeIva)
                .HasColumnType("decimal(5, 4)")
                .HasColumnName("Porcentaje_iva");
            entity.Property(e => e.Retenido).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.IdEmpresaNavigation).WithMany(p => p.CertificadosIvas)
                .HasForeignKey(d => d.IdEmpresa)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Certifica__Id_em__36B12243");

            entity.HasOne(d => d.NitNavigation).WithMany(p => p.CertificadosIvas)
                .HasForeignKey(d => d.Nit)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Certificado__Nit__37A5467C");
        });

        modelBuilder.Entity<CertificadosRtefte>(entity =>
        {
            entity.HasKey(e => e.IdRtf).HasName("PK__Certific__2D9570702E802596");

            entity.ToTable("Certificados_Rtefte", tb => tb.HasTrigger("trg_InsertEmpresasProveedores_Rtefte"));

            entity.HasIndex(e => new { e.Nit, e.Mes, e.Ano, e.Retenido, e.Concepto, e.IdEmpresa }, "UQ_Certificados_Rtefte").IsUnique();

            entity.Property(e => e.IdRtf)
                .HasDefaultValueSql("(newid())")
                .HasColumnName("Id_rtf");
            entity.Property(e => e.Base).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CiudadExpedido)
                .HasMaxLength(100)
                .HasColumnName("Ciudad_expedido");
            entity.Property(e => e.CiudadPago)
                .HasMaxLength(100)
                .HasColumnName("Ciudad_pago");
            entity.Property(e => e.Concepto).HasMaxLength(155);
            entity.Property(e => e.FechaExpedicion).HasColumnName("Fecha_expedicion");
            entity.Property(e => e.IdEmpresa).HasColumnName("Id_empresa");
            entity.Property(e => e.Nit).HasMaxLength(20);
            entity.Property(e => e.Porcentaje).HasColumnType("decimal(5, 4)");
            entity.Property(e => e.Retenido).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.IdEmpresaNavigation).WithMany(p => p.CertificadosRteftes)
                .HasForeignKey(d => d.IdEmpresa)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Certifica__Id_em__403A8C7D");

            entity.HasOne(d => d.NitNavigation).WithMany(p => p.CertificadosRteftes)
                .HasForeignKey(d => d.Nit)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Certificado__Nit__412EB0B6");
        });

        modelBuilder.Entity<EmpresasMaster>(entity =>
        {
            entity.HasKey(e => e.IdEmpresa).HasName("PK__Empresas__AF698F54741EED11");

            entity.ToTable("Empresas_Master");

            entity.Property(e => e.IdEmpresa)
                .ValueGeneratedNever()
                .HasColumnName("Id_empresa");
            entity.Property(e => e.Direccion).HasMaxLength(80);
            entity.Property(e => e.Nit).HasMaxLength(20);
            entity.Property(e => e.Nombre).HasMaxLength(150);
        });

        modelBuilder.Entity<EmpresasProveedore>(entity =>
        {
            entity
                .HasNoKey()
                .ToTable("Empresas_Proveedores");

            entity.Property(e => e.IdEmpresa).HasColumnName("Id_empresa");
            entity.Property(e => e.Nit).HasMaxLength(20);

            entity.HasOne(d => d.IdEmpresaNavigation).WithMany()
                .HasForeignKey(d => d.IdEmpresa)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Empresas___Id_em__4BAC3F29");

            entity.HasOne(d => d.NitNavigation).WithMany()
                .HasForeignKey(d => d.Nit)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Empresas_Pr__Nit__4AB81AF0");
        });

        modelBuilder.Entity<FacturasProveedore>(entity =>
        {
            entity.HasKey(e => e.IdFactura).HasName("PK__Facturas__A6DB936201CBB716");

            entity.ToTable("Facturas_Proveedores", tb => tb.HasTrigger("trg_InsertEmpresasProveedores_Facturas"));

            entity.Property(e => e.IdFactura)
                .HasDefaultValueSql("(newid())")
                .HasColumnName("Id_factura");
            entity.Property(e => e.BancoReceptor)
                .HasMaxLength(100)
                .HasColumnName("Banco_receptor");
            entity.Property(e => e.CodigoSpiga).HasColumnName("Codigo_spiga");
            entity.Property(e => e.CuentaBancaria)
                .HasMaxLength(100)
                .HasColumnName("Cuenta_bancaria");
            entity.Property(e => e.Descripcion)
                .HasMaxLength(200)
                .IsUnicode(false);
            entity.Property(e => e.Estado).HasMaxLength(100);
            entity.Property(e => e.FechaFactura).HasColumnName("Fecha_factura");
            entity.Property(e => e.FechaPago).HasColumnName("Fecha_pago");
            entity.Property(e => e.IdEmpresa).HasColumnName("Id_empresa");
            entity.Property(e => e.Iva).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Moneda).HasMaxLength(80);
            entity.Property(e => e.Nit).HasMaxLength(20);
            entity.Property(e => e.NumeroFactura)
                .HasMaxLength(80)
                .HasColumnName("Numero_factura");
            entity.Property(e => e.ReteFuente)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("Rete_fuente");
            entity.Property(e => e.ReteIca)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("Rete_ica");
            entity.Property(e => e.ReteIva)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("Rete_iva");
            entity.Property(e => e.ValorPago)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("Valor_pago");
            entity.Property(e => e.ValorTotal)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("Valor_total");

            entity.HasOne(d => d.IdEmpresaNavigation).WithMany(p => p.FacturasProveedores)
                .HasForeignKey(d => d.IdEmpresa)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Facturas___Id_em__31EC6D26");

            entity.HasOne(d => d.NitNavigation).WithMany(p => p.FacturasProveedores)
                .HasForeignKey(d => d.Nit)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Facturas_Pr__Nit__32E0915F");
        });

        modelBuilder.Entity<LogDescarga>(entity =>
        {
            entity.HasKey(e => e.IdRegistroDescargas).HasName("PK__Log_desc__5A2FBC3A30DBCC25");

            entity.ToTable("Log_descargas");

            entity.Property(e => e.IdRegistroDescargas)
                .HasDefaultValueSql("(newid())")
                .HasColumnName("Id_registro_descargas");
            entity.Property(e => e.DocumentoDesc)
                .HasMaxLength(255)
                .HasColumnName("Documento_desc");
            entity.Property(e => e.FecDesc)
                .HasColumnType("datetime")
                .HasColumnName("Fec_desc");
            entity.Property(e => e.NitTercero)
                .HasMaxLength(20)
                .HasColumnName("Nit_tercero");
            entity.Property(e => e.NombreTercero)
                .HasMaxLength(255)
                .HasColumnName("Nombre_tercero");

            entity.HasOne(d => d.NitTerceroNavigation).WithMany(p => p.LogDescargas)
                .HasForeignKey(d => d.NitTercero)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Log_desca__Nit_t__44FF419A");
        });

        modelBuilder.Entity<LogLogin>(entity =>
        {
            entity.HasKey(e => e.IdRegistroLogin).HasName("PK__Log_logi__40CE60AD76E812B2");

            entity.ToTable("Log_login");

            entity.Property(e => e.IdRegistroLogin)
                .HasDefaultValueSql("(newid())")
                .HasColumnName("Id_registro_login");
            entity.Property(e => e.FecLogin)
                .HasColumnType("datetime")
                .HasColumnName("Fec_login");
            entity.Property(e => e.NitTercero)
                .HasMaxLength(20)
                .HasColumnName("Nit_tercero");
            entity.Property(e => e.NombreTercero)
                .HasMaxLength(255)
                .HasColumnName("Nombre_tercero");

            entity.HasOne(d => d.NitTerceroNavigation).WithMany(p => p.LogLogins)
                .HasForeignKey(d => d.NitTercero)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Log_login__Nit_t__48CFD27E");
        });

        modelBuilder.Entity<LogLoginAdmin>(entity =>
        {
            entity.HasKey(e => e.IdRegistroLogin).HasName("PK__Log_Logi__40CE60AD9335897F");

            entity.ToTable("Log_LoginAdmins");

            entity.Property(e => e.IdRegistroLogin)
                .HasDefaultValueSql("(newid())")
                .HasColumnName("Id_registro_login");
            entity.Property(e => e.FecLogin)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("Fec_login");
            entity.Property(e => e.IdAdmin)
                .HasMaxLength(15)
                .HasColumnName("Id_admin");
            entity.Property(e => e.NombreAdmin)
                .HasMaxLength(255)
                .HasColumnName("Nombre_admin");

            entity.HasOne(d => d.IdAdminNavigation).WithMany(p => p.LogLoginAdmins)
                .HasForeignKey(d => d.IdAdmin)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Log_Login__Id_ad__778AC167");
        });

        modelBuilder.Entity<ProveedoresMaster>(entity =>
        {
            entity.HasKey(e => e.Nit).HasName("PK__Proveedo__C7D1D6DBE690F0DC");

            entity.ToTable("Proveedores_Master", tb =>
                {
                    tb.HasTrigger("trg_HashContrasena");
                    tb.HasTrigger("trg_HashContrasenaDespuesDeActualizar");
                });

            entity.Property(e => e.Nit).HasMaxLength(20);
            entity.Property(e => e.Contrasena).HasMaxLength(255);
            entity.Property(e => e.Correo).HasMaxLength(100);
            entity.Property(e => e.Direccion).HasMaxLength(100);
            entity.Property(e => e.Nombre).HasMaxLength(255);
            entity.Property(e => e.Telefono).HasMaxLength(20);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
