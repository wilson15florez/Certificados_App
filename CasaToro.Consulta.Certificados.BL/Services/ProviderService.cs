using CasaToro.Consulta.Certificados.Entities;
using Microsoft.EntityFrameworkCore;
using CasaToro.Consulta.Certificados.DAL;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;

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
        public List<ProveedoresMaster> getProviders(int pageNumber, int pageSize, string? search = null)
        {
            try
            {
                var query = _context.ProveedoresMasters.AsQueryable(); // Obtiene la consulta sin ejecutarla aún

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
            return _context.ProveedoresMasters
                                     .Where(p => string.IsNullOrEmpty(search) ||
                                                 p.Nit.ToLower().Contains(search.ToLower()) ||
                                                 p.Nombre.ToLower().Contains(search.ToLower()))
                                     .Count();
        }

        // Método que obtiene un proveedor por su NIT
        public ProveedoresMaster getPoviderByNit(string nit)
        {
            return _context.ProveedoresMasters.FirstOrDefault(p => p.Nit != null && p.Nit.Equals(nit));
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

        //Metodo para actualizar la información de un proveedor
        public void UpdateProvider(ProveedoresMaster provider)
        {
            try
            {
                var existingProvider = _context.ProveedoresMasters.FirstOrDefault(p => p.Nit == provider.Nit);
                if (existingProvider != null)
                {
                    // Actualizar la entidad existente
                    _context.Entry(existingProvider).CurrentValues.SetValues(provider);
                    _context.SaveChanges();
                }
            }
            catch (Exception ex)
            {
                throw new Exception("Error al actualizar el proveedor", ex);
            }
        }

        //Metodo que obtiene la información detallada de un proveedor ya sea persona natural o jurídica
        public async Task<object> getProviderDetails(string nit, string personType)
        {
            if (personType.Equals("natural", StringComparison.OrdinalIgnoreCase))
            {
                var naturalData = await _context.Proveedores_Natural
                                                    .FirstOrDefaultAsync(p => p.Nit == nit);
                return naturalData;

            }
            else if (personType.Equals("juridica", StringComparison.OrdinalIgnoreCase))
            {
                var juridicaData = await _context.Proveedores_Juridica
                                                    .FirstOrDefaultAsync(p => p.Nit == nit);
                if (juridicaData != null)
                {
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
                        {"pjCiudadDirPrincipal",juridicaData.pjCiudadDirPrincipal},
                        {"pjEmailDirPrincipal",juridicaData.pjEmailDirPrincipal},
                        {"pjTelDirPrincipal",juridicaData.pjTelDirPrincipal},

                        {"Sucursales", sucursales.Select(s => new
                        {
                            pjSucursalDir = s.Direccion,
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
                        }).ToList() }
                    };
                    return mapJuridicaData;
                }
                return null;
            }
            return null;
        }

        public void UpdateNaturalInfo(Proveedores_Natural providerData)
        {
            using (var transaction = _context.Database.BeginTransaction())
            {
                try
                {
                    string providerNit = providerData.Nit;

                    var existingMaster = _context.ProveedoresMasters.FirstOrDefault(p => p.Nit == providerNit);
                    if (existingMaster != null)
                    {
                        existingMaster.Nombre = providerData.pnNombreCompl.ToUpper();
                        existingMaster.Direccion = providerData.pnDiResidencia;
                        existingMaster.Correo = providerData.pnEmail;
                        existingMaster.Telefono = providerData.pnTelefono;
                    }

                    var existingNatural = _context.Proveedores_Natural.FirstOrDefault(p => p.Nit == providerNit);
                    if (existingNatural != null)
                    {
                        _context.Entry(existingNatural).CurrentValues.SetValues(providerData);
                    }
                    else
                    {
                        throw new Exception($"Registro detallado para Persona Natural con NIT {providerNit} no encontrado.");
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

        public void UpdateJuridicaInfo(Proveedores_Juridica providerData)
        {
            string providerNit = providerData.Nit;

            using (var transaction = _context.Database.BeginTransaction())
            {
                try
                {
                    var existingJuridica = _context.Proveedores_Juridica.FirstOrDefault(p => p.Nit == providerNit);

                    if (existingJuridica != null)
                    {
                        existingJuridica.pjRazSocial = providerData.pjRazSocial;
                        existingJuridica.pjDirPrincipal = providerData.pjDirPrincipal;
                        existingJuridica.pjCiudadDirPrincipal = providerData.pjCiudadDirPrincipal;
                        existingJuridica.pjEmailDirPrincipal = providerData.pjEmailDirPrincipal;
                        existingJuridica.pjTelDirPrincipal = providerData.pjTelDirPrincipal;
                        _context.Proveedores_Juridica.Update(existingJuridica);
                    }
                    else
                    {
                        throw new Exception($"Registro detallado para NIT {providerNit} no encontrado.");
                    }
                    _context.SaveChanges();

                    var oldSucursales = _context.Sucursales_PJuridica.Where(s => s.NitProveedor == providerNit);
                    _context.Sucursales_PJuridica.RemoveRange(oldSucursales);

                    foreach (var sucursal in providerData.Sucursales_PJuridica)
                    {
                        var newSucursal = new Sucursales_PJuridica
                        {
                            NitProveedor = providerNit,
                            Direccion = sucursal.Direccion,
                            Ciudad = sucursal.Ciudad,
                            Email = sucursal.Email,
                            Telefono = sucursal.Telefono
                        };
                        _context.Sucursales_PJuridica.Add(newSucursal);
                    }

                    var oldAccionistas = _context.AccionistasControlPJuridica.Where(a => a.NitProveedor == providerNit);
                    _context.AccionistasControlPJuridica.RemoveRange(oldAccionistas);

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
                    transaction.Commit();
                }
                catch (Exception ex)
                {
                    transaction.Rollback();
                    throw new Exception("Error al actualizar la información de la persona jurídica", ex);
                }
            }
        }


        public void RestoreProviderPassword(string nit)
        {
            try
            {
                var provider = _context.ProveedoresMasters.FirstOrDefault(p => p.Nit == nit);
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

        public void UpdatePassword(ProveedoresMaster provider)
        {
            try
            {
                var existingProvider = _context.ProveedoresMasters.FirstOrDefault(p => p.Nit == provider.Nit);
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

        /*public void AddProveedorMaster(ProveedoresMaster proveedor)
        {
            try
            {
                _context.ProveedoresMasters.Add(proveedor);
                _context.SaveChanges();

            }
            catch (Exception ex)
            {
                throw new Exception("Error al agregar el proveedor", ex);
            }
        }*/

        public void AddProveedorNatural(Proveedores_Natural proveedor)
        {
            try
            {
                _context.Proveedores_Natural.Add(proveedor);
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                throw new Exception("Error al agregar el proveedor natural", ex);
            }
        }

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
    }
}
