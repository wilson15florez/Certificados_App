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

        public string ConsultBank(string Codigo, string webRootPath)
        {
            if (string.IsNullOrEmpty(Codigo)) return "";

            CacheLoaded(webRootPath);

            return _cacheBancos.TryGetValue(Codigo, out string Nombre) ? Nombre : Codigo;
        }

        public string ConsultCountry(string id, string webRootPath)
        {
            if (string.IsNullOrEmpty(id)) return "";

            CacheLoaded(webRootPath);

            return _cachePaises.TryGetValue(id, out string name) ? name : id;
        }

        public string ConsultState(string id, string webRootPath)
        {
            if (string.IsNullOrEmpty(id)) return "";

            CacheLoaded(webRootPath);

            return _cacheEstados.TryGetValue(id, out string name) ? name : id;
        }

        public string ConsultCity(string id, string webRootPath)
        {
            CacheLoaded(webRootPath);

            return _cacheCiudades.TryGetValue(id, out string name) ? name : id;
        }

        public string ConsultEconomic(string Codigo, string webRootPath)
        {
            if (string.IsNullOrEmpty(Codigo)) return "";

            CacheLoaded(webRootPath);

            return _cacheCIIU.TryGetValue(Codigo, out string Actividad) ? Actividad : Codigo;
        }


        //metodo para separar nombres completos
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
