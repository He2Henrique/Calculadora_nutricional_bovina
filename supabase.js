/**
 * Cliente REST para a tabela "Formulacoes" no Supabase.
 * Preencha SUPABASE_URL e SUPABASE_ANON_KEY antes de usar.
 *
 * Modelo da tabela:
 * {
 *   "nome": "String",
 *   "real_kg": 99.99,
 *   "info_nutricional": {
 *     "nutriente": { "medida": "String(%/g/mg)", "quantidade": 99 }
 *   }
 * }
 */
(function (global) {
  var SUPABASE_URL = 'https://nrvpzewmekqrgiknnyen.supabase.co'; // ex: 'https://xxxxx.supabase.co'
  var SUPABASE_ANON_KEY = 'sb_publishable_0krNMf4ZdHGCS7zI5RebxQ_BNQV_jLc'; // chave anon/public do projeto
  var TABLE = 'Formulacoes';

  function endpoint(path) {
    return SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/' + TABLE + (path || '');
  }

  function headers(extra) {
    return Object.assign({
      apikey: SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    }, extra || {});
  }

  async function request(url, options) {
    var res = await fetch(url, options);
    var texto = await res.text();
    if (!res.ok) {
      throw new Error('Supabase (' + res.status + '): ' + texto);
    }
    if (!texto) return null;
    return JSON.parse(texto);
  }

  var SupabaseAPI = {
    configurar: function (url, anonKey) {
      SUPABASE_URL = url;
      SUPABASE_ANON_KEY = anonKey;
    },

    listarFormulacoes: function () {
      return request(endpoint('?select=*&order=nome.asc'), {
        headers: headers()
      });
    },

    buscarFormulacao: function (id) {
      return request(endpoint('?id=eq.' + encodeURIComponent(id) + '&select=*'), {
        headers: headers()
      }).then(function (rows) { return rows && rows[0]; });
    },

    criarFormulacao: function (formulacao) {
      return request(endpoint(), {
        method: 'POST',
        headers: headers({ Prefer: 'return=representation' }),
        body: JSON.stringify(formulacao)
      }).then(function (rows) { return rows && rows[0]; });
    },

    atualizarFormulacao: function (id, formulacao) {
      return request(endpoint('?id=eq.' + encodeURIComponent(id)), {
        method: 'PATCH',
        headers: headers({ Prefer: 'return=representation' }),
        body: JSON.stringify(formulacao)
      }).then(function (rows) { return rows && rows[0]; });
    },

    excluirFormulacao: function (id) {
      return request(endpoint('?id=eq.' + encodeURIComponent(id)), {
        method: 'DELETE',
        headers: headers()
      });
    }
  };

  global.SupabaseAPI = SupabaseAPI;
})(window);
