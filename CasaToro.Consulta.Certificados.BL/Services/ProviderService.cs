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

        //Método que obtiene un proveedor por su NIT
        public Proveedores_Master getProviderByNit(string nit)
        {
            return _context.Proveedores_Master.FirstOrDefault(p => p.Nit != null && p.Nit.Equals(nit));
        }

        //Método que obtiene a un proveedor en la tabla proveedores_InfoFinanciera por su NIT
        public Proveedores_InfoFinanciera? getProvFinanceInfByNit(string nit)
        {
            return _context.Proveedores_InfoFinanciera.FirstOrDefault(f => f.Nit == nit);
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

        //Metodo que obtiene la información detallada de un proveedor ya sea persona natural o jurídica y la informacion financiera
        public async Task<dynamic> getProviderDetails(string nit, string personType)
        {
            ExpandoObject MakeDynamic(
                bool existNatu,
                bool existJuri,
                bool existFinanInf,
                object? natural,
                object? juridica,
                object? finanInf
            )
            {
                dynamic d = new ExpandoObject();
                d.existNatu = existNatu;
                d.existJuri = existJuri;
                d.existFinanInf = existFinanInf;
                d.natural = natural;
                d.juridica = juridica;
                d.finanInf = finanInf;
                return d;
            }

            var finanInfData = await _context.Proveedores_InfoFinanciera
                                        .FirstOrDefaultAsync(f => f.Nit == nit);

            Dictionary<string, object>? mapFinanInfData = null;

            if (finanInfData != null)
            {
                mapFinanInfData = new Dictionary<string, object>
                {
                    { "Nit", finanInfData.Nit },
                    { "pvIngrMens", finanInfData.pvIngrMens },
                    { "pvEgrMens", finanInfData.pvEgrMens },
                    { "pvActivos", finanInfData.pvActivos },
                    { "pvPasivos", finanInfData.pvPasivos },
                    { "pvPatrimonio", finanInfData.pvPatrimonio },
                    { "pvOtrIngr", finanInfData.pvOtrIngr },
                    { "pvPorNacional", finanInfData.pvPorNacional },
                    { "pvPorExtranjero", finanInfData.pvPorExtranjero },
                    { "pvPorPais", finanInfData.pvPorPais },
                    { "pvTipEmp", finanInfData.pvTipEmp },
                    { "pvAcEconomica", finanInfData.pvAcEconomica },
                    { "pvCodCIIU", finanInfData.pvCodCIIU },
                    { "pvCapSocReg", finanInfData.pvCapSocReg },
                    { "pvFechConst", finanInfData.pvFechConst?.ToString("yyyy-MM-dd") },
                    { "pvFechVen", finanInfData.pvFechVen?.ToString("yyyy-MM-dd") },
                    { "pvGrCon", finanInfData.pvGrCon },
                    { "pvDeclIndCom", finanInfData.pvDeclIndCom },
                    { "pvAutRet", finanInfData.pvAutRet },
                    { "pvFechResolGC", finanInfData.pvFechResolGC?.ToString("yyyy-MM-dd") },
                    { "pvNumResolGC", finanInfData.pvNumResolGC },
                    { "pvDepartDec", finanInfData.pvDepartDec },
                    { "pvCiudadDec", finanInfData.pvCiudadDec },
                    { "pvNumResDIAN", finanInfData.pvNumResDIAN },
                    { "pvOpeCExt", finanInfData.pvOpeCExt },
                    { "pvCeOEA", finanInfData.pvCeOEA },
                    { "pvCeCal", finanInfData.pvCeCal },
                    { "pvCeBASC", finanInfData.pvCeBASC  },
                    { "pvCeAmb", finanInfData.pvCeAmb },
                    { "pvCe28000", finanInfData.pvCe28000 },
                    { "pvCeSST", finanInfData.pvCeSST },
                    { "pvAdiCert", finanInfData.pvAdiCert },
                    { "pvForPag", finanInfData.pvForPag },
                    { "pvEntBenef", finanInfData.pvEntBenef },
                    { "pvPosCuBan", finanInfData.pvPosCuBan },
                    { "pvEntidad", finanInfData.pvEntidad },
                    { "pvNumCueBanc", finanInfData.pvNumCueBanc },
                    { "pvClasCueBan", finanInfData.pvClasCueBan },
                    { "pvDeAuRepresentacion", finanInfData.pvDeAuRepresentacion },
                    { "pvFuenteRecur", finanInfData.pvFuenteRecur },
                    { "pvTDPBonap", finanInfData.pvTDPBonap },
                    { "pvCumCSIn", finanInfData.pvCumCSIn },
                    { "pvTDPMotMaq", finanInfData.pvTDPMotMaq },
                    { "pvTDPCasTor", finanInfData.pvTDPCasTor },
                    { "pvRadAut", finanInfData.pvRadAut },
                    { "upIsOEA", finanInfData.upIsOEA }
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
                        existFinanInf: (mapFinanInfData != null),
                        natural: null,
                        juridica: null,
                        finanInf: mapFinanInfData

                        );
                }

                var pepTipos = await _context.PEPtipos_ProveedoresNatural
                                                .Where(t => t.NitProveedor == nit)
                                                .Select(t => t.TipoPEPid)
                                                .ToListAsync();

                var mapNaturalData = new Dictionary<string, object>
                    {
                        {"Nit", naturalData.Nit },
                        {"pnPrimerApell", naturalData.pnPrimerApell },
                        {"pnSegundoApell", naturalData.pnSegundoApell },
                        {"pnNombres", naturalData.pnNombres },

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

                        { "FinanInf", mapFinanInfData }
                    };

                return MakeDynamic
                (
                    existNatu: true,
                    existJuri: false,
                    existFinanInf: (mapFinanInfData != null),
                    natural: mapNaturalData,
                    juridica: null,
                    finanInf: mapFinanInfData
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
                        existFinanInf: (mapFinanInfData != null),
                        natural: null,
                        juridica: null,
                        finanInf: mapFinanInfData
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
                        {"pjDepartDilig", juridicaData.pjDepartDilig },
                        {"pjCiudadDilig", juridicaData.pjCiudadDilig },
                        {"pjDirPrincipal",juridicaData.pjDirPrincipal},
                        {"pjDepartDirPrincipal",juridicaData.pjDepartDirPrincipal },
                        {"pjCiudadDirPrincipal",juridicaData.pjCiudadDirPrincipal},
                        {"pjEmailDirPrincipal",juridicaData.pjEmailDirPrincipal},
                        {"pjTelDirPrincipal",juridicaData.pjTelDirPrincipal},
                        {"pjPrimApeRL", juridicaData.pjPrimApeRL },
                        {"pjSegApeRL", juridicaData.pjSegApeRL },
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

                        {  "FinanInf", mapFinanInfData   }
                    };

                return MakeDynamic
                (
                    existNatu: false,
                    existJuri: true,
                    existFinanInf: (mapFinanInfData != null),
                    natural: null,
                    juridica: mapJuridicaData,
                    finanInf: mapFinanInfData
                );
            }

            return MakeDynamic(false, false, false, null, null, null);
        }

        //Metodo para obtener los documentos asociados a un proveedor por su NIT
        public List<Documentos_Proveedores> GetDocumentsByNit(string nit)
        {
            //trae los documentos activos para cada categoria
            return _context.Documentos_Proveedores
                .Where(d => d.NitProveedor == nit && d.Estado == "Activo")
                .OrderByDescending(d => d.fechaCarga)
                .ToList();
        }

        //metodo para actualizar proveedor natural
        public void UpdateNaturalInfo(Proveedores_Natural providerData, string fullname, string tipPersona, DateTime dateProcedure, string tipTramite)
        {
            using (var transaction = _context.Database.BeginTransaction())
            {
                try
                {
                    string providerNit = providerData.Nit;

                    var existingMaster = _context.Proveedores_Master.FirstOrDefault(p => p.Nit == providerNit);
                    if (existingMaster != null)
                    {
                        existingMaster.Nombre = fullname.ToUpper();
                        existingMaster.Direccion = providerData.pnDiResidencia;
                        existingMaster.Correo = providerData.pnEmail;
                        existingMaster.Telefono = !string.IsNullOrWhiteSpace(providerData.pnCelular) ? providerData.pnCelular : providerData.pnTelefono;
                        existingMaster.TipoPersona = tipPersona.ToUpper();
                        existingMaster.FechaDiligencia_Formato = DateOnly.FromDateTime(dateProcedure);
                        existingMaster.TipoTramite_Formato = tipTramite;
                    }

                    var existingNatural = _context.Proveedores_Natural.FirstOrDefault(p => p.Nit == providerNit);

                    if (existingNatural != null)
                    {
                        existingNatural.pnPrimerApell = providerData.pnPrimerApell;
                        existingNatural.pnSegundoApell = providerData.pnSegundoApell;
                        existingNatural.pnNombres = providerData.pnNombres;
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
                        
                        foreach (var id in validPEPIds)
                        {
                            _context.PEPtipos_ProveedoresNatural.Add(new PEPtipos_ProveedoresNatural
                            {
                                NitProveedor = providerNit,
                                TipoPEPid = id
                            });
                        }
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
        public void UpdateJuridicaInfo(Proveedores_Juridica providerData, string tipPersona, DateTime dateProcedure, string tipTramite)
        {
            string providerNit = providerData.Nit;

            using (var transaction = _context.Database.BeginTransaction())
            {
                try
                {
                    var existingMaster = _context.Proveedores_Master.FirstOrDefault(p => p.Nit == providerNit);
                    if (existingMaster != null)
                    {
                        existingMaster.Nombre = providerData.pjRazSocial.ToUpper();
                        existingMaster.Direccion = providerData.pjDirPrincipal;
                        existingMaster.Correo = providerData.pjEmailDirPrincipal;
                        existingMaster.Telefono = providerData.pjTelDirPrincipal;
                        existingMaster.TipoPersona = tipPersona.ToUpper();
                        existingMaster.FechaDiligencia_Formato = DateOnly.FromDateTime(dateProcedure);
                        existingMaster.TipoTramite_Formato = tipTramite;
                    }

                    var existingJuridica = _context.Proveedores_Juridica.FirstOrDefault(p => p.Nit == providerNit);

                    if (existingJuridica == null)
                        throw new Exception($"Registro detallado para NIT {providerNit} no encontrado.");

                    existingJuridica.pjRazSocial = providerData.pjRazSocial;
                    existingJuridica.pjDepartDilig = providerData.pjDepartDilig;
                    existingJuridica.pjCiudadDilig = providerData.pjCiudadDilig;
                    existingJuridica.pjDirPrincipal = providerData.pjDirPrincipal;
                    existingJuridica.pjDepartDirPrincipal = providerData.pjDepartDirPrincipal;
                    existingJuridica.pjCiudadDirPrincipal = providerData.pjCiudadDirPrincipal;
                    existingJuridica.pjEmailDirPrincipal = providerData.pjEmailDirPrincipal;
                    existingJuridica.pjTelDirPrincipal = providerData.pjTelDirPrincipal;

                    existingJuridica.pjPrimApeRL = providerData.pjPrimApeRL;
                    existingJuridica.pjSegApeRL = providerData.pjSegApeRL;
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

                    var oldSucursales = _context.Sucursales_PJuridica.Where(s => s.NitProveedor == providerNit).ToList();
                    if (oldSucursales.Any())
                    {
                        _context.Sucursales_PJuridica.RemoveRange(oldSucursales);
                    }
                    if (providerData.Sucursales_PJuridica != null && providerData.Sucursales_PJuridica.Any())
                    {
                        foreach (var s in providerData.Sucursales_PJuridica) 
                        {
                            _context.Sucursales_PJuridica.Add(new Sucursales_PJuridica
                            {
                                NitProveedor = providerNit,
                                Direccion = s.Direccion,
                                Departamento = s.Departamento,
                                Ciudad = s.Ciudad,
                                Email = s.Email,
                                Telefono = s.Telefono
                            });
                        }
                    }

                    var oldAccionistas = _context.AccionistasControlPJuridica.Where(a => a.NitProveedor == providerNit).ToList();
                    if (oldAccionistas.Any())
                    {
                        _context.AccionistasControlPJuridica.RemoveRange(oldAccionistas);
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
                    }
                    _context.SaveChanges();
                    transaction.Commit();
                }
                catch (Exception ex)
                {
                    transaction.Rollback();
                    throw new Exception("Error al actualizar la información de la persona jurídica", ex);
                }
            }
        }

        //metodo para actualizar la información financiera del proveedor
        public void UpdateFinanceInfo(Proveedores_InfoFinanciera providerData)
        {
            using (var transaction = _context.Database.BeginTransaction())
            {
                try
                {
                    string providerNit = providerData.Nit;

                    var existingFinanInf = _context.Proveedores_InfoFinanciera.FirstOrDefault(f => f.Nit == providerNit);
                    if (existingFinanInf != null)
                    {
                        existingFinanInf.pvIngrMens = providerData.pvIngrMens;
                        existingFinanInf.pvEgrMens = providerData.pvEgrMens;
                        existingFinanInf.pvActivos = providerData.pvActivos;
                        existingFinanInf.pvPasivos = providerData.pvPasivos;
                        existingFinanInf.pvPatrimonio = providerData.pvPatrimonio;
                        existingFinanInf.pvOtrIngr = providerData.pvOtrIngr;
                        existingFinanInf.pvPorNacional = providerData.pvPorNacional;
                        existingFinanInf.pvPorExtranjero = providerData.pvPorExtranjero;
                        existingFinanInf.pvPorPais = providerData.pvPorPais;
                        existingFinanInf.pvTipEmp = providerData.pvTipEmp;
                        existingFinanInf.pvAcEconomica = providerData.pvAcEconomica;
                        existingFinanInf.pvCodCIIU = providerData.pvCodCIIU;
                        existingFinanInf.pvCapSocReg = providerData.pvCapSocReg;
                        existingFinanInf.pvFechConst = providerData.pvFechConst;
                        existingFinanInf.pvFechVen = providerData.pvFechVen;
                        existingFinanInf.pvGrCon = providerData.pvGrCon;
                        existingFinanInf.pvDeclIndCom = providerData.pvDeclIndCom;
                        existingFinanInf.pvAutRet = providerData.pvAutRet;
                        existingFinanInf.pvFechResolGC = providerData.pvFechResolGC;
                        existingFinanInf.pvNumResolGC = providerData.pvNumResolGC;
                        existingFinanInf.pvDepartDec = providerData.pvDepartDec;
                        existingFinanInf.pvCiudadDec = providerData.pvCiudadDec;
                        existingFinanInf.pvNumResDIAN = providerData.pvNumResDIAN;
                        existingFinanInf.pvOpeCExt = providerData.pvOpeCExt;
                        existingFinanInf.pvForPag = providerData.pvForPag;
                        existingFinanInf.pvEntBenef = providerData.pvEntBenef;
                        existingFinanInf.pvPosCuBan = providerData.pvPosCuBan;
                        existingFinanInf.pvEntidad = providerData.pvEntidad;
                        existingFinanInf.pvNumCueBanc = providerData.pvNumCueBanc;
                        existingFinanInf.pvClasCueBan = providerData.pvClasCueBan;
                        existingFinanInf.pvCeOEA = providerData.pvCeOEA;
                        existingFinanInf.pvCeCal = providerData.pvCeCal;
                        existingFinanInf.pvCeBASC = providerData.pvCeBASC;
                        existingFinanInf.pvCeAmb = providerData.pvCeAmb;
                        existingFinanInf.pvCe28000 = providerData.pvCe28000;
                        existingFinanInf.pvCeSST = providerData.pvCeSST;
                        existingFinanInf.pvAdiCert = providerData.pvAdiCert;
                        existingFinanInf.pvDeAuRepresentacion = providerData.pvDeAuRepresentacion;
                        existingFinanInf.pvFuenteRecur = providerData.pvFuenteRecur;
                        existingFinanInf.pvTDPMotMaq = providerData.pvTDPMotMaq;
                        existingFinanInf.pvTDPCasTor = providerData.pvTDPCasTor;
                        existingFinanInf.pvTDPBonap = providerData.pvTDPBonap;
                        existingFinanInf.pvCumCSIn = providerData.pvCumCSIn;
                        existingFinanInf.pvRadAut = providerData.pvRadAut;
                    }
                    else
                    {
                        throw new Exception($"Registro de Información Financiera para NIT {providerNit} no encontrado.");
                    }

                    _context.SaveChanges();
                    transaction.Commit();
                }
                catch (Exception ex)
                {
                    transaction.Rollback();
                    var inner = ex.InnerException != null ? ex.InnerException.Message : "";
                    throw new Exception($"Error al actualizar la Información Financiera: {ex.Message}. Detalle: {inner}");
                }
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

        //metodo para agregar proveedor a la tabla de p. natural a partir de la t. master
        public void AddProveedorNatural(Proveedores_Natural proveedor, string fullname, string tipPersona, DateTime dateProcedure, string tipTramite)
        {
            using (var transaction = _context.Database.BeginTransaction())
            {
                try
                {
                    _context.Proveedores_Natural.Add(proveedor);
                    _context.SaveChanges();

                    string providerNit = proveedor.Nit;

                    var existingMaster = _context.Proveedores_Master.FirstOrDefault(p => p.Nit == providerNit);
                    if (existingMaster != null)
                    {
                        existingMaster.Nombre = fullname.ToUpper();
                        existingMaster.Direccion = proveedor.pnDiResidencia;
                        existingMaster.Correo = proveedor.pnEmail;
                        existingMaster.Telefono = !string.IsNullOrWhiteSpace(proveedor.pnCelular) ? proveedor.pnCelular : proveedor.pnTelefono;
                        existingMaster.TipoPersona = tipPersona.ToUpper();
                        existingMaster.FechaDiligencia_Formato = DateOnly.FromDateTime(dateProcedure);
                        existingMaster.TipoTramite_Formato = tipTramite;
                    }

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
        public void AddProveedorJuridica(Proveedores_Juridica proveedor, string tipPersona, DateTime dateProcedure, string tipTramite)
        {
            using (var transaction = _context.Database.BeginTransaction())
            {
                try
                {
                    _context.Proveedores_Juridica.Add(proveedor);

                    string providerNit = proveedor.Nit;

                    var existingMaster = _context.Proveedores_Master.FirstOrDefault(p => p.Nit == providerNit);
                    if (existingMaster != null)
                    {
                        existingMaster.Nombre = proveedor.pjRazSocial.ToUpper();
                        existingMaster.Direccion = proveedor.pjDirPrincipal;
                        existingMaster.Correo = proveedor.pjEmailDirPrincipal;
                        existingMaster.Telefono = proveedor.pjTelDirPrincipal;
                        existingMaster.TipoPersona = tipPersona.ToUpper();
                        existingMaster.FechaDiligencia_Formato = DateOnly.FromDateTime(dateProcedure);
                        existingMaster.TipoTramite_Formato = tipTramite;
                    }
                    _context.SaveChanges();
                    transaction.Commit();
                }
                catch (Exception ex)
                {
                    transaction.Rollback();
                    throw new Exception("Error al agregar el proveedor juridico", ex);
                }
            }
        }

        //metodo para agregar proveedor a la tabla de proveedores_InfoFinanciera a partir de la t. master
        public void AddProvFinanceInf(Proveedores_InfoFinanciera proveedor)
        {
            using (var transaction = _context.Database.BeginTransaction())
            {
                try
                {
                    _context.Proveedores_InfoFinanciera.Add(proveedor);
                    _context.SaveChanges();
                    transaction.Commit();
                }
                catch (Exception ex)
                {
                    throw new Exception("Error al agregar la información financiera del proveedor", ex);
                }
            }
        }

        //Metodo para actualizar OEA en Proveedores_InfFinanciera
        public void UpdateStatusOEA(string Nit, string isOEA)
        {
            var finanInf = _context.Proveedores_InfoFinanciera.FirstOrDefault(f => f.Nit == Nit);
            if (finanInf != null)
            {
                finanInf.upIsOEA = isOEA;
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
                fechaCarga = DateTime.Now,
                Estado = "Activo"
            };

            _context.Documentos_Proveedores.Add(newDoc);
            _context.SaveChanges();
        }

        public void DeactiveJuriFUCP(string nit)
        {
            var fucpActivos = _context.Documentos_Proveedores
                .Where(d => d.NitProveedor == nit
                    && d.CategoriaDOC == "upFUCPfirmado"
                    && d.Estado == "Activo")
                .ToList();

            foreach (var doc in fucpActivos)
                doc.Estado = "Inactivo";

            if (fucpActivos.Any())
                _context.SaveChanges();
        }

        //metodo para cambiar el estado del documento
        public void ActiveDocument(string Nit, Dictionary<string, List<string>> existingFilesMap, string webRootPath) 
        { 
            //filtra por documentos actualmente activos
            var docsActivosDB = _context.Documentos_Proveedores
                .Where(d => d.NitProveedor == Nit && d.Estado == "Activo")
                .ToList();
            foreach (var docDB in docsActivosDB) {
                
                bool stayDoc = false;

                //si la categoria existe en el frontend
                if (existingFilesMap.ContainsKey(docDB.CategoriaDOC))
                {
                    //verifica si el nombre del archivo existe en la lista del frontend para mantenerlo
                    if (existingFilesMap[docDB.CategoriaDOC].Contains(docDB.NombreArchivo))
                    {
                        stayDoc = true;
                    }
                }

                if (!stayDoc)
                {
                    //mantiene documento anterior, solo lo marca como inactivo (remplazado o eliminado por usuario)
                    docDB.Estado = "Inactivo";
                }
            }
            _context.SaveChanges();
        }
    }
}
