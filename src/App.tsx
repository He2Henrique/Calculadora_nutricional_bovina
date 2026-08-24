import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  Confirmacao,
  Ingrediente,
  Linha,
  Modo,
  MisturaSalva,
  Nutriente,
  NovoComposto,
  SalvarMisturaState
} from './types';
import { Api } from './lib/api';
import type { Medida, ModoApi } from './lib/api';
import { brl, fmt, num } from './lib/format';
import { updateById } from './lib/collections';
import { useAuth } from './AuthContext';

// Produto ainda não salvo no backend: existe só localmente até o drawer ser fechado.
const TEMP_ID_PREFIX = 'novo-';
function isTemp(id: string): boolean {
  return id.startsWith(TEMP_ID_PREFIX);
}
import IngredientesSection from './components/IngredientesSection';
import MisturasSection from './components/MisturasSection';
import MisturaSection from './components/MisturaSection';
import ResultadoSection from './components/ResultadoSection';
import DrawerComposto from './components/DrawerComposto';
import ConfirmModal from './components/ConfirmModal';
import NovoCompostoModal from './components/NovoCompostoModal';
import SalvarMisturaModal from './components/SalvarMisturaModal';

export default function App() {
  const { sair } = useAuth();
  const [nutrientes, setNutrientes] = useState<Nutriente[]>([]);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  // chave `${idFormulacao}:${idComposto}` -> id do registro em niveis-garantia,
  // para saber se um valor editado deve virar PATCH, POST ou DELETE.
  const [niveisPorChave, setNiveisPorChave] = useState<Record<string, number>>({});
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [modo, setModo] = useState<Modo>('pct');
  const [batch, setBatch] = useState('1000');
  const [saco, setSaco] = useState('30');
  const [seq, setSeq] = useState(0);
  const [aberto, setAberto] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [statusApi, setStatusApi] = useState('');
  const [confirmacao, setConfirmacao] = useState<Confirmacao | null>(null);
  const [novoComposto, setNovoComposto] = useState<NovoComposto | null>(null);
  const [misturas, setMisturas] = useState<MisturaSalva[]>([]);
  const [misturaAtualId, setMisturaAtualId] = useState<number | null>(null);
  const [misturaAtualNome, setMisturaAtualNome] = useState('');
  const [salvarMisturaAberto, setSalvarMisturaAberto] = useState<SalvarMisturaState | null>(null);

  const flash = useCallback((msg: string) => {
    setStatusApi(msg);
    setTimeout(() => {
      setStatusApi((atual) => (atual === msg ? '' : atual));
    }, 2500);
  }, []);

  const carregarMisturas = useCallback(() => {
    Promise.all([Api.listarMisturas(), Api.listarMisturaItens()])
      .then(([misturasBanco, itensBanco]) => {
        const itensPorMistura = new Map<number, typeof itensBanco>();
        itensBanco.forEach((it) => {
          const lista = itensPorMistura.get(it.id_mistura) ?? [];
          lista.push(it);
          itensPorMistura.set(it.id_mistura, lista);
        });
        setMisturas(
          misturasBanco.map((row) => ({
            id: row.id,
            nome: row.nome || '(sem nome)',
            modo: (row.modo === '%' ? 'pct' : 'kg') as Modo,
            batchKg: row.batch_kg,
            sacoKg: row.saco_kg,
            itens: (itensPorMistura.get(row.id) ?? []).map((it) => ({
              idFormulacao: String(it.id_formulacao),
              pct: it.pct,
              kg: it.kg
            }))
          }))
        );
      })
      .catch((e: Error) => setStatusApi('Erro ao carregar misturas: ' + e.message));
  }, []);

  const carregarCatalogo = useCallback(() => {
    Promise.all([Api.listarCompostos(), Api.listarFormulacoes(), Api.listarNiveisGarantia()])
      .then(([compostos, formulacoes, niveis]) => {
        const unidadePorComposto = new Map<number, Medida>();
        niveis.forEach((n) => {
          if (!unidadePorComposto.has(n.id_composto)) unidadePorComposto.set(n.id_composto, n.medida);
        });
        const novosNutrientes: Nutriente[] = compostos.map((c) => {
          const un = unidadePorComposto.get(c.id) ?? 'g';
          return { id: String(c.id), label: c.nome, unit: un, dec: un === 'mg' ? 0 : 1 };
        });

        const valoresPorFormulacao = new Map<number, Record<string, string>>();
        const novosNiveisPorChave: Record<string, number> = {};
        niveis.forEach((n) => {
          const valores = valoresPorFormulacao.get(n.id_formulacao) ?? {};
          valores[String(n.id_composto)] = String(n.quantidade);
          valoresPorFormulacao.set(n.id_formulacao, valores);
          novosNiveisPorChave[`${n.id_formulacao}:${n.id_composto}`] = n.id;
        });

        const novosIngredientes: Ingrediente[] = formulacoes.map((row) => ({
          id: String(row.id),
          nome: row.nome || '',
          preco: row.real_kg === null || row.real_kg === undefined ? '' : String(row.real_kg),
          valores: valoresPorFormulacao.get(row.id) ?? {}
        }));

        setNutrientes(novosNutrientes);
        setIngredientes(novosIngredientes);
        setNiveisPorChave(novosNiveisPorChave);
        setCarregando(false);
        setStatusApi('');
      })
      .catch((e: Error) => {
        setCarregando(false);
        setStatusApi('Erro ao carregar da API: ' + e.message);
      });
  }, []);

  useEffect(() => {
    carregarCatalogo();
    carregarMisturas();
  }, [carregarCatalogo, carregarMisturas]);

  function persistIngrediente(id: string, campos: { nome?: string; real_kg?: number }) {
    Api.atualizarFormulacao(Number(id), campos).catch((e: Error) => setStatusApi('Erro ao salvar: ' + e.message));
  }

  function persistirNivel(idFormulacao: string, idComposto: string, valor: string) {
    const chave = `${idFormulacao}:${idComposto}`;
    const nivelId = niveisPorChave[chave];
    const nutriente = nutrientes.find((n) => n.id === idComposto);
    const medida = (nutriente?.unit as Medida) ?? 'g';

    if (valor === '') {
      if (nivelId === undefined) return;
      Api.excluirNivelGarantia(nivelId)
        .then(() => {
          setNiveisPorChave((prev) => {
            const next = { ...prev };
            delete next[chave];
            return next;
          });
        })
        .catch((e: Error) => setStatusApi('Erro ao salvar: ' + e.message));
      return;
    }

    const quantidade = Math.round(num(valor));
    if (nivelId !== undefined) {
      Api.atualizarNivelGarantia(nivelId, { quantidade, medida }).catch((e: Error) =>
        setStatusApi('Erro ao salvar: ' + e.message)
      );
    } else {
      Api.criarNivelGarantia({ id_composto: Number(idComposto), id_formulacao: Number(idFormulacao), medida, quantidade })
        .then((row) => {
          setNiveisPorChave((prev) => ({ ...prev, [chave]: row.id }));
        })
        .catch((e: Error) => setStatusApi('Erro ao salvar: ' + e.message));
    }
  }

  function setValor(ingId: string, nutId: string, valor: string) {
    setIngredientes((prev) => prev.map((o) => (o.id === ingId ? { ...o, valores: { ...o.valores, [nutId]: valor } } : o)));
    if (!isTemp(ingId)) persistirNivel(ingId, nutId, valor);
  }

  // ---- derived values ----

  const pctMode = modo === 'pct';
  const batchNum = num(batch);
  const sacoNum = num(saco);

  const somaPct = linhas.reduce((acc, l) => acc + num(l.pct), 0);
  const somaKg = linhas.reduce((acc, l) => acc + num(l.kg), 0);
  const base = pctMode ? 100 : somaKg;
  const totalKgReal = pctMode ? batchNum : somaKg;

  const ingredientesPorId = useMemo(() => {
    const map = new Map<string, Ingrediente>();
    ingredientes.forEach((i) => map.set(i.id, i));
    return map;
  }, [ingredientes]);

  const custoKg = linhas.reduce((acc, l) => {
    const frac = base > 0 ? (pctMode ? num(l.pct) : num(l.kg)) / base : 0;
    const ing = ingredientesPorId.get(l.ingredienteId);
    return ing ? acc + frac * num(ing.preco) : acc;
  }, 0);

  const pctFora = pctMode && Math.abs(somaPct - 100) > 0.05;

  const resultado = nutrientes.map((n) => {
    const soma = linhas.reduce((acc, l) => {
      const frac = base > 0 ? (pctMode ? num(l.pct) : num(l.kg)) / base : 0;
      const ing = ingredientesPorId.get(l.ingredienteId);
      return ing ? acc + frac * num(ing.valores[n.id]) : acc;
    }, 0);
    return { id: n.id, label: n.label, unit: n.unit, valor: fmt(soma, n.dec) };
  });

  const abertoIng = aberto ? (ingredientesPorId.get(aberto) ?? null) : null;

  const totalPctLabel = fmt(pctMode ? somaPct : base > 0 ? 100 : 0, 1) + '%';
  const totalKgLabel = fmt(totalKgReal, totalKgReal >= 100 ? 0 : 1);
  const custoTotalLabel = custoKg > 0 ? brl(custoKg * totalKgReal) : '—';
  const custoKgLabel = custoKg > 0 ? brl(custoKg) : '—';
  const custoSacoLabel = custoKg > 0 ? brl(custoKg * sacoNum) : '—';
  const avisoText = pctFora
    ? `A soma das porcentagens está em ${fmt(somaPct, 1)}% — ajuste para 100%.`
    : 'Os níveis são a média ponderada dos produtos da mistura.';

  // ---- actions ----

  function addLinha() {
    const primeiro = ingredientes[0];
    setLinhas((prev) => [...prev, { id: `l${seq + 1}`, ingredienteId: primeiro ? primeiro.id : '', pct: '', kg: '' }]);
    setSeq((s) => s + 1);
  }

  function addIngrediente() {
    const tempId = `${TEMP_ID_PREFIX}${seq + 1}`;
    setSeq((s) => s + 1);
    const novo: Ingrediente = { id: tempId, nome: '', preco: '0', valores: {} };
    setIngredientes((prev) => [...prev, novo]);
    setAberto(tempId);
  }

  function fecharDrawer() {
    if (!aberto || !isTemp(aberto)) {
      setAberto(null);
      return;
    }

    const tempId = aberto;
    const temp = ingredientesPorId.get(tempId);
    setAberto(null);

    if (!temp || !temp.nome.trim()) {
      setIngredientes((prev) => prev.filter((i) => i.id !== tempId));
      return;
    }

    setStatusApi('Criando produto…');
    Api.criarFormulacao({ nome: temp.nome.trim(), real_kg: num(temp.preco) })
      .then((row) => {
        const novoId = String(row.id);
        const valoresPreenchidos = Object.entries(temp.valores).filter(([, v]) => v !== '');
        return Promise.all(
          valoresPreenchidos.map(([nutId, valor]) => {
            const nutriente = nutrientes.find((n) => n.id === nutId);
            const medida = (nutriente?.unit as Medida) ?? 'g';
            const quantidade = Math.round(num(valor));
            return Api.criarNivelGarantia({
              id_composto: Number(nutId),
              id_formulacao: row.id,
              medida,
              quantidade
            }).then((nivel) => [nutId, nivel.id] as const);
          })
        ).then((paresNivel) => {
          setIngredientes((prev) => prev.map((i) => (i.id === tempId ? { ...i, id: novoId } : i)));
          setLinhas((prev) => prev.map((l) => (l.ingredienteId === tempId ? { ...l, ingredienteId: novoId } : l)));
          setNiveisPorChave((prev) => {
            const next = { ...prev };
            paresNivel.forEach(([nutId, nivelId]) => {
              next[`${novoId}:${nutId}`] = nivelId;
            });
            return next;
          });
          setStatusApi('');
        });
      })
      .catch((e: Error) => setStatusApi('Erro ao criar produto: ' + e.message));
  }

  function removerProduto() {
    if (!aberto) return;
    const id = aberto;

    if (isTemp(id)) {
      setIngredientes((prev) => prev.filter((x) => x.id !== id));
      setAberto(null);
      return;
    }

    setConfirmacao({
      mensagem: 'Excluir este produto? Essa ação não pode ser desfeita.',
      onConfirmar: () => {
        Api.excluirFormulacaoComDependencias(Number(id))
          .then(() => {
            setIngredientes((prev) => prev.filter((x) => x.id !== id));
            setLinhas((prev) => prev.filter((l) => l.ingredienteId !== id));
            setNiveisPorChave((prev) => {
              const next: Record<string, number> = {};
              Object.entries(prev).forEach(([chave, valor]) => {
                if (!chave.startsWith(`${id}:`)) next[chave] = valor;
              });
              return next;
            });
            setAberto(null);
          })
          .catch((e: Error) => setStatusApi('Erro ao excluir: ' + e.message));
      }
    });
  }

  function novaMistura() {
    const iniciar = () => {
      setLinhas([]);
      setModo('pct');
      setBatch('1000');
      setSaco('30');
      setMisturaAtualId(null);
      setMisturaAtualNome('');
      flash('Nova mistura iniciada.');
    };
    if (!linhas.length && !misturaAtualId) {
      iniciar();
      return;
    }
    setConfirmacao({
      mensagem: 'Iniciar uma nova mistura? As linhas atuais não salvas serão perdidas.',
      rotulo: 'Continuar',
      onConfirmar: iniciar
    });
  }

  function confirmOk() {
    const acao = confirmacao?.onConfirmar;
    setConfirmacao(null);
    acao?.();
  }

  function editarComposto(n: Nutriente) {
    setNovoComposto({ id: n.id, campo: 'nome', nome: n.label, unidade: n.unit });
  }

  function editarUnidadeComposto(n: Nutriente) {
    setNovoComposto({ id: n.id, campo: 'unidade', nome: n.label, unidade: n.unit });
  }

  function novoCompostoConfirmar() {
    if (!novoComposto) return;

    if (novoComposto.id && novoComposto.campo === 'unidade') {
      const id = novoComposto.id;
      const un = (novoComposto.unidade || 'g') as Medida;
      setNovoComposto(null);
      setStatusApi('Salvando unidade…');
      Api.listarNiveisGarantia({ id_composto: Number(id) })
        .then((niveis) => Promise.all(niveis.map((nivel) => Api.atualizarNivelGarantia(nivel.id, { medida: un }))))
        .then(() => {
          setNutrientes((prev) => prev.map((n) => (n.id === id ? { ...n, unit: un, dec: un === 'mg' ? 0 : 1 } : n)));
          setStatusApi('');
        })
        .catch((e: Error) => setStatusApi('Erro ao salvar unidade: ' + e.message));
      return;
    }

    if (!novoComposto.nome.trim()) return;
    const nome = novoComposto.nome.trim();

    if (novoComposto.id) {
      const id = novoComposto.id;
      setNovoComposto(null);
      setStatusApi('Salvando composto…');
      Api.atualizarComposto(Number(id), { nome })
        .then(() => {
          setNutrientes((prev) => prev.map((n) => (n.id === id ? { ...n, label: nome } : n)));
          setStatusApi('');
        })
        .catch((e: Error) => setStatusApi('Erro ao salvar composto: ' + e.message));
      return;
    }

    const un = (novoComposto.unidade || 'g') as Medida;
    setNovoComposto(null);
    setStatusApi('Criando composto…');
    Api.criarComposto({ nome })
      .then((row) => {
        setNutrientes((prev) => [...prev, { id: String(row.id), label: row.nome, unit: un, dec: un === 'mg' ? 0 : 1 }]);
        setStatusApi('');
      })
      .catch((e: Error) => setStatusApi('Erro ao criar composto: ' + e.message));
  }

  function handleRemoveNutriente(n: Nutriente) {
    setConfirmacao({
      mensagem: `Remover o composto "${n.label}" de todos os produtos? Essa ação não pode ser desfeita.`,
      onConfirmar: () => {
        Api.excluirCompostoComDependencias(Number(n.id))
          .then(() => {
            setNutrientes((prev) => prev.filter((x) => x.id !== n.id));
            setIngredientes((prev) =>
              prev.map((ing) => {
                if (!(n.id in ing.valores)) return ing;
                const valores = { ...ing.valores };
                delete valores[n.id];
                return { ...ing, valores };
              })
            );
            setNiveisPorChave((prev) => {
              const next: Record<string, number> = {};
              Object.entries(prev).forEach(([chave, valor]) => {
                if (!chave.endsWith(`:${n.id}`)) next[chave] = valor;
              });
              return next;
            });
          })
          .catch((e: Error) => setStatusApi('Erro ao remover composto: ' + e.message));
      }
    });
  }

  function carregarMistura(m: MisturaSalva) {
    setLinhas(
      m.itens.map((it, idx) => ({
        id: `l${idx}`,
        ingredienteId: it.idFormulacao ?? '',
        pct: it.pct === null || it.pct === undefined ? '' : String(it.pct),
        kg: it.kg === null || it.kg === undefined ? '' : String(it.kg)
      }))
    );
    setModo(m.modo ?? 'pct');
    setBatch(m.batchKg === null || m.batchKg === undefined ? '1000' : String(m.batchKg));
    setSaco(m.sacoKg === null || m.sacoKg === undefined ? '30' : String(m.sacoKg));
    setMisturaAtualId(m.id);
    setMisturaAtualNome(m.nome);
    flash(`Mistura "${m.nome}" carregada.`);
  }

  function excluirMistura(m: MisturaSalva) {
    setConfirmacao({
      mensagem: `Excluir a mistura "${m.nome}"?`,
      onConfirmar: () => {
        Api.excluirMisturaComDependencias(m.id)
          .then(() => {
            setMisturas((prev) => prev.filter((x) => x.id !== m.id));
            if (misturaAtualId === m.id) {
              setMisturaAtualId(null);
              setMisturaAtualNome('');
            }
          })
          .catch((e: Error) => setStatusApi('Erro ao excluir mistura: ' + e.message));
      }
    });
  }

  function salvarMisturaConfirmar() {
    const nome = salvarMisturaAberto?.nome.trim() ?? '';
    if (!nome) return;
    const payloadMistura = {
      nome,
      modo: (modo === 'pct' ? '%' : 'kg') as ModoApi,
      batch_kg: Math.round(batchNum),
      saco_kg: Math.round(sacoNum)
    };
    const itens = linhas
      .filter((l) => l.ingredienteId)
      .map((l) => ({
        id_formulacao: Number(l.ingredienteId),
        pct: Math.round(num(l.pct) * 100) / 100,
        kg: Math.round(num(l.kg) * 100) / 100
      }));
    setSalvarMisturaAberto(null);
    setStatusApi('Salvando mistura…');
    const idAtual = misturaAtualId;
    const promessa = idAtual ? Api.atualizarMistura(idAtual, payloadMistura) : Api.criarMistura(payloadMistura);
    promessa
      .then((row) => {
        const id = idAtual ?? row?.id;
        if (id === undefined) throw new Error('Mistura sem id retornado.');
        return Api.salvarItensDaMistura(id, itens).then(() => id);
      })
      .then((id) => {
        setMisturaAtualId(id);
        setMisturaAtualNome(nome);
        flash(`Mistura "${nome}" salva!`);
        carregarMisturas();
      })
      .catch((e: Error) => setStatusApi('Erro ao salvar mistura: ' + e.message));
  }

  return (
    <>
      <div className="app">
        <header className="header">
          <div className="header-text">
            <span className="header-eyebrow">Formulação de rações</span>
            <h1 className="header-title">Calculadora de tabela nutricional</h1>
          </div>
          <p className="header-desc">
            Cadastre os níveis de garantia de cada produto, monte a mistura em % ou kg e veja a tabela nutricional do
            produto final.
          </p>
          <button type="button" className="btn-outline" onClick={sair}>
            Sair
          </button>
        </header>

        <section className="card">
          <div className="card-header">
            <div className="card-header-left">
              <span className="card-step">01</span>
              <h2 className="card-title">Produtos cadastrados</h2>
              <span className="card-hint">toque no produto para editar os compostos</span>
              <span className="card-status">{carregando ? 'Carregando dados da API…' : statusApi}</span>
            </div>
            <button type="button" className="btn-dark" onClick={addIngrediente}>
              + Produto
            </button>
          </div>
          <IngredientesSection
            ingredientes={ingredientes}
            nutrientes={nutrientes}
            onAbrir={setAberto}
            onPrecoChange={(id, valor) => {
              setIngredientes((prev) => updateById(prev, id, { preco: valor }));
              if (!isTemp(id)) persistIngrediente(id, { real_kg: num(valor) });
            }}
          />
        </section>

        <section className="card">
          <div className="card-header">
            <div className="card-header-left">
              <h2 className="card-title">Misturas salvas</h2>
              <span className="card-hint">toque no nome para carregar a mistura na seção 02</span>
            </div>
            <button type="button" className="btn-dark" onClick={novaMistura}>
              + Nova mistura
            </button>
          </div>
          <MisturasSection misturas={misturas} onCarregar={carregarMistura} onExcluir={excluirMistura} />
        </section>

        <div className="print-area grid-2col">
          <MisturaSection
            misturaAtualNome={misturaAtualNome}
            misturaAtualId={misturaAtualId}
            onModoChange={setModo}
            batch={batch}
            saco={saco}
            onBatchChange={setBatch}
            onSacoChange={setSaco}
            linhas={linhas}
            ingredientes={ingredientes}
            ingredientesPorId={ingredientesPorId}
            pctMode={pctMode}
            base={base}
            batchNum={batchNum}
            onLinhaSelect={(id, ingredienteId) => setLinhas((prev) => updateById(prev, id, { ingredienteId }))}
            onLinhaPct={(id, pct) => setLinhas((prev) => updateById(prev, id, { pct }))}
            onLinhaKg={(id, kg) => setLinhas((prev) => updateById(prev, id, { kg }))}
            onLinhaRemove={(id) => setLinhas((prev) => prev.filter((l) => l.id !== id))}
            onAddLinha={addLinha}
            onSalvarMisturaAbrir={() => setSalvarMisturaAberto({ nome: misturaAtualNome || '' })}
            totalPctLabel={totalPctLabel}
            totalKgLabel={totalKgLabel}
            custoTotalLabel={custoTotalLabel}
            corTotalPct={pctFora ? '#b4451f' : '#1b1917'}
            avisoText={avisoText}
          />

          <ResultadoSection
            custoKgLabel={custoKgLabel}
            custoSacoLabel={custoSacoLabel}
            resultado={resultado}
            onImprimir={() => window.print()}
          />
        </div>
      </div>

      <DrawerComposto
        ingrediente={abertoIng}
        nutrientes={nutrientes}
        onClose={fecharDrawer}
        onNomeChange={(nome) => {
          if (!aberto) return;
          setIngredientes((prev) => updateById(prev, aberto, { nome }));
          if (!isTemp(aberto)) persistIngrediente(aberto, { nome });
        }}
        onValorChange={(nutId, valor) => abertoIng && setValor(abertoIng.id, nutId, valor)}
        onAddComposto={() => setNovoComposto({ nome: '', unidade: 'g' })}
        onEditComposto={editarComposto}
        onEditUnidade={editarUnidadeComposto}
        onRemoverProduto={removerProduto}
        onRemoveNutriente={handleRemoveNutriente}
      />

      <ConfirmModal confirmacao={confirmacao} onCancelar={() => setConfirmacao(null)} onOk={confirmOk} />

      <NovoCompostoModal
        novoComposto={novoComposto}
        onNomeChange={(nome) => setNovoComposto((prev) => (prev ? { ...prev, nome } : prev))}
        onUnidadeChange={(unidade) => setNovoComposto((prev) => (prev ? { ...prev, unidade } : prev))}
        onCancelar={() => setNovoComposto(null)}
        onConfirmar={novoCompostoConfirmar}
      />

      <SalvarMisturaModal
        salvarMisturaAberto={salvarMisturaAberto}
        editando={misturaAtualId !== null}
        onNomeChange={(nome) => setSalvarMisturaAberto((prev) => (prev ? { ...prev, nome } : prev))}
        onCancelar={() => setSalvarMisturaAberto(null)}
        onConfirmar={salvarMisturaConfirmar}
      />
    </>
  );
}
