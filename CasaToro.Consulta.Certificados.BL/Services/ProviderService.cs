using CasaToro.Consulta.Certificados.Entities;
using Microsoft.EntityFrameworkCore;
using CasaToro.Consulta.Certificados.DAL;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using System.Dynamic;
using Microsoft.AspNetCore.Http;

namespace CasaToro.Consulta.Certificados.BL.Services
{
    public class ProviderService
    {
        private readonly ApplicationDbContext _context;
        // Constructor de la clase que recibe una instancia de ApplicationDbContext (db)
        public ProviderService(ApplicationDbContext context)
        {
            _context = context;
        }

        // Método que obtiene la lista de proveedores paginada
        public List<Proveedores_Master> getProviders(int pageNumber, int pageSize, string? search = null)
        {
            try
            {
                var query = _context.Proveedores_Master.AsQueryable(); // Obtiene la consulta sin ejecutarla aún

                // Aplicar filtro si hay búsqueda
                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(p => p.Nit.ToLower().Contains(search.ToLower()) ||
                                             p.Nombre.ToLower().Contains(search.ToLower()));
                }

                // Aplicar paginación
                var providers = query.Skip((pageNumber - 1) * pageSize)
                                     .Take(pageSize)
                                     .ToList();

                return providers;
            }
            catch (Exception ex)
            {
                throw new Exception("Error al obtener la lista de proveedores", ex);
            }
        }


        // Método que obtiene la cantidad de proveedores
        public int getProvidersCount(string? search = null)
        {
            return _context.Proveedores_Master
                                     .Where(p => string.IsNullOrEmpty(search) ||
                                                 p.Nit.ToLower().Contains(search.ToLower()) ||
                                                 p.Nombre.ToLower().Contains(search.ToLower()))
                                     .Count();
        }

        //Método que obtiene un proveedor por su NIT
        public Proveedores_Master getProviderByNit(string nit)
        {
            return _context.Proveedores_Master.FirstOrDefault(p => p.Nit != null && p.Nit.Equals(nit));
        }

        public Proveedores_FUCP? getFUCPByNit(string nit)
        {
            return _context.Proveedores_FUCP.FirstOrDefault(f => f.Nit == nit);
        }

        // Método que obtiene las empresas asociadas a un proveedor
        public List<EmpresasMaster> GetCompaniesForProvider(string nit)

        {
            return _context.EmpresasProveedores
                           .Include(c => c.IdEmpresaNavigation)
                           .Where(ep => ep.Nit == nit)
                           .Select(ep => ep.IdEmpresaNavigation)
                           .ToList();
        }

        //Metodo para actualizar la información de un proveedor en la tabla master
        public void UpdateProvider(Proveedores_Master provider)
        {
            try
            {
                var existingProvider = _context.Proveedores_Master.FirstOrDefault(p => p.Nit == provider.Nit);
                if (existingProvider != null)
                {
                    // Actualizar la entidad existente
                    _context.Entry(existingProvider).CurrentValues.SetValues(provider);
                    _context.SaveChanges();
                    Console.WriteLine("proovedor actualizado");
                }
            }
            catch (Exception ex)
            {
                throw new Exception("Error al actualizar el proveedor", ex);
            }
        }

        //Metodo que obtiene la información detallada de un proveedor ya sea persona natural o jurídica y el FUCP
        public async Task<dynamic> getProviderDetails(string nit, string personType)
        {
            ExpandoObject MakeDynamic(
                bool existNatu,
                bool existJuri,
                bool existFUCP,
                object? natural,
                object? juridica,
                object? fucp
            )
            {
                dynamic d = new ExpandoObject();
                d.existNatu = existNatu;
                d.existJuri = existJuri;
                d.existFUCP = existFUCP;
                d.natural = natural;
                d.juridica = juridica;
                d.fucp = fucp;
                return d;
            }

            var fucpData = await _context.Proveedores_FUCP
                                        .FirstOrDefaultAsync(f => f.Nit == nit);

            Dictionary<string, object>? mapFUCPdata = null;

            if (fucpData != null)
            {
                mapFUCPdata = new Dictionary<string, object>
                {
                    { "Nit", fucpData.Nit },
                    { "pvIngrMens", fucpData.pvIngrMens },
                    { "pvEgrMens", fucpData.pvEgrMens },
                    { "pvActivos", fucpData.pvActivos },
                    { "pvPasivos", fucpData.pvPasivos },
                    { "pvPatrimonio", fucpData.pvPatrimonio },
                    { "pvOtrIngr", fucpData.pvOtrIngr },
                    { "pvPorNacional", fucpData.pvPorNacional },
                    { "pvPorExtranjero", fucpData.pvPorExtranjero },
                    { "pvPorPais", fucpData.pvPorPais },
                    { "pvTipEmp", fucpData.pvTipEmp },
                    { "pvOtrTipEmp", fucpData.pvOtrTipEmp },
                    { "pvAcEconomica", fucpData.pvAcEconomica },
                    { "pvCodCIIU", fucpData.pvCodCIIU },
                    { "pvCapSocReg", fucpData.pvCapSocReg },
                    { "pvFechConst", fucpData.pvFechConst?.ToString("yyyy-MM-dd") },
                    { "pvFechVen", fucpData.pvFechVen?.ToString("yyyy-MM-dd") },
                    { "pvGrCon", fucpData.pvGrCon },
                    { "pvDeclIndCom", fucpData.pvDeclIndCom },
                    { "pvAutRet", fucpData.pvAutRet },
                    { "pvFechResolGC", fucpData.pvFechResolGC?.ToString("yyyy-MM-dd") },
                    { "pvNumResolGC", fucpData.pvNumResolGC },
                    { "pvDepartDec", fucpData.pvDepartDec },
                    { "pvCiudadDec", fucpData.pvCiudadDec },
                    { "pvNumResDIAN", fucpData.pvNumResDIAN },
                    { "pvForPag", fucpData.pvForPag },
                    { "pvEntBenef", fucpData.pvEntBenef },
                    { "pvPosCuBan", fucpData.pvPosCuBan },
                    { "pvEntidad", fucpData.pvEntidad },
                    { "pvNumCueBanc", fucpData.pvNumCueBanc },
                    { "pvClasCueBan", fucpData.pvClasCueBan },
                    { "pvDeAuRepresentacion", fucpData.pvDeAuRepresentacion },
                    { "pvFuenteRecur", fucpData.pvFuenteRecur },
                    { "pvTDPBonap", fucpData.pvTDPBonap },
                    { "pvTDPBellpi", fucpData.pvTDPBellpi },
                    { "pvTDPMotMaq", fucpData.pvTDPMotMaq },
                    { "pvTDPCasTor", fucpData.pvTDPCasTor },
                    { "pvRadAut", fucpData.pvRadAut },
                    { "upIsOEA", fucpData.upIsOEA }
                };
            }

            if (personType.Equals("natural", StringComparison.OrdinalIgnoreCase))
            {
                var naturalData = await _context.Proveedores_Natural
                                                    .FirstOrDefaultAsync(p => p.Nit == nit);
                if (naturalData == null)
                {
                    return MakeDynamic
                    (
                        existNatu: false,
                        existJuri: false,
                        existFUCP: (mapFUCPdata != null),
                        natural: null,
                        juridica: null,
                        fucp: mapFUCPdata

                        );
                }

                var pepTipos = await _context.PEPtipos_ProveedoresNatural
                                                .Where(t => t.NitProveedor == nit)
                                                .Select(t => t.TipoPEPid)
                                                .ToListAsync();

                var mapNaturalData = new Dictionary<string, object>
                    {
                        {"Nit", naturalData.Nit },
                        {"pnNombreCompl", naturalData.pnNombreCompl },

                        {"pnTipoNacionalidad", naturalData.pnTipoNacionalidad },
                        {"pnTipoDoc", naturalData.pnTipoDoc },
                        {"pnFechaExpDoc", naturalData.pnFechaExpDoc?.ToString("yyyy-MM-dd") },
                        {"pnDepExpDoc", naturalData.pnDepExpDoc },
                        {"pnCiuExpDoc", naturalData.pnCiuExpDoc },

                        {"pnFechaNac", naturalData.pnFechaNac?.ToString("yyyy-MM-dd") },
                        {"pnEstadoNac", naturalData.pnEstadoNac },
                        {"pnCiudadNac", naturalData.pnCiudadNac },
                        {"pnNacionalidad", naturalData.pnNacionalidad },
                        {"pnDiResidencia", naturalData.pnDiResidencia },
                        {"pnDepRes", naturalData.pnDepRes },
                        {"pnCiudadRes", naturalData.pnCiudadRes },

                        {"pnTelefono", naturalData.pnTelefono },
                        {"pnCelular", naturalData.pnCelular },
                        {"pnEmail", naturalData.pnEmail },

                        {"pnOficProfe", naturalData.pnOficProfe },
                        {"pnActividad", naturalData.pnActividad },
                        {"pnReconoPublic", naturalData.pnReconoPublic },
                        {"pnManRePub", naturalData.pnManRePub },

                        {"pnPEP", naturalData.pnPEP },
                        {"PEPTypes", pepTipos },
                        {"pnPEP_Entidad", naturalData.pnPEP_Entidad },

                        { "FUCP", mapFUCPdata }
                    };

                return MakeDynamic
                (
                    existNatu: true,
                    existJuri: false,
                    existFUCP: (mapFUCPdata != null),
                    natural: mapNaturalData,
                    juridica: null,
                    fucp: mapFUCPdata
                );
            }

            if (personType.Equals("juridica", StringComparison.OrdinalIgnoreCase))
            {
                var juridicaData = await _context.Proveedores_Juridica
                                                    .FirstOrDefaultAsync(p => p.Nit == nit);
                if (juridicaData == null)
                {
                    return MakeDynamic
                    (
                        existNatu: false,
                        existJuri: false,
                        existFUCP: (mapFUCPdata != null),
                        natural: null,
                        juridica: null,
                        fucp: mapFUCPdata
                    );
                }

                var sucursales = await _context.Sucursales_PJuridica
                                            .Where(s => s.NitProveedor == nit)
                                            .ToListAsync();
                var accionistas = await _context.AccionistasControlPJuridica
                                            .Where(a => a.NitProveedor == nit)
                                            .ToListAsync();

                //mapea los datos
                var mapJuridicaData = new Dictionary<string, object>
                    {
                        {"Nit",juridicaData.Nit},
                        {"pjRazSocial",juridicaData.pjRazSocial},
                        {"pjDirPrincipal",juridicaData.pjDirPrincipal},
                        {"pjDepartDirPrincipal",juridicaData.pjDepartDirPrincipal },
                        {"pjCiudadDirPrincipal",juridicaData.pjCiudadDirPrincipal},
                        {"pjEmailDirPrincipal",juridicaData.pjEmailDirPrincipal},
                        {"pjTelDirPrincipal",juridicaData.pjTelDirPrincipal},
                        {"pjNomReLeg",juridicaData.pjNomReLeg},
                        {"pjRLTipNacionalidad",juridicaData.pjRLTipNacionalidad},
                        {"pjRLTipoDoc",juridicaData.pjRLTipoDoc},
                        {"pjRLDocNum",juridicaData.pjRLDocNum},
                        {"pjRLFechExpDoc",juridicaData.pjRLFechExpDoc?.ToString("yyyy-MM-dd")},
                        {"pjRLDepExpDoc",juridicaData.pjRLDepExpDoc},
                        {"pjRLCiuExpDoc",juridicaData.pjRLCiuExpDoc },
                        {"pjRLFechaNac",juridicaData.pjRLFechaNac?.ToString("yyyy-MM-dd")},
                        {"pjRLNacionalidad",juridicaData.pjRLNacionalidad},
                        {"pjRLDepartNac",juridicaData.pjRLDepartNac},
                        {"pjRLCiudadNac",juridicaData.pjRLCiudadNac},

                        {"Sucursales", sucursales.Select(s => new
                        {
                            pjSucursalDir = s.Direccion,
                            pjSucursalDepart = s.Departamento,
                            pjSucursalCiudad = s.Ciudad,
                            pjSucursalEmail = s.Email,
                            pjSucursalTel = s.Telefono
                        }).ToList()},

                        {"ControlRow", accionistas.Select(a => new
                        {
                            razonSocial = a.razonSocial,
                            idType = a.idType,
                            idNum = a.idNum,
                            porcentaje = a.porcentaje
                        }).ToList() },

                        {  "FUCP", mapFUCPdata   }
                    };

                return MakeDynamic
                (
                    existNatu: false,
                    existJuri: true,
                    existFUCP: (mapFUCPdata != null),
                    natural: null,
                    juridica: mapJuridicaData,
                    fucp: mapFUCPdata
                );
            }

            return MakeDynamic(false, false, false, null, null, null);
        }

        public List<Documentos_Proveedores> GetDocumentsByNit(string nit)
        {
            return _context.Documentos_Proveedores
                .Where(d => d.NitProveedor == nit)
                .ToList();
        }

        //metodo para actualizar proveedor natural
        public void UpdateNaturalInfo(Proveedores_Natural providerData)
        {
            using (var transaction = _context.Database.BeginTransaction())
            {
                try
                {
                    string providerNit = providerData.Nit;

                    var existingMaster = _context.Proveedores_Master.FirstOrDefault(p => p.Nit == providerNit);
                    if (existingMaster != null)
                    {
                        existingMaster.Nombre = providerData.pnNombreCompl.ToUpper();
                        existingMaster.Direccion = providerData.pnDiResidencia;
                        existingMaster.Correo = providerData.pnEmail;
                        existingMaster.Telefono = !string.IsNullOrWhiteSpace(providerData.pnTelefono) ? providerData.pnTelefono : providerData.pnCelular;
                    }

                    var existingNatural = _context.Proveedores_Natural.FirstOrDefault(p => p.Nit == providerNit);
                    if (existingNatural != null)
                    {
                        existingNatural.pnNombreCompl = providerData.pnNombreCompl;
                        existingNatural.pnDiResidencia = providerData.pnDiResidencia;
                        existingNatural.pnDepRes = providerData.pnDepRes;
                        existingNatural.pnCiudadRes = providerData.pnCiudadRes;
                        existingNatural.pnEmail = providerData.pnEmail;
                        existingNatural.pnTelefono = providerData.pnTelefono;
                        existingNatural.pnCelular = providerData.pnCelular;

                        existingNatural.pnTipoNacionalidad = providerData.pnTipoNacionalidad;
                        existingNatural.pnTipoDoc = providerData.pnTipoDoc;
                        existingNatural.pnFechaExpDoc = providerData.pnFechaExpDoc;
                        existingNatural.pnDepExpDoc = providerData.pnDepExpDoc;
                        existingNatural.pnCiuExpDoc = providerData.pnCiuExpDoc;

                        existingNatural.pnFechaNac = providerData.pnFechaNac;
                        existingNatural.pnEstadoNac = providerData.pnEstadoNac;
                        existingNatural.pnCiudadNac = providerData.pnCiudadNac;
                        existingNatural.pnNacionalidad = providerData.pnNacionalidad;

                        existingNatural.pnOficProfe = providerData.pnOficProfe;
                        existingNatural.pnActividad = providerData.pnActividad;

                        existingNatural.pnReconoPublic = providerData.pnReconoPublic;
                        existingNatural.pnManRePub = providerData.pnManRePub;
                        existingNatural.pnPEP = providerData.pnPEP;
                        existingNatural.pnPEP_Entidad = providerData.pnPEP_Entidad;
                    }
                    else
                    {
                        throw new Exception($"Registro detallado para Persona Natural con NIT {providerNit} no encontrado.");
                    }

                    var oldPEP = _context.PEPtipos_ProveedoresNatural.Where(p => p.NitProveedor == providerNit);
                    _context.PEPtipos_ProveedoresNatural.RemoveRange(oldPEP);

                    if (providerData.PEPTypes != null && providerData.PEPTypes.Any())
                    {
                        var validPEPIds = _context.PEPtipos.Where(t => providerData.PEPTypes.Contains(t.IdPEP))
                                                             .Select(t => t.IdPEP)
                                                             .ToList();
                        var old = _context.PEPtipos_ProveedoresNatural.Where(p => p.NitProveedor == providerNit);
                        _context.PEPtipos_ProveedoresNatural.RemoveRange(old);

                        foreach (var id in validPEPIds)
                        {
                            _context.PEPtipos_ProveedoresNatural.Add(new PEPtipos_ProveedoresNatural
                            {
                                NitProveedor = providerNit,
                                TipoPEPid = id
                            });
                        }
                    }
                    else
                    {
                        var old = _context.PEPtipos_ProveedoresNatural.Where(p => p.NitProveedor == providerNit);
                        _context.PEPtipos_ProveedoresNatural.RemoveRange(old);
                    }
                    _context.SaveChanges();
                    transaction.Commit();
                }
                catch (Exception ex)
                {
                    transaction.Rollback();
                    throw new Exception("Error al actualizar la información de la persona natural: " + ex.Message, ex);
                }

            }
        }

        //metodo para actualizar proveedor juridico
        public void UpdateJuridicaInfo(Proveedores_Juridica providerData)
        {
            string providerNit = providerData.Nit;

            using (var transaction = _context.Database.BeginTransaction())
            {
                try
                {
                    var existingJuridica = _context.Proveedores_Juridica.FirstOrDefault(p => p.Nit == providerNit);

                    if (existingJuridica == null)
                        throw new Exception($"Registro detallado para NIT {providerNit} no encontrado.");

                    existingJuridica.pjRazSocial = providerData.pjRazSocial;
                    existingJuridica.pjDirPrincipal = providerData.pjDirPrincipal;
                    existingJuridica.pjDepartDirPrincipal = providerData.pjDepartDirPrincipal;
                    existingJuridica.pjCiudadDirPrincipal = providerData.pjCiudadDirPrincipal;
                    existingJuridica.pjEmailDirPrincipal = providerData.pjEmailDirPrincipal;
                    existingJuridica.pjTelDirPrincipal = providerData.pjTelDirPrincipal;

                    existingJuridica.pjNomReLeg = providerData.pjNomReLeg;
                    existingJuridica.pjRLTipNacionalidad = providerData.pjRLTipNacionalidad;
                    existingJuridica.pjRLTipoDoc = providerData.pjRLTipoDoc;
                    existingJuridica.pjRLDocNum = providerData.pjRLDocNum;
                    existingJuridica.pjRLFechExpDoc = providerData.pjRLFechExpDoc;
                    existingJuridica.pjRLDepExpDoc = providerData.pjRLDepExpDoc;
                    existingJuridica.pjRLCiuExpDoc = providerData.pjRLCiuExpDoc;
                    existingJuridica.pjRLFechaNac = providerData.pjRLFechaNac;
                    existingJuridica.pjRLNacionalidad = providerData.pjRLNacionalidad;
                    existingJuridica.pjRLDepartNac = providerData.pjRLDepartNac;
                    existingJuridica.pjRLCiudadNac = providerData.pjRLCiudadNac;

                    _context.Proveedores_Juridica.Update(existingJuridica);
                    _context.SaveChanges();

                    var oldSucursales = _context.Sucursales_PJuridica.Where(s => s.NitProveedor == providerNit).ToList();
                    if (oldSucursales.Any())
                    {
                        _context.Sucursales_PJuridica.RemoveRange(oldSucursales);
                        _context.SaveChanges();
                    }
                    if (providerData.Sucursales_PJuridica != null && providerData.Sucursales_PJuridica.Any())
                    {
                        providerData.Sucursales_PJuridica = providerData.Sucursales_PJuridica.Select(s => new Sucursales_PJuridica
                        {
                            NitProveedor = providerNit,
                            Direccion = s.Direccion,
                            Departamento = s.Departamento,
                            Ciudad = s.Ciudad,
                            Email = s.Email,
                            Telefono = s.Telefono
                        }).ToList();
                    }
                    if (providerData.Sucursales_PJuridica != null && providerData.Sucursales_PJuridica.Any())
                    {
                        foreach (var sucursal in providerData.Sucursales_PJuridica)
                        {
                            sucursal.NitProveedor = providerNit;
                            _context.Sucursales_PJuridica.Add(sucursal);
                        }
                        _context.SaveChanges();
                    }

                    var oldAccionistas = _context.AccionistasControlPJuridica.Where(a => a.NitProveedor == providerNit).ToList();
                    if (oldAccionistas.Any())
                    {
                        _context.AccionistasControlPJuridica.RemoveRange(oldAccionistas);
                        _context.SaveChanges();
                    }

                    if (providerData.AccionistasControlPJuridica != null && providerData.AccionistasControlPJuridica.Any())
                    {
                        foreach (var accionista in providerData.AccionistasControlPJuridica)
                        {
                            var newAccionista = new AccionistasControlPJuridica
                            {
                                NitProveedor = providerNit,
                                razonSocial = accionista.razonSocial,
                                idType = accionista.idType,
                                idNum = accionista.idNum,
                                porcentaje = accionista.porcentaje
                            };
                            _context.AccionistasControlPJuridica.Add(newAccionista);
                        }
                        _context.SaveChanges();
                    }
                    transaction.Commit();
                }
                catch (Exception ex)
                {
                    transaction.Rollback();
                    throw new Exception("Error al actualizar la información de la persona jurídica", ex);
                }
            }
        }

        //metodo para actualizar form general de proveedor
        public void UpdateFUCPInfo(Proveedores_FUCP providerData)
        {
            using (var transaction = _context.Database.BeginTransaction())
            {
                try
                {
                    string providerNit = providerData.Nit;

                    var existingFUCP = _context.Proveedores_FUCP.FirstOrDefault(f => f.Nit == providerNit);
                    if (existingFUCP != null)
                    {
                        existingFUCP.pvIngrMens = providerData.pvIngrMens;
                        existingFUCP.pvEgrMens = providerData.pvEgrMens;
                        existingFUCP.pvActivos = providerData.pvActivos;
                        existingFUCP.pvPasivos = providerData.pvPasivos;
                        existingFUCP.pvPatrimonio = providerData.pvPatrimonio;
                        existingFUCP.pvOtrIngr = providerData.pvOtrIngr;
                        existingFUCP.pvPorNacional = providerData.pvPorNacional;
                        existingFUCP.pvPorExtranjero = providerData.pvPorExtranjero;
                        existingFUCP.pvPorPais = providerData.pvPorPais;
                        existingFUCP.pvTipEmp = providerData.pvTipEmp;
                        existingFUCP.pvOtrTipEmp = providerData.pvOtrTipEmp;
                        existingFUCP.pvAcEconomica = providerData.pvAcEconomica;
                        existingFUCP.pvCodCIIU = providerData.pvCodCIIU;
                        existingFUCP.pvCapSocReg = providerData.pvCapSocReg;
                        existingFUCP.pvFechConst = providerData.pvFechConst;
                        existingFUCP.pvFechVen = providerData.pvFechVen;
                        existingFUCP.pvGrCon = providerData.pvGrCon;
                        existingFUCP.pvDeclIndCom = providerData.pvDeclIndCom;
                        existingFUCP.pvAutRet = providerData.pvAutRet;
                        existingFUCP.pvFechResolGC = providerData.pvFechResolGC;
                        existingFUCP.pvNumResolGC = providerData.pvNumResolGC;
                        existingFUCP.pvDepartDec = providerData.pvDepartDec;
                        existingFUCP.pvCiudadDec = providerData.pvCiudadDec;
                        existingFUCP.pvNumResDIAN = providerData.pvNumResDIAN;
                        existingFUCP.pvForPag = providerData.pvForPag;
                        existingFUCP.pvEntBenef = providerData.pvEntBenef;
                        existingFUCP.pvPosCuBan = providerData.pvPosCuBan;
                        existingFUCP.pvEntidad = providerData.pvEntidad;
                        existingFUCP.pvNumCueBanc = providerData.pvNumCueBanc;
                        existingFUCP.pvClasCueBan = providerData.pvClasCueBan;
                        existingFUCP.pvDeAuRepresentacion = providerData.pvDeAuRepresentacion;
                        existingFUCP.pvFuenteRecur = providerData.pvFuenteRecur;
                        existingFUCP.pvTDPMotMaq = providerData.pvTDPMotMaq;
                        existingFUCP.pvTDPCasTor = providerData.pvTDPCasTor;
                        existingFUCP.pvTDPBonap = providerData.pvTDPBonap;
                        existingFUCP.pvTDPBellpi = providerData.pvTDPBellpi;
                        existingFUCP.pvRadAut = providerData.pvRadAut;
                    }
                    else
                    {
                        throw new Exception($"Registro FUCP para NIT {providerNit} no encontrado.");
                    }
                    _context.SaveChanges();
                    transaction.Commit();
                }
                catch (Exception ex)
                {
                    transaction.Rollback();
                    throw new Exception("Error al actualizar la información del FUCP " + ex.Message, ex);
                }
            }
        }

        //metodo para restaurar contraseña de proveedor
        public void RestoreProviderPassword(string nit)
        {
            try
            {
                var provider = _context.Proveedores_Master.FirstOrDefault(p => p.Nit == nit);
                if (provider != null)
                {
                    provider.Contrasena = provider.Nit;
                    _context.SaveChanges();
                }

            }
            catch (Exception ex)
            {
                throw new Exception("Error al restaurar la contraseña del proveedor", ex);
            }
        }

        //metodo para actualizar contraseña
        public void UpdatePassword(Proveedores_Master provider)
        {
            try
            {
                var existingProvider = _context.Proveedores_Master.FirstOrDefault(p => p.Nit == provider.Nit);
                if (existingProvider != null)
                {
                    existingProvider.Contrasena = provider.Contrasena;
                    _context.SaveChanges();
                }

            }
            catch (Exception ex)
            {
                throw new Exception("Error al actualizar la contraseña del proveedor", ex);
            }
        }

        //metodo para agregar nuevo proveedor en la tabla master
        public void AddProveedorMaster(Proveedores_Master proveedor)
        {
            try
            {
                _context.Proveedores_Master.Add(proveedor);
                _context.SaveChanges();

            }
            catch (Exception ex)
            {
                throw new Exception("Error al agregar el proveedor", ex);
            }
        }

        //metodo para agregar proveedor a la tabla de p. natural a partir de la t. master
        public void AddProveedorNatural(Proveedores_Natural proveedor)
        {
            using (var transaction = _context.Database.BeginTransaction())
            {
                try
                {
                    _context.Proveedores_Natural.Add(proveedor);
                    _context.SaveChanges();

                    string providerNit = proveedor.Nit;

                    var oldPEP = _context.PEPtipos_ProveedoresNatural.Where(p => p.NitProveedor == providerNit);
                    _context.PEPtipos_ProveedoresNatural.RemoveRange(oldPEP);

                    foreach (var tipo in proveedor.PEPTypes)
                    {
                        _context.PEPtipos_ProveedoresNatural.Add(new PEPtipos_ProveedoresNatural
                        {
                            NitProveedor = providerNit,
                            TipoPEPid = tipo
                        });
                    }

                    _context.SaveChanges();
                    transaction.Commit();
                }
                catch (Exception ex)
                {
                    throw new Exception("Error al agregar el proveedor natural", ex);
                }
            }
        }

        //metodo para agregar proveedor a la tabla de p. juridica a partir de la t. master
        public void AddProveedorJuridica(Proveedores_Juridica proveedor)
        {
            try
            {
                _context.Proveedores_Juridica.Add(proveedor);
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                throw new Exception("Error al agregar el proveedor juridico", ex);
            }
        }

        //metodo para agregar proveedor a la tabla de form general a partir de la t. master
        public void AddProveedorFUCP(Proveedores_FUCP proveedor)
        {
            using (var transaction = _context.Database.BeginTransaction())
            {
                try
                {
                    _context.Proveedores_FUCP.Add(proveedor);
                    _context.SaveChanges();
                    transaction.Commit();
                }
                catch (Exception ex)
                {
                    throw new Exception("Error al agregar el FUCP del proveedor", ex);
                }
            }
        }

        //Metodo para actualizar OEA en form general (Proveedores_FUCP)
        public void UpdateStatusOEA(string Nit, string isOEA)
        {
            var fucp = _context.Proveedores_FUCP.FirstOrDefault(f =>  f.Nit == Nit);
            if (fucp != null)
            {
                fucp.upIsOEA = isOEA;
                _context.SaveChanges();
            }
        }

        //metodo para guardar y generar la ruta de ubicacion de los documentos del proveedor
        public async Task<string> SaveDocuments(IFormFile file, string Nit, string personType, string categoriaDoc, string nomArch, string webRootPath)
        {
            if (file == null || file.Length == 0) return null;

            //construir ruta
            string subPath = Path.Combine("docAnexa", "Proveedores", personType, Nit, categoriaDoc);
            string fullPath = Path.Combine(webRootPath, subPath);

            if (!Directory.Exists(fullPath)) Directory.CreateDirectory(fullPath);

            //nombre del archivo con TIMESTAMP para versionamiento
            string fileName = $"{nomArch}_{DateTime.Now:yyyyMMdd_HHmmss}{Path.GetExtension(file.FileName)}";
            string filePath = Path.Combine(fullPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return Path.Combine(subPath, fileName).Replace("\\", "/");
        }

        //metodo para guardar la ruta y metadata en DB
        public void SaveDocumentMD(string Nit, string categoria, string nomArchivo, string ruta)
        {
            var newDoc = new Documentos_Proveedores
            {
                NitProveedor = Nit,
                CategoriaDOC = categoria,
                NombreArchivo = nomArchivo,
                RutaArchivo = ruta,
                fechaCarga = DateTime.Now
            };

            _context.Documentos_Proveedores.Add(newDoc);
            _context.SaveChanges();
        }
    }
}
