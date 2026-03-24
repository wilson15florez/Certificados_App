using CasaToro.Consulta.Certificados.Entities;
using Microsoft.EntityFrameworkCore;
using System.Dynamic;
using Microsoft.AspNetCore.Http;
using CasaToro.Consulta.Certificados.DAL;
using Microsoft.AspNetCore.Hosting;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CasaToro.Consulta.Certificados.BL.Services
{
    /// <summary>
    /// Servicio de utilidades compartidas entre admin y proveedor.
    /// Provee resolución de nombres legibles a partir de códigos (bancos, países,
    /// estados, ciudades, CIIU) usando cachés en memoria cargados desde archivos JSON,
    /// y separación de nombres completos en sus componentes (apellidos y nombres).
    /// </summary>
    public class UsersService
    {
        private static Dictionary<string, string> _cacheBancos;
        private static Dictionary<string, string> _cachePaises;
        private static Dictionary<string, string> _cacheEstados;
        private static Dictionary<string, string> _cacheCiudades;
        private static Dictionary<string, string> _cacheCIIU;
        private static readonly object _lock = new object();

        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        /// <summary>
        /// Constructor. Dispara la carga de los cachés en un hilo de fondo al inicializar el servicio.
        /// </summary>
        public UsersService(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;

            string path = _env.WebRootPath;
            Task.Run(() => CacheLoaded(_env.WebRootPath));
        }

        //clase privada para mapear los items del json
        private class JsonItem
        {
            public string id { get; set; }
            public string name { get; set; }
        }
        private class JsonItemBank
        {
            [JsonProperty("Código")]
            public string Codigo { get; set; }
            public string Nombre { get; set; }
        }
        private class JsonItemCIIU
        {
            [JsonProperty("Código CIIU")]
            public string Codigo { get; set; }

            [JsonProperty("Actividad Economica")]
            public string Actividad { get; set; }
        }

        /// <summary>
        /// Carga todos los cachés de datos de referencia desde los archivos JSON del servidor.
        /// Usa double-check locking para garantizar que cada caché se carga una sola vez
        /// aunque haya múltiples hilos concurrentes.
        /// Los archivos cargados son: entidades bancarias, países, estados, ciudades y códigos CIIU.
        /// </summary>
        /// <param name="webRootPath">Ruta raíz del servidor web (wwwroot).</param>
        private void CacheLoaded(string webRootPath)
        {
            if (_cacheBancos != null && _cachePaises != null && _cacheEstados != null && _cacheCiudades != null && _cacheCIIU != null) return;

            lock (_lock)
            {
                if (_cacheBancos == null)
                {
                    string path = Path.Combine(webRootPath, "data", "entBanca", "entidades_bcos.json");
                    var json = File.ReadAllText(path);
                    var lista = JsonConvert.DeserializeObject<List<JsonItemBank>>(json);
                    _cacheBancos = lista.Where(x => !string.IsNullOrEmpty(x.Codigo)).ToDictionary(item => item.Codigo, item => item.Nombre);
                }

                if (_cachePaises == null)
                {
                    string path = Path.Combine(webRootPath, "data", "ubiExterior", "countries.json");
                    var json = File.ReadAllText(path);
                    var lista = JsonConvert.DeserializeObject<List<JsonItem>>(json);
                    _cachePaises = lista.Where(x => !string.IsNullOrEmpty(x.id)).ToDictionary(item => item.id, item => item.name);
                }

                if (_cacheEstados == null)
                {
                    string path = Path.Combine(webRootPath, "data", "ubiExterior", "states.json");
                    var json = File.ReadAllText(path);
                    var lista = JsonConvert.DeserializeObject<List<JsonItem>>(json);
                    _cacheEstados = lista.Where(x => !string.IsNullOrEmpty(x.id)).ToDictionary(item => item.id, item => item.name);
                }

                if (_cacheCiudades == null)
                {
                    string path = Path.Combine(webRootPath, "data", "ubiExterior", "cities.json");
                    var json = File.ReadAllText(path);
                    var lista = JsonConvert.DeserializeObject<List<JsonItem>>(json);
                    _cacheCiudades = lista.Where(x => !string.IsNullOrEmpty(x.id)).ToDictionary(item => item.id, item => item.name);
                }

                if (_cacheCIIU == null)
                {
                    string path = Path.Combine(webRootPath, "data", "Cod_CIIU-ActEconomica", "codCIIU_ActEco.json");
                    var json = File.ReadAllText(path);
                    var lista = JsonConvert.DeserializeObject<List<JsonItemCIIU>>(json);
                    _cacheCIIU = lista.Where(x => !string.IsNullOrEmpty(x.Codigo)).ToDictionary(item => item.Codigo, item => item.Actividad);
                }
            }
        }

        /// <summary>
        /// Resuelve el nombre de una entidad bancaria a partir de su código.
        /// </summary>
        /// <param name="Codigo">Código de la entidad bancaria.</param>
        /// <param name="webRootPath">Ruta wwwroot para carga de caché si no está inicializado.</param>
        /// <returns>Nombre de la entidad, o el mismo código si no se encuentra.</returns>
        public string ConsultBank(string Codigo, string webRootPath)
        {
            if (string.IsNullOrEmpty(Codigo)) return "";

            CacheLoaded(webRootPath);

            return _cacheBancos.TryGetValue(Codigo, out string Nombre) ? Nombre : Codigo;
        }

        /// <summary>
        /// Resuelve el nombre de un país a partir de su ID numérico.
        /// </summary>
        /// <param name="id">ID del país en el JSON de países.</param>
        /// <param name="webRootPath">Ruta wwwroot para carga de caché si no está inicializado.</param>
        /// <returns>Nombre del país, o el mismo ID si no se encuentra.</returns>
        public string ConsultCountry(string id, string webRootPath)
        {
            if (string.IsNullOrEmpty(id)) return "";

            CacheLoaded(webRootPath);

            return _cachePaises.TryGetValue(id, out string name) ? name : id;
        }

        /// <summary>
        /// Resuelve el nombre de un estado/departamento extranjero a partir de su ID.
        /// </summary>
        /// <param name="id">ID del estado en el JSON de estados.</param>
        /// <param name="webRootPath">Ruta wwwroot para carga de caché si no está inicializado.</param>
        /// <returns>Nombre del estado, o el mismo ID si no se encuentra.</returns>
        public string ConsultState(string id, string webRootPath)
        {
            if (string.IsNullOrEmpty(id)) return "";

            CacheLoaded(webRootPath);

            return _cacheEstados.TryGetValue(id, out string name) ? name : id;
        }

        /// <summary>
        /// Resuelve el nombre de una ciudad extranjera a partir de su ID.
        /// </summary>
        /// <param name="id">ID de la ciudad en el JSON de ciudades.</param>
        /// <param name="webRootPath">Ruta wwwroot para carga de caché si no está inicializado.</param>
        /// <returns>Nombre de la ciudad, o el mismo ID si no se encuentra.</returns>
        public string ConsultCity(string id, string webRootPath)
        {
            CacheLoaded(webRootPath);

            return _cacheCiudades.TryGetValue(id, out string name) ? name : id;
        }

        /// <summary>
        /// Resuelve la descripción de actividad económica a partir del código CIIU.
        /// </summary>
        /// <param name="Codigo">Código CIIU.</param>
        /// <param name="webRootPath">Ruta wwwroot para carga de caché si no está inicializado.</param>
        /// <returns>Descripción de la actividad económica, o el mismo código si no se encuentra.</returns>
        public string ConsultEconomic(string Codigo, string webRootPath)
        {
            if (string.IsNullOrEmpty(Codigo)) return "";

            CacheLoaded(webRootPath);

            return _cacheCIIU.TryGetValue(Codigo, out string Actividad) ? Actividad : Codigo;
        }


        /// <summary>
        /// Divide un nombre completo en sus componentes: primer apellido, segundo apellido y nombres.
        /// Procesa de atrás hacia adelante para identificar apellidos, manejando conectores
        /// compuestos (DE, DEL, LA, LAS, LOS, VON, VAN, etc.).
        /// <para>Reglas de distribución:</para>
        /// <list type="bullet">
        ///   <item>3+ piezas: los últimos dos son apellidos, el resto son nombres.</item>
        ///   <item>2 piezas: la última es primer apellido, la primera son nombres.</item>
        ///   <item>1 pieza: se trata como nombre, apellidos vacíos.</item>
        /// </list>
        /// </summary>
        /// <param name="fullName">Nombre completo como cadena de texto.</param>
        /// <returns>Tupla con (primerApellido, segundoApellido, nombres). Vacío si la entrada es nula.</returns>
        public (string firstSurname, string secondSurname, string names) SplitFullName(string fullName)
        {
            if (string.IsNullOrWhiteSpace(fullName)) return ("", "", "");

            string[] conectores = { "DE", "DEL", "LA", "LAS", "LOS", "Y", "MC", "MAC", "SAN", "SANTA", "VON", "VAN" };
            var parts = fullName.ToUpper().Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries).ToList();

            //lista para reconstruir las piezas
            List<string> piezas = new List<string>();

            //se procesa de atras hacia adelante para identificar apellidos
            for (int i = parts.Count - 1; i >= 0; i--)
            {
                string currentPart = parts[i];

                //si la palabra anterior es un conector lo unimos al bloque actual
                if (i > 0 && conectores.Contains(parts[i - 1]))
                {
                    //si hay varios conectores se intenta unir recursivamente
                    string accumulated = currentPart;
                    while (i > 0 && conectores.Contains(parts[i - 1]))
                    {
                        i--;
                        accumulated = parts[i] + " " + accumulated;
                        //si la palabra actual no es un conector, ya se llego al apellido base y se detiene
                        if (!conectores.Contains(parts[i])) break;
                    }
                    piezas.Add(accumulated);
                }
                else
                {
                    piezas.Add(currentPart);
                }
            }

            piezas.Reverse();

            //se distribuyen las partes restantes
            int n = piezas.Count;
            if (n >= 3)
            {
                string secSurname = piezas[n - 1];
                string firSurname = piezas[n - 2];
                string names = string.Join(" ", piezas.Take(n - 2));
                return (firSurname, secSurname, names);
            }
            else if (n == 2)
            {
                return (piezas[1], "", piezas[0]);
            }

            return ("", "", piezas[0]);
        }

        
    }
}
