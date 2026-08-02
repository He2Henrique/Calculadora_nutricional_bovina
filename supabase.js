/**
 * Cliente REST para o Supabase.
 * Preencha SUPABASE_URL e SUPABASE_ANON_KEY antes de usar.
 *
 * Tabela "Formulacoes":
 * {
 *   "nome": "String",
 *   "real_kg": 99.99,
 *   "info_nutricional": {
 *     "nutriente": { "medida": "String(%/g/mg)", "quantidade": 99 }
 *   }
 * }
 *
 * Tabela "Misturas": id, nome, modo, batch_kg, saco_kg
 * Tabela "mistura_itens": id, id_mistura (FK -> Misturas.id), id_formulacao (FK -> Formulacoes.id), pct, kg
 */
(function (global) {
  var SUPABASE_URL = 'https://nrvpzewmekqrgiknnyen.supabase.co'; // ex: 'https://xxxxx.supabase.co'
  var SUPABASE_ANON_KEY = 'sb_publishable_0krNMf4ZdHGCS7zI5RebxQ_BNQV_jLc'; // chave anon/public do projeto

  function endpoint(table, path) {
    return SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/' + table + (path || '');
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

    // ---- Formulacoes ----

    listarFormulacoes: function () {
      return request(endpoint('Formulacoes', '?select=*&order=nome.asc'), {
        headers: headers()
      });
    },

    buscarFormulacao: function (id) {
      return request(endpoint('Formulacoes', '?id=eq.' + encodeURIComponent(id) + '&select=*'), {
        headers: headers()
      }).then(function (rows) { return rows && rows[0]; });
    },

    criarFormulacao: function (formulacao) {
      return request(endpoint('Formulacoes'), {
        method: 'POST',
        headers: headers({ Prefer: 'return=representation' }),
        body: JSON.stringify(formulacao)
      }).then(function (rows) { return rows && rows[0]; });
    },

    atualizarFormulacao: function (id, formulacao) {
      return request(endpoint('Formulacoes', '?id=eq.' + encodeURIComponent(id)), {
        method: 'PATCH',
        headers: headers({ Prefer: 'return=representation' }),
        body: JSON.stringify(formulacao)
      }).then(function (rows) { return rows && rows[0]; });
    },

    excluirFormulacao: function (id) {
      return request(endpoint('Formulacoes', '?id=eq.' + encodeURIComponent(id)), {
        method: 'DELETE',
        headers: headers()
      });
    },

    // ---- Misturas ----

    listarMisturas: function () {
      return request(endpoint('Misturas', '?select=*,mistura_itens(*)&order=nome.asc'), {
        headers: headers()
      });
    },

    criarMistura: function (mistura) {
      return request(endpoint('Misturas'), {
        method: 'POST',
        headers: headers({ Prefer: 'return=representation' }),
        body: JSON.stringify(mistura)
      }).then(function (rows) { return rows && rows[0]; });
    },

    atualizarMistura: function (id, mistura) {
      return request(endpoint('Misturas', '?id=eq.' + encodeURIComponent(id)), {
        method: 'PATCH',
        headers: headers({ Prefer: 'return=representation' }),
        body: JSON.stringify(mistura)
      }).then(function (rows) { return rows && rows[0]; });
    },

    excluirMistura: function (id) {
      return SupabaseAPI.excluirItensDaMistura(id).then(function () {
        return request(endpoint('Misturas', '?id=eq.' + encodeURIComponent(id)), {
          method: 'DELETE',
          headers: headers()
        });
      });
    },

    // ---- mistura_itens ----

    excluirItensDaMistura: function (idMistura) {
      return request(endpoint('mistura_itens', '?id_mistura=eq.' + encodeURIComponent(idMistura)), {
        method: 'DELETE',
        headers: headers()
      });
    },

    salvarItensDaMistura: function (idMistura, itens) {
      return SupabaseAPI.excluirItensDaMistura(idMistura).then(function () {
        if (!itens || !itens.length) return [];
        return request(endpoint('mistura_itens'), {
          method: 'POST',
          headers: headers({ Prefer: 'return=representation' }),
          body: JSON.stringify(itens.map(function (it) {
            return { id_mistura: idMistura, id_formulacao: it.id_formulacao, pct: it.pct, kg: it.kg };
          }))
        });
      });
    }
  };

  global.SupabaseAPI = SupabaseAPI;
})(window);
