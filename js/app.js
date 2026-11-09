/* Projeto de Ciências: lógica do site.
   Sem dependências. Os dados ficam no aparelho (localStorage) e a versão
   compartilhada com a turma fica em dados/projeto.json. */
(function () {
  'use strict';

  const M = window.MODELOS;
  const CHAVE = 'projeto-ciencias:v1';
  const PUBLICADO = 'dados/projeto.json';
  const SITE = 'Projeto de Ciências';

  /* ---------- Utilidades ---------- */

  const $ = (s, r = document) => r.querySelector(s);
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 8);
  const ico = (n) => `<svg class="ico" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

  const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const paraISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const hojeISO = () => paraISO(new Date());
  function deISO(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function dataCurta(s) {
    const d = deISO(s);
    if (!d) return '';
    const ano = d.getFullYear() === new Date().getFullYear() ? '' : ` ${d.getFullYear()}`;
    return `${d.getDate()} ${MESES[d.getMonth()]}${ano}`;
  }
  const difDias = (a, b) => Math.round((deISO(b) - deISO(a)) / 864e5);
  function somaDias(s, n) {
    const d = deISO(s);
    d.setDate(d.getDate() + n);
    return paraISO(d);
  }
  function dataHora(isoCompleto) {
    const d = new Date(isoCompleto);
    if (isNaN(d)) return '';
    return `${d.getDate()} ${MESES[d.getMonth()]} às ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  const num = (v) => v.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  function lerNumero(texto) {
    const t = String(texto).trim().replace(/\s/g, '').replace(',', '.');
    if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
    const v = Number(t);
    return Number.isFinite(v) ? v : null;
  }
  function estatistica(medidas) {
    const n = medidas.length;
    if (!n) return null;
    const media = medidas.reduce((a, b) => a + b, 0) / n;
    const dp = n > 1 ? Math.sqrt(medidas.reduce((a, b) => a + (b - media) ** 2, 0) / (n - 1)) : null;
    return { n, media, dp, min: Math.min(...medidas), max: Math.max(...medidas) };
  }

  /* ---------- Modelo de dados ---------- */

  function vazio() {
    return {
      versao: 1,
      publicadoEm: null,
      exemplo: false,
      projeto: { titulo: '', tema: '', turma: '', escola: '', orientador: '', pergunta: '', hipotese: '', objetivo: '', metodologia: '', seguranca: '' },
      etapas: [],
      tarefas: [],
      diario: [],
      resultados: { variavel: '', unidade: '', tratamentos: [] },
      equipe: [],
      materiais: [],
      referencias: []
    };
  }

  /* Aceita qualquer objeto (arquivo importado, versão publicada, localStorage)
     e devolve só os campos conhecidos, com tipos e tamanhos conferidos. */
  function normalizar(o) {
    const txt = (v, max = 6000) => (typeof v === 'string' ? v.slice(0, max) : typeof v === 'number' ? String(v) : '');
    const curto = (v) => txt(v, 200);
    const data = (v) => (typeof v === 'string' && deISO(v) ? v : '');
    const ident = (v) => (typeof v === 'string' && /^[\w-]{1,40}$/.test(v) ? v : uid());
    const lista = (v, f, max = 1000) => (Array.isArray(v) ? v.slice(0, max).filter((x) => x && typeof x === 'object').map(f) : []);
    const um = (v, opcoes) => (opcoes.includes(v) ? v : opcoes[0]);
    const link = (v) => (typeof v === 'string' && /^https?:\/\/\S+$/i.test(v) ? v.slice(0, 500) : '');

    const d = vazio();
    if (!o || typeof o !== 'object') return d;
    const p = o.projeto && typeof o.projeto === 'object' ? o.projeto : {};
    d.publicadoEm = typeof o.publicadoEm === 'string' && /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(o.publicadoEm) ? o.publicadoEm : null;
    d.exemplo = o.exemplo === true;
    d.projeto = {
      titulo: curto(p.titulo), tema: curto(p.tema), turma: curto(p.turma), escola: curto(p.escola), orientador: curto(p.orientador),
      pergunta: txt(p.pergunta), hipotese: txt(p.hipotese), objetivo: txt(p.objetivo), metodologia: txt(p.metodologia), seguranca: txt(p.seguranca)
    };
    d.etapas = lista(o.etapas, (e) => ({ id: ident(e.id), nome: curto(e.nome), inicio: data(e.inicio), fim: data(e.fim) }), 60);
    const idsEtapa = new Set(d.etapas.map((e) => e.id));
    d.tarefas = lista(o.tarefas, (t) => ({
      id: ident(t.id), titulo: curto(t.titulo), etapaId: idsEtapa.has(t.etapaId) ? t.etapaId : '',
      responsavel: curto(t.responsavel), prazo: data(t.prazo), status: um(t.status, ['afazer', 'andamento', 'feito']), notas: txt(t.notas)
    }));
    d.diario = lista(o.diario, (r) => ({ id: ident(r.id), data: data(r.data), autor: curto(r.autor), titulo: curto(r.titulo), texto: txt(r.texto, 20000) }));
    const r = o.resultados && typeof o.resultados === 'object' ? o.resultados : {};
    d.resultados = {
      variavel: curto(r.variavel), unidade: txt(r.unidade, 30),
      tratamentos: lista(r.tratamentos, (t) => ({
        id: ident(t.id), nome: curto(t.nome),
        medidas: (Array.isArray(t.medidas) ? t.medidas : []).filter((v) => typeof v === 'number' && Number.isFinite(v)).slice(0, 200)
      }), 40)
    };
    d.equipe = lista(o.equipe, (m) => ({ id: ident(m.id), nome: curto(m.nome), funcao: curto(m.funcao), grupo: curto(m.grupo) }), 200);
    d.materiais = lista(o.materiais, (m) => ({ id: ident(m.id), nome: curto(m.nome), quantidade: curto(m.quantidade), responsavel: curto(m.responsavel), status: um(m.status, ['falta', 'temos']) }), 300);
    d.referencias = lista(o.referencias, (f) => ({ id: ident(f.id), autor: txt(f.autor, 400), titulo: txt(f.titulo, 400), ano: txt(f.ano, 20), link: link(f.link) }), 300);
    return d;
  }

  function criarPlano(temaId, inicio, turma) {
    const d = vazio();
    const t = M.temas.find((x) => x.id === temaId);
    d.projeto.turma = turma;
    d.projeto.titulo = t ? t.titulo : 'Projeto de iniciação científica';
    if (t) {
      Object.assign(d.projeto, { tema: t.id, pergunta: t.pergunta, hipotese: t.hipotese, seguranca: t.seguranca });
      d.resultados = { variavel: t.variavel, unidade: t.unidade, tratamentos: t.tratamentos.map((nome) => ({ id: uid(), nome, medidas: [] })) };
      d.materiais = t.materiais.map((nome) => ({ id: uid(), nome, quantidade: '', responsavel: '', status: 'falta' }));
    }
    let cursor = inicio;
    M.etapas.forEach((e) => {
      const fim = somaDias(cursor, e.semanas * 7 - 1);
      const etapa = { id: uid(), nome: e.nome, inicio: cursor, fim };
      d.etapas.push(etapa);
      e.tarefas.forEach((titulo) => d.tarefas.push({ id: uid(), titulo, etapaId: etapa.id, responsavel: '', prazo: fim, status: 'afazer', notas: '' }));
      cursor = somaDias(fim, 1);
    });
    return d;
  }

  function criarExemplo() {
    const hoje = hojeISO();
    const d = criarPlano('extratos', somaDias(hoje, -38), '3ª série B');
    d.exemplo = true;
    Object.assign(d.projeto, {
      escola: 'Escola de exemplo', orientador: 'Profa. Helena',
      objetivo: 'Comparar o efeito de três extratos vegetais sobre o crescimento de Bacillus subtilis pelo método de disco-difusão.',
      metodologia: 'Semear a bactéria em placas com ágar nutriente. Aplicar discos de papel filtro embebidos em cada extrato e em água destilada. Incubar por 48 horas a 30 °C e medir o diâmetro do halo de inibição com régua. Três repetições por tratamento.'
    });
    const nomes = [['Ana', 'Líder do grupo', 'Grupo 1'], ['Bruno', 'Preparo dos extratos', 'Grupo 1'], ['Camila', 'Registro no diário', 'Grupo 1'], ['Diego', 'Medições', 'Grupo 2'], ['Elisa', 'Fotos e banner', 'Grupo 2'], ['Felipe', 'Referências', 'Grupo 2']];
    d.equipe = nomes.map(([nome, funcao, grupo]) => ({ id: uid(), nome, funcao, grupo }));
    d.tarefas.forEach((t, i) => {
      t.responsavel = nomes[i % nomes.length][0];
      if (i < 5) t.status = 'feito';
      if (i === 6 || i === 7) t.status = 'andamento';
    });
    d.materiais.forEach((m, i) => {
      m.status = i === 1 || i === 6 ? 'falta' : 'temos';
      m.responsavel = nomes[i % nomes.length][0];
    });
    d.materiais[0].quantidade = '20 placas';
    d.materiais[2].quantidade = '1 caixa';
    d.diario = [
      { id: uid(), data: somaDias(hoje, -2), autor: 'Camila', titulo: 'Segunda rodada de placas', texto: 'Repetimos os quatro tratamentos em placas novas.\nO extrato de cravo ficou mais concentrado que na primeira rodada, anotar isso na análise.' },
      { id: uid(), data: somaDias(hoje, -9), autor: 'Camila', titulo: 'Primeira rodada de placas', texto: 'Semeamos 4 placas e aplicamos os discos. As placas foram lacradas e levadas para a caixa aquecida a 30 °C.' },
      { id: uid(), data: somaDias(hoje, -20), autor: 'Bruno', titulo: 'Preparo dos extratos', texto: 'Trituramos 10 g de cada planta em 50 mL de água destilada e filtramos em papel filtro.' }
    ];
    const medidas = [[0, 0, 0], [14, 16, 15], [19, 21, 18], [9, 11]];
    d.resultados.tratamentos.forEach((t, i) => { t.medidas = medidas[i] || []; });
    d.referencias = [
      { id: uid(), autor: 'TORTORA, G. J.; FUNKE, B. R.; CASE, C. L.', titulo: 'Microbiologia. 12. ed. Porto Alegre: Artmed', ano: '2017', link: '' },
      { id: uid(), autor: 'MADIGAN, M. T. et al.', titulo: 'Microbiologia de Brock. 14. ed. Porto Alegre: Artmed', ano: '2016', link: '' }
    ];
    return d;
  }

  /* ---------- Estado e armazenamento ---------- */

  let E = carregarLocal();
  let pub = { estado: 'verificando' };
  let versaoPendente = false;
  let filtroTarefas = 'todas';
  let focarDepois = null;

  function carregarLocal() {
    try {
      const bruto = JSON.parse(localStorage.getItem(CHAVE));
      if (bruto && bruto.dados) {
        return { dados: normalizar(bruto.dados), base: bruto.base || null, sujo: !!bruto.sujo, exportadoEm: bruto.exportadoEm || null, editadoAposExportar: !!bruto.editadoAposExportar, dispensado: bruto.dispensado || null };
      }
    } catch (erro) { /* armazenamento indisponível ou corrompido: começa vazio */ }
    return { dados: vazio(), base: null, sujo: false, exportadoEm: null, editadoAposExportar: false, dispensado: null };
  }

  function salvar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(E));
    } catch (erro) {
      avisar('Não foi possível salvar neste aparelho. Baixe o arquivo do projeto para não perder as alterações.');
    }
  }

  /* Toda alteração passa por aqui: salva, redesenha e oferece desfazer. */
  function alterar(fn, mensagem) {
    const antes = JSON.stringify(E);
    fn(E.dados);
    E.sujo = true;
    E.editadoAposExportar = true;
    salvar();
    desenhar();
    if (mensagem) {
      avisar(mensagem, 'Desfazer', () => {
        E = JSON.parse(antes);
        salvar();
        desenhar();
      });
    }
  }

  function substituirTudo(dados, mensagem, extra) {
    const antes = JSON.stringify(E);
    E.dados = dados;
    Object.assign(E, extra || {});
    salvar();
    desenhar();
    avisar(mensagem, 'Desfazer', () => {
      E = JSON.parse(antes);
      salvar();
      desenhar();
    });
  }

  async function verificarPublicado() {
    try {
      const resposta = await fetch(`${PUBLICADO}?t=${Date.now()}`, { cache: 'no-store' });
      if (!resposta.ok) throw new Error('sem arquivo');
      const dados = normalizar(await resposta.json());
      pub = dados.publicadoEm ? { estado: 'ok', dados } : { estado: 'sem' };
    } catch (erro) {
      pub = { estado: 'erro' };
    }
    if (pub.estado === 'ok') {
      const p = pub.dados.publicadoEm;
      if (E.exportadoEm === p) {
        E.base = p;
        if (!E.editadoAposExportar) E.sujo = false;
      }
      const maisNova = E.base !== p && (!E.base || p > E.base);
      if (maisNova && !E.sujo) {
        E.dados = pub.dados;
        E.base = p;
      } else if (maisNova && E.dispensado !== p) {
        versaoPendente = true;
      }
      salvar();
    }
    desenhar();
  }

  /* ---------- Aviso flutuante ---------- */

  let relogioAviso = null;
  function avisar(texto, rotuloAcao, acao) {
    const caixa = $('#aviso');
    clearTimeout(relogioAviso);
    caixa.innerHTML = `<p>${esc(texto)}</p>${rotuloAcao ? `<button type="button">${esc(rotuloAcao)}</button>` : ''}`;
    caixa.hidden = false;
    const botao = $('button', caixa);
    if (botao) botao.addEventListener('click', () => { caixa.hidden = true; acao(); });
    relogioAviso = setTimeout(() => { caixa.hidden = true; }, rotuloAcao ? 8000 : 5000);
  }

  /* ---------- Folha de edição (formulário genérico) ---------- */

  const folha = $('#folha');
  let folhaAtual = null;

  function abrirFolha({ titulo, campos, valores = {}, salvar: aoSalvar, excluir, rotuloSalvar = 'Salvar' }) {
    folhaAtual = { campos, aoSalvar, excluir };
    $('#folha-titulo').textContent = titulo;
    $('#folha-salvar').textContent = rotuloSalvar;
    $('#folha-excluir').hidden = !excluir;
    $('#folha-campos').innerHTML = campos.map((c) => campoHTML(c, valores[c.n])).join('');
    if (!folha.open) folha.showModal();
    $('#folha-campos').scrollTop = 0;
    const primeiro = $('input, textarea, select', $('#folha-campos'));
    if (primeiro && !valores[campos[0].n]) primeiro.focus();
  }

  function campoHTML(c, valor) {
    const v = valor == null ? '' : valor;
    const comuns = `name="${c.n}" id="c-${c.n}"${c.obrig ? ' required' : ''}${c.dica ? ` aria-describedby="d-${c.n}"` : ''}`;
    let controle;
    if (c.t === 'area') {
      controle = `<textarea ${comuns} rows="${c.linhas || 4}"${c.exemplo ? ` placeholder="${esc(c.exemplo)}"` : ''}>${esc(v)}</textarea>`;
    } else if (c.t === 'escolha') {
      controle = `<select ${comuns}>${c.opcoes.map(([valorOp, rotulo]) => `<option value="${esc(valorOp)}"${valorOp === v ? ' selected' : ''}>${esc(rotulo)}</option>`).join('')}</select>`;
    } else {
      const tipo = c.t === 'data' ? 'date' : 'text';
      const lista = c.lista && c.lista.length ? ` list="l-${c.n}"` : '';
      const modo = c.t === 'link' ? ' inputmode="url" autocapitalize="off"' : '';
      controle = `<input type="${tipo}" ${comuns}${lista}${modo} value="${esc(v)}"${c.exemplo ? ` placeholder="${esc(c.exemplo)}"` : ''} autocomplete="off">`;
      if (lista) controle += `<datalist id="l-${c.n}">${c.lista.map((x) => `<option value="${esc(x)}">`).join('')}</datalist>`;
    }
    return `<label class="campo"><span>${esc(c.r)}</span>${controle}${c.dica ? `<small id="d-${c.n}">${esc(c.dica)}</small>` : ''}<small class="erro" id="e-${c.n}" hidden></small></label>`;
  }

  $('#folha-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (!folhaAtual) return;
    const form = new FormData(ev.target);
    const valores = {};
    let primeiroErro = null;
    folhaAtual.campos.forEach((c) => {
      let v = String(form.get(c.n) || '').trim();
      let erro = '';
      if (c.t === 'link' && v && !/^https?:\/\//i.test(v)) v = `https://${v}`;
      if (c.obrig && !v) erro = 'Preencha este campo.';
      else if (c.t === 'link' && v && !/^https?:\/\/\S+\.\S+$/i.test(v)) erro = 'Digite um endereço completo, como https://exemplo.org.';
      else if (c.valida) erro = c.valida(v, form) || '';
      const controle = $(`#c-${c.n}`);
      const caixaErro = $(`#e-${c.n}`);
      controle.setAttribute('aria-invalid', erro ? 'true' : 'false');
      caixaErro.textContent = erro;
      caixaErro.hidden = !erro;
      if (erro && !primeiroErro) primeiroErro = controle;
      valores[c.n] = v;
    });
    if (primeiroErro) { primeiroErro.focus(); return; }
    const { aoSalvar } = folhaAtual;
    folha.close();
    aoSalvar(valores);
  });
  $('#folha-excluir').addEventListener('click', () => {
    const { excluir } = folhaAtual;
    folha.close();
    excluir();
  });
  folha.addEventListener('close', () => { folhaAtual = null; });

  /* ---------- Páginas ---------- */

  const ROTAS = {
    inicio: ['Início', pgInicio], tarefas: ['Tarefas', pgTarefas], diario: ['Diário de bordo', pgDiario], resultados: ['Resultados', pgResultados],
    mais: ['Mais', pgMais], projeto: ['Projeto', pgProjeto], cronograma: ['Cronograma', pgCronograma], equipe: ['Equipe', pgEquipe],
    materiais: ['Materiais', pgMateriais], referencias: ['Referências', pgReferencias], dados: ['Dados e publicação', pgDados]
  };
  const PRINCIPAIS = ['inicio', 'tarefas', 'diario', 'resultados', 'mais'];

  const rotaAtual = () => {
    const r = location.hash.replace(/^#\/?/, '') || 'inicio';
    return ROTAS[r] ? r : 'inicio';
  };
  const projetoVazio = (d) => !d.projeto.titulo && !d.etapas.length && !d.tarefas.length && !d.diario.length;

  function desenhar() {
    const rota = rotaAtual();
    const [nome, pagina] = ROTAS[rota];
    const d = E.dados;
    document.title = rota === 'inicio' ? SITE : `${nome} · ${SITE}`;
    document.querySelectorAll('.nav a').forEach((a) => {
      const r = a.dataset.rota;
      const ativo = r === rota || (r === 'mais' && !PRINCIPAIS.includes(rota));
      if (ativo) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    $('#conteudo').innerHTML = pagina(d);
    if (rota === 'resultados') posicionarPontos();
    if (focarDepois) {
      const alvo = $(focarDepois);
      if (alvo) alvo.focus();
      focarDepois = null;
    }
  }

  const topo = (titulo, meta, botoes = '') => `
    <div class="pagina-topo">
      <div><h1>${esc(titulo)}</h1>${meta ? `<p class="meta">${meta}</p>` : ''}</div>
      ${botoes}
    </div>`;
  const botaoNovo = (acao, rotulo) => `<button type="button" class="btn primario" data-acao="${acao}">${ico('somar')}${esc(rotulo)}</button>`;
  const estadoVazio = (titulo, texto, botao = '') => `<div class="vazio"><h2>${esc(titulo)}</h2><p>${esc(texto)}</p>${botao ? `<div class="botoes">${botao}</div>` : ''}</div>`;

  function faixaVersao() {
    if (!versaoPendente || pub.estado !== 'ok') return '';
    return `<div class="faixa alerta">${ico('alerta')}<div class="faixa-corpo">
      <p><strong>Há uma versão publicada mais nova</strong>, de ${esc(dataHora(pub.dados.publicadoEm))}. Este aparelho tem alterações que não foram publicadas.</p>
      <div class="botoes"><button type="button" class="btn secundario" data-acao="usar-publicada">Usar a publicada</button><button type="button" class="btn quieto" data-acao="manter-minhas">Manter as minhas</button></div>
    </div></div>`;
  }

  /* Início */

  function pgInicio(d) {
    if (projetoVazio(d)) return pgComecar();
    const p = d.projeto;
    const hoje = hojeISO();
    const meta = [p.turma, p.escola, p.orientador ? `Orientação: ${p.orientador}` : ''].filter(Boolean).map(esc).join(' · ');
    let h = topo(p.titulo || 'Projeto sem título', meta);
    h += faixaVersao();
    if (d.exemplo) {
      h += `<div class="faixa">${ico('info')}<div class="faixa-corpo"><p><strong>Este é um projeto de exemplo.</strong> Os nomes e as medidas são ilustrativos, para mostrar como o site fica quando preenchido.</p>
        <div class="botoes"><button type="button" class="btn secundario" data-acao="apagar-exemplo">Apagar o exemplo e começar o meu</button></div></div></div>`;
    }

    const sec = (ordem, conteudo) => `<section class="secao" style="order:${ordem}">${conteudo}</section>`;
    let colA = sec(1, `<h2>Pergunta de pesquisa</h2>${p.pergunta ? `<p class="pergunta">${esc(p.pergunta)}</p>` : `<p class="fraco">A pergunta ainda não foi escrita. <a href="#/projeto">Escrever agora</a></p>`}`);
    let colB = '';

    const etapas = etapasOrdenadas(d);
    if (etapas.length) {
      colA += sec(2, `<div class="secao-topo"><h2>Cronograma</h2><a href="#/cronograma">Editar</a></div>${trilha(etapas, hoje)}<ol class="lista">${etapas.map((e) => linhaEtapa(d, e, hoje, false)).join('')}</ol>`);
    }

    const abertas = d.tarefas.filter((t) => t.status !== 'feito').sort(porPrazo);
    if (abertas.length) {
      colB += sec(3, `<div class="secao-topo"><h2>Próximas tarefas</h2><a href="#/tarefas">Ver todas</a></div><ul class="lista">${abertas.slice(0, 5).map((t) => linhaTarefa(d, t, hoje)).join('')}</ul>`);
    } else if (d.tarefas.length) {
      colB += sec(3, `<h2>Próximas tarefas</h2><p class="fraco">Todas as ${d.tarefas.length} tarefas estão feitas.</p>`);
    }

    const pend = pendencias(d, hoje);
    if (pend.length) {
      colB += sec(4, `<h2>Pendências</h2><ul class="lista">${pend.map(([texto, destino]) => `<li class="linha"><a class="linha-corpo" href="#/${destino}"><span class="linha-texto"><span class="linha-titulo">${esc(texto)}</span></span><svg class="ico linha-seta" aria-hidden="true"><use href="#i-seta"/></svg></a></li>`).join('')}</ul>`);
    }

    const ultimo = diarioOrdenado(d)[0];
    if (ultimo) {
      colA += sec(5, `<div class="secao-topo"><h2>Último registro do diário</h2><a href="#/diario">Abrir o diário</a></div>${registroHTML(ultimo, false)}`);
    }
    h += colB ? `<div class="colunas"><div>${colA}</div><div>${colB}</div></div>` : colA;
    return h;
  }

  function pgComecar() {
    const temas = M.temas.map((t) => `<label class="tema"><input type="radio" name="tema" value="${t.id}"><span><strong>${esc(t.titulo)}</strong><small>${esc(t.requisito)}</small></span></label>`).join('');
    return `${topo('Comece o projeto')}
      ${faixaVersao()}
      <p class="lead">Escolha o tema que a turma votou. O site monta um plano inicial com pergunta, hipótese, etapas, tarefas e materiais. Depois dá para mudar tudo.</p>
      <form data-form="comecar">
        <fieldset class="temas"><legend>Tema do projeto</legend>
          ${temas}
          <label class="tema"><input type="radio" name="tema" value="outro"><span><strong>Outro tema</strong><small>Você escreve a pergunta, os tratamentos e os materiais</small></span></label>
        </fieldset>
        <p class="campo"><small class="erro" id="erro-tema" hidden>Escolha um tema para continuar.</small></p>
        <div class="duas">
          <label class="campo"><span>Data de início</span><input type="date" name="inicio" value="${hojeISO()}" required><small>As 6 etapas somam 12 semanas a partir desta data.</small></label>
          <label class="campo"><span>Turma</span><input type="text" name="turma" placeholder="3ª série B" autocomplete="off"></label>
        </div>
        <div class="botoes">
          <button type="submit" class="btn primario">Criar o plano</button>
          <button type="button" class="btn quieto" data-acao="exemplo">Ver um projeto de exemplo</button>
        </div>
      </form>`;
  }

  const etapasOrdenadas = (d) => d.etapas.slice().sort((a, b) => (a.inicio || '9999').localeCompare(b.inicio || '9999'));
  const porPrazo = (a, b) => (a.prazo || '9999').localeCompare(b.prazo || '9999');
  const diarioOrdenado = (d) => d.diario.map((r, i) => [r, i]).sort((a, b) => b[0].data.localeCompare(a[0].data) || b[1] - a[1]).map(([r]) => r);

  function trilha(etapas, hoje) {
    const datadas = etapas.filter((e) => e.inicio && e.fim && e.fim >= e.inicio);
    if (datadas.length < 2) return '';
    const inicio = datadas[0].inicio;
    const fim = datadas.reduce((m, e) => (e.fim > m ? e.fim : m), inicio);
    const total = difDias(inicio, fim) + 1;
    const segs = datadas.map((e) => {
      const estado = e.fim < hoje ? 'passada' : e.inicio <= hoje ? 'atual' : '';
      return `<div class="trilha-seg ${estado}" style="flex:${difDias(e.inicio, e.fim) + 1} 0 0"></div>`;
    }).join('');
    let marca = '';
    if (hoje >= inicio && hoje <= fim) {
      const pos = ((difDias(inicio, hoje) + 0.5) / total) * 100;
      marca = `<div class="trilha-hoje${pos > 70 ? ' fim' : ''}" style="left:${pos.toFixed(2)}%"><span>Hoje</span></div>`;
    }
    return `<div class="trilha" role="img" aria-label="Linha do tempo do projeto, de ${esc(dataCurta(inicio))} a ${esc(dataCurta(fim))}"><div class="trilha-barra">${segs}</div>${marca}</div>
      <div class="trilha-pontas num"><span>${esc(dataCurta(inicio))}</span><span>${esc(dataCurta(fim))}</span></div>`;
  }

  function situacaoEtapa(d, e, hoje) {
    const abertas = d.tarefas.filter((t) => t.etapaId === e.id && t.status !== 'feito').length;
    if (!e.inicio || !e.fim) return '';
    if (e.fim < hoje) return abertas ? `<span class="etiqueta atrasada">${plural(abertas, 'tarefa aberta', 'tarefas abertas')}</span>` : '<span class="etiqueta feita">Concluída</span>';
    if (e.inicio <= hoje) {
      const faltam = difDias(hoje, e.fim);
      return `<span class="etiqueta agora">Agora, ${faltam === 0 ? 'termina hoje' : `faltam ${plural(faltam, 'dia', 'dias')}`}</span>`;
    }
    return '';
  }

  function linhaEtapa(d, e, hoje, editavel) {
    const total = d.tarefas.filter((t) => t.etapaId === e.id).length;
    const periodo = e.inicio && e.fim ? `<span class="num">${esc(dataCurta(e.inicio))} a ${esc(dataCurta(e.fim))}</span>` : '<span>Sem datas</span>';
    const corpo = `<span class="linha-texto"><span class="linha-titulo">${esc(e.nome)}</span><span class="linha-sub">${periodo}${situacaoEtapa(d, e, hoje)}${editavel && total ? `<span>${plural(total, 'tarefa', 'tarefas')}</span>` : ''}</span></span>`;
    return editavel
      ? `<li class="linha"><button type="button" class="linha-corpo" data-acao="editar-etapa" data-id="${e.id}">${corpo}<svg class="ico linha-seta" aria-hidden="true"><use href="#i-seta"/></svg></button></li>`
      : `<li class="linha"><div class="linha-corpo">${corpo}</div></li>`;
  }

  function pendencias(d, hoje) {
    const lista = [];
    const atrasadas = d.tarefas.filter((t) => t.status !== 'feito' && t.prazo && t.prazo < hoje).length;
    if (atrasadas) lista.push([plural(atrasadas, 'tarefa atrasada', 'tarefas atrasadas'), 'tarefas']);
    const falta = d.materiais.filter((m) => m.status === 'falta').length;
    if (falta) lista.push([plural(falta, 'material em falta', 'materiais em falta'), 'materiais']);
    const ultimo = diarioOrdenado(d)[0];
    if (!ultimo) lista.push(['O diário de bordo ainda não tem registros', 'diario']);
    else if (ultimo.data && difDias(ultimo.data, hoje) > 7) lista.push([`Último registro no diário há ${difDias(ultimo.data, hoje)} dias`, 'diario']);
    const comMedidas = d.resultados.tratamentos.some((t) => t.medidas.length);
    const poucas = d.resultados.tratamentos.filter((t) => t.medidas.length < 3).length;
    if (comMedidas && poucas) lista.push([`${plural(poucas, 'tratamento', 'tratamentos')} com menos de 3 repetições`, 'resultados']);
    return lista;
  }

  /* Tarefas */

  function linhaTarefa(d, t, hoje) {
    const feita = t.status === 'feito';
    const sub = [];
    if (t.responsavel) sub.push(`<span>${esc(t.responsavel)}</span>`);
    if (t.prazo) sub.push(`<span class="num">${esc(dataCurta(t.prazo))}</span>`);
    if (!feita && t.prazo && t.prazo < hoje) sub.push(`<span class="etiqueta atrasada">Atrasada ${plural(difDias(t.prazo, hoje), 'dia', 'dias')}</span>`);
    else if (t.status === 'andamento') sub.push('<span class="etiqueta andamento">Em andamento</span>');
    return `<li class="linha${feita ? ' feita' : ''}">
      <button type="button" class="marca-feito" data-acao="alternar-tarefa" data-id="${t.id}" aria-pressed="${feita}" aria-label="${feita ? 'Reabrir' : 'Marcar como feita'}: ${esc(t.titulo)}">${ico('feito')}</button>
      <button type="button" class="linha-corpo" data-acao="editar-tarefa" data-id="${t.id}"><span class="linha-texto"><span class="linha-titulo">${esc(t.titulo)}</span>${sub.length ? `<span class="linha-sub">${sub.join('')}</span>` : ''}</span><svg class="ico linha-seta" aria-hidden="true"><use href="#i-seta"/></svg></button>
    </li>`;
  }

  function pgTarefas(d) {
    const hoje = hojeISO();
    const feitas = d.tarefas.filter((t) => t.status === 'feito').length;
    let h = topo('Tarefas', d.tarefas.length ? `${feitas} de ${d.tarefas.length} feitas` : '', botaoNovo('nova-tarefa', 'Nova tarefa'));
    if (!d.tarefas.length) {
      return h + estadoVazio('Nenhuma tarefa ainda', 'Divida o trabalho em tarefas pequenas, cada uma com um responsável e um prazo. Assim a turma sabe quem faz o quê.');
    }
    const filtros = [['todas', 'Todas'], ['afazer', 'A fazer'], ['andamento', 'Em andamento'], ['feito', 'Feitas']];
    h += `<div class="filtro" role="group" aria-label="Filtrar tarefas">${filtros.map(([v, r]) => {
      const n = v === 'todas' ? d.tarefas.length : d.tarefas.filter((t) => t.status === v).length;
      return `<button type="button" data-acao="filtrar-tarefas" data-valor="${v}" aria-pressed="${filtroTarefas === v}">${r}<span class="num">${n}</span></button>`;
    }).join('')}</div>`;
    const visiveis = d.tarefas.filter((t) => filtroTarefas === 'todas' || t.status === filtroTarefas);
    if (!visiveis.length) return h + `<p class="fraco secao">Nenhuma tarefa neste filtro.</p>`;
    const grupos = etapasOrdenadas(d).map((e) => [e, visiveis.filter((t) => t.etapaId === e.id)]);
    grupos.push([null, visiveis.filter((t) => !t.etapaId)]);
    grupos.forEach(([e, lista]) => {
      if (!lista.length) return;
      const periodo = e && e.inicio && e.fim ? `<span class="num">${esc(dataCurta(e.inicio))} a ${esc(dataCurta(e.fim))}</span>` : '';
      h += `<div class="grupo-titulo"><h2>${e ? esc(e.nome) : 'Sem etapa'}</h2>${periodo}</div>
        <ul class="lista">${lista.sort((a, b) => (a.status === 'feito') - (b.status === 'feito') || porPrazo(a, b)).map((t) => linhaTarefa(d, t, hoje)).join('')}</ul>`;
    });
    return h;
  }

  const nomesEquipe = (d) => d.equipe.map((m) => m.nome).filter(Boolean);

  function formTarefa(t) {
    const d = E.dados;
    abrirFolha({
      titulo: t ? 'Editar tarefa' : 'Nova tarefa',
      valores: t || { status: 'afazer', etapaId: etapaDeHoje(d) },
      campos: [
        { n: 'titulo', r: 'O que precisa ser feito', obrig: true, exemplo: 'Preparar os extratos' },
        { n: 'responsavel', r: 'Responsável', lista: nomesEquipe(d) },
        { n: 'prazo', r: 'Prazo', t: 'data' },
        { n: 'etapaId', r: 'Etapa', t: 'escolha', opcoes: [['', 'Sem etapa']].concat(etapasOrdenadas(d).map((e) => [e.id, e.nome])) },
        { n: 'status', r: 'Situação', t: 'escolha', opcoes: [['afazer', 'A fazer'], ['andamento', 'Em andamento'], ['feito', 'Feita']] },
        { n: 'notas', r: 'Anotações', t: 'area', linhas: 3 }
      ],
      salvar: (v) => alterar((dd) => {
        if (t) Object.assign(dd.tarefas.find((x) => x.id === t.id), v);
        else dd.tarefas.push(Object.assign({ id: uid() }, v));
      }),
      excluir: t && (() => alterar((dd) => { dd.tarefas = dd.tarefas.filter((x) => x.id !== t.id); }, 'Tarefa excluída.'))
    });
  }

  function etapaDeHoje(d) {
    const hoje = hojeISO();
    const e = d.etapas.find((x) => x.inicio && x.fim && x.inicio <= hoje && hoje <= x.fim);
    return e ? e.id : '';
  }

  /* Cronograma */

  function pgCronograma(d) {
    const hoje = hojeISO();
    const etapas = etapasOrdenadas(d);
    let h = topo('Cronograma', etapas.length ? plural(etapas.length, 'etapa', 'etapas') : '', botaoNovo('nova-etapa', 'Nova etapa'));
    if (!etapas.length) return h + estadoVazio('Nenhuma etapa ainda', 'Etapas são os grandes blocos do projeto, como planejamento, experimento e apresentação. Cada tarefa pode pertencer a uma etapa.');
    return h + trilha(etapas, hoje) + `<ol class="lista">${etapas.map((e) => linhaEtapa(d, e, hoje, true)).join('')}</ol>`;
  }

  function formEtapa(e) {
    abrirFolha({
      titulo: e ? 'Editar etapa' : 'Nova etapa',
      valores: e || {},
      campos: [
        { n: 'nome', r: 'Nome da etapa', obrig: true, exemplo: 'Experimento e coleta de dados' },
        { n: 'inicio', r: 'Começa em', t: 'data' },
        { n: 'fim', r: 'Termina em', t: 'data', valida: (v, f) => (v && f.get('inicio') && v < f.get('inicio') ? 'O término precisa ser depois do início.' : '') }
      ],
      salvar: (v) => alterar((dd) => {
        if (e) Object.assign(dd.etapas.find((x) => x.id === e.id), v);
        else dd.etapas.push(Object.assign({ id: uid() }, v));
      }),
      excluir: e && (() => alterar((dd) => {
        dd.etapas = dd.etapas.filter((x) => x.id !== e.id);
        dd.tarefas.forEach((t) => { if (t.etapaId === e.id) t.etapaId = ''; });
      }, 'Etapa excluída. As tarefas dela ficaram sem etapa.'))
    });
  }

  /* Diário de bordo */

  function registroHTML(r, editavel) {
    const Tag = editavel ? 'h2' : 'h3';
    return `<article class="registro">
      <p class="registro-data num">${esc(dataCurta(r.data) || 'Sem data')}</p>
      <div><div class="registro-topo"><div><${Tag}>${esc(r.titulo)}</${Tag}>${r.autor ? `<p class="meta">${esc(r.autor)}</p>` : ''}</div>
        ${editavel ? `<button type="button" class="btn-ico" data-acao="editar-registro" data-id="${r.id}" aria-label="Editar registro: ${esc(r.titulo)}">${ico('editar')}</button>` : ''}</div>
      ${r.texto ? `<p class="registro-texto">${esc(r.texto)}</p>` : ''}</div>
    </article>`;
  }

  function pgDiario(d) {
    const registros = diarioOrdenado(d);
    let h = topo('Diário de bordo', registros.length ? plural(registros.length, 'registro', 'registros') : '', botaoNovo('novo-registro', 'Novo registro'));
    if (!registros.length) {
      return h + estadoVazio('O diário está em branco', 'Registre cada sessão de trabalho no mesmo dia: o que foi feito, o que foi observado e o que deu errado. As feiras de ciências pedem o diário de bordo junto com o relatório.');
    }
    return h + registros.map((r) => registroHTML(r, true)).join('');
  }

  function formRegistro(r) {
    abrirFolha({
      titulo: r ? 'Editar registro' : 'Novo registro',
      valores: r || { data: hojeISO() },
      campos: [
        { n: 'data', r: 'Data', t: 'data', obrig: true },
        { n: 'titulo', r: 'Resumo em uma linha', obrig: true, exemplo: 'Primeira rodada de placas' },
        { n: 'autor', r: 'Quem registrou', lista: nomesEquipe(E.dados) },
        { n: 'texto', r: 'O que foi feito e observado', t: 'area', linhas: 7 }
      ],
      salvar: (v) => alterar((dd) => {
        if (r) Object.assign(dd.diario.find((x) => x.id === r.id), v);
        else dd.diario.push(Object.assign({ id: uid() }, v));
      }),
      excluir: r && (() => alterar((dd) => { dd.diario = dd.diario.filter((x) => x.id !== r.id); }, 'Registro excluído.'))
    });
  }

  /* Resultados */

  function pgResultados(d) {
    const r = d.resultados;
    const un = r.unidade ? ` ${r.unidade}` : '';
    const variavel = r.variavel ? `Variável medida: ${esc(r.variavel)}${r.unidade ? ` (${esc(r.unidade)})` : ''}` : 'A variável medida ainda não foi definida';
    let h = topo('Resultados', variavel, `<button type="button" class="btn secundario" data-acao="editar-variavel">Editar variável</button>`);
    if (!r.tratamentos.length) {
      return h + estadoVazio('Nenhum tratamento cadastrado', 'Tratamentos são os grupos que você compara, incluindo o controle. Cadastre cada um e depois digite a medida de cada repetição.', botaoNovo('novo-tratamento', 'Novo tratamento'));
    }
    const comMedidas = r.tratamentos.filter((t) => t.medidas.length);
    if (comMedidas.length) {
      h += `<section class="secao"><h2>${esc(r.variavel || 'Medidas')} por tratamento</h2>${grafico(r, comMedidas)}</section>`;
    }
    h += `<section class="secao"><div class="secao-topo"><h2>Medidas</h2></div>${r.tratamentos.map((t) => tratamentoHTML(t, r)).join('')}
      <div class="botoes">${botaoNovo('novo-tratamento', 'Novo tratamento')}</div></section>`;
    if (comMedidas.length) {
      h += `<section class="secao"><h2>Resumo</h2><div class="rolar"><table class="resumo">
        <thead><tr><th scope="col">Tratamento</th><th scope="col">n</th><th scope="col">Média${esc(un)}</th><th scope="col"><abbr title="Desvio padrão">DP</abbr></th><th scope="col">Mín. a máx.</th></tr></thead>
        <tbody>${comMedidas.map((t) => {
          const s = estatistica(t.medidas);
          return `<tr><th scope="row">${esc(t.nome)}</th><td>${s.n}</td><td>${num(s.media)}</td><td>${s.dp == null ? '' : num(s.dp)}</td><td>${num(s.min)} a ${num(s.max)}</td></tr>`;
        }).join('')}</tbody></table></div><p class="nota">DP é o desvio padrão: mostra quanto as repetições variam em torno da média. Quanto menor, mais parecidas elas são.</p></section>`;
    }
    return h;
  }

  function tratamentoHTML(t, r) {
    const s = estatistica(t.medidas);
    const un = r.unidade ? ` ${r.unidade}` : '';
    let resumo = 'Sem medidas ainda';
    if (s) {
      resumo = `${plural(s.n, 'repetição', 'repetições')}, média ${num(s.media)}${un}`;
      if (s.n < 3) resumo += '. Faça pelo menos 3 repetições';
    }
    return `<div class="trat">
      <div class="trat-topo"><h3>${esc(t.nome)}</h3><button type="button" class="btn-ico" data-acao="editar-tratamento" data-id="${t.id}" aria-label="Editar tratamento: ${esc(t.nome)}">${ico('editar')}</button></div>
      <p class="trat-resumo">${esc(resumo)}</p>
      ${t.medidas.length ? `<div class="medidas">${t.medidas.map((v, i) => `<button type="button" class="medida" data-acao="remover-medida" data-id="${t.id}" data-i="${i}" aria-label="Remover a medida ${num(v)}${esc(un)}">${num(v)}${ico('fechar')}</button>`).join('')}</div>` : ''}
      <form class="add-medida" data-form="medida" data-id="${t.id}" novalidate>
        <input type="text" inputmode="decimal" name="valor" autocomplete="off" placeholder="Nova medida" aria-label="Nova medida de ${esc(t.nome)}${r.unidade ? ` em ${esc(r.unidade)}` : ''}">
        <button type="submit" class="btn secundario">Adicionar</button>
      </form>
    </div>`;
  }

  /* Gráfico de pontos: cada repetição é um ponto, o traço marca a média. */
  function grafico(r, tratamentos) {
    const todos = tratamentos.flatMap((t) => t.medidas);
    const min = Math.min(...todos);
    const max = Math.max(...todos);
    let lo = min >= 0 && min <= 0.6 * max ? 0 : min;
    let hi = max;
    if (lo === hi) { hi = lo + 1; lo = lo >= 1 ? lo - 1 : lo; }
    const passo = passoRedondo((hi - lo) / 4);
    lo = Math.floor(lo / passo + 1e-9) * passo;
    hi = Math.ceil(hi / passo - 1e-9) * passo;
    const pos = (v) => ((v - lo) / (hi - lo)) * 100;
    const marcas = [];
    for (let v = lo; v <= hi + passo / 2; v += passo) marcas.push(Number(v.toPrecision(12)));
    const un = r.unidade ? ` ${r.unidade}` : '';
    const grade = marcas.map((v) => `<i class="g-grade" style="left:${pos(v).toFixed(3)}%"></i>`).join('');

    const linhas = tratamentos.map((t) => {
      const s = estatistica(t.medidas);
      const pontos = t.medidas.map((v, i) => `<button type="button" class="ponto" tabindex="-1" style="left:${pos(v).toFixed(3)}%" data-x="${pos(v).toFixed(3)}" data-dica="Repetição ${i + 1}: ${num(v)}${esc(un)}"></button>`).join('');
      return `<div class="g-linha"><div class="g-rotulo"><strong>${esc(t.nome)}</strong><span class="num">média ${num(s.media)}${esc(un)}</span></div>
        <div class="g-area"><div class="g-faixa">${grade}<i class="g-media" style="left:${pos(s.media).toFixed(3)}%"></i>${pontos}</div></div></div>`;
    }).join('');

    const descricao = `Gráfico de pontos de ${r.variavel || 'medidas'} por tratamento. ` + tratamentos.map((t) => `${t.nome}: média ${num(estatistica(t.medidas).media)}${un}`).join('; ') + '. Os valores completos estão na tabela Resumo.';
    return `<figure class="grafico" id="grafico" role="img" aria-label="${esc(descricao)}">
      ${linhas}
      <div class="g-eixo">${marcas.map((v) => `<span style="left:${pos(v).toFixed(3)}%">${num(v)}</span>`).join('')}</div>
      <div class="g-legenda"><span><i class="l-ponto"></i>Cada ponto é uma repetição</span><span><i class="l-media"></i>Média do tratamento</span>${r.unidade ? `<span>Eixo em ${esc(r.unidade)}</span>` : ''}</div>
    </figure>`;
  }

  function passoRedondo(bruto) {
    const potencia = 10 ** Math.floor(Math.log10(bruto));
    const fracao = bruto / potencia;
    return (fracao <= 1 ? 1 : fracao <= 2 ? 2 : fracao <= 5 ? 5 : 10) * potencia;
  }

  /* Pontos com valores iguais ou muito próximos são afastados na vertical. */
  function posicionarPontos() {
    document.querySelectorAll('.g-faixa').forEach((faixa) => {
      const largura = faixa.clientWidth || 300;
      const postos = [];
      Array.from(faixa.querySelectorAll('.ponto')).sort((a, b) => a.dataset.x - b.dataset.x).forEach((p) => {
        const x = (p.dataset.x / 100) * largura;
        let nivel = 0;
        const niveis = [0, -1, 1, -2, 2];
        for (const n of niveis) {
          nivel = n;
          if (!postos.some((q) => q.n === n && Math.abs(q.x - x) < 13)) break;
        }
        postos.push({ x, n: nivel });
        p.style.top = `calc(50% + ${nivel * 9}px)`;
      });
    });
  }

  function mostrarDica(ponto) {
    const fig = $('#grafico');
    if (!fig) return;
    esconderDica();
    const a = ponto.getBoundingClientRect();
    const b = fig.getBoundingClientRect();
    const dica = document.createElement('div');
    dica.className = 'g-dica';
    dica.textContent = ponto.dataset.dica;
    fig.appendChild(dica);
    const meio = a.left - b.left + a.width / 2;
    const metade = dica.offsetWidth / 2;
    dica.style.left = `${Math.min(Math.max(meio, metade), b.width - metade)}px`;
    dica.style.top = `${a.top - b.top - 8}px`;
    ponto.classList.add('ativo');
  }
  function esconderDica() {
    document.querySelectorAll('.g-dica').forEach((x) => x.remove());
    document.querySelectorAll('.ponto.ativo').forEach((x) => x.classList.remove('ativo'));
  }

  function formVariavel() {
    const r = E.dados.resultados;
    abrirFolha({
      titulo: 'Variável medida',
      valores: r,
      campos: [
        { n: 'variavel', r: 'O que vocês medem', obrig: true, exemplo: 'Halo de inibição', dica: 'É a variável dependente: o que muda por causa do tratamento.' },
        { n: 'unidade', r: 'Unidade', exemplo: 'mm' }
      ],
      salvar: (v) => alterar((dd) => Object.assign(dd.resultados, v))
    });
  }

  function formTratamento(t) {
    abrirFolha({
      titulo: t ? 'Editar tratamento' : 'Novo tratamento',
      valores: t || {},
      campos: [{ n: 'nome', r: 'Nome do tratamento', obrig: true, exemplo: 'Controle (água destilada)', dica: 'Inclua sempre um controle para comparar.' }],
      salvar: (v) => alterar((dd) => {
        if (t) dd.resultados.tratamentos.find((x) => x.id === t.id).nome = v.nome;
        else dd.resultados.tratamentos.push({ id: uid(), nome: v.nome, medidas: [] });
      }),
      excluir: t && (() => alterar((dd) => { dd.resultados.tratamentos = dd.resultados.tratamentos.filter((x) => x.id !== t.id); }, 'Tratamento excluído com as medidas dele.'))
    });
  }

  /* Projeto */

  const CAMPOS_PROJETO = [
    { n: 'titulo', r: 'Título do projeto', obrig: true },
    { n: 'turma', r: 'Turma', exemplo: '3ª série B' },
    { n: 'escola', r: 'Escola' },
    { n: 'orientador', r: 'Professor orientador' },
    { n: 'pergunta', r: 'Pergunta de pesquisa', t: 'area', linhas: 3, dica: 'Uma pergunta que o experimento consegue responder com medidas.' },
    { n: 'hipotese', r: 'Hipótese', t: 'area', linhas: 3, dica: 'O que a turma espera que aconteça, e que os resultados podem confirmar ou não.' },
    { n: 'objetivo', r: 'Objetivo', t: 'area', linhas: 3 },
    { n: 'metodologia', r: 'Metodologia', t: 'area', linhas: 6, dica: 'O passo a passo do experimento, com quantidades, tempos e número de repetições.' },
    { n: 'seguranca', r: 'Regras de segurança', t: 'area', linhas: 5 }
  ];

  function pgProjeto(d) {
    const p = d.projeto;
    const itens = CAMPOS_PROJETO.map((c) => `<div><dt>${esc(c.r)}</dt><dd${p[c.n] ? '' : ' class="falta"'}>${p[c.n] ? esc(p[c.n]) : 'Ainda não preenchido'}</dd></div>`).join('');
    return `${topo('Projeto', '', `<button type="button" class="btn primario" data-acao="editar-projeto">${ico('editar')}Editar</button>`)}<dl class="definicao">${itens}</dl>`;
  }

  /* Equipe */

  function pgEquipe(d) {
    let h = topo('Equipe', d.equipe.length ? plural(d.equipe.length, 'pessoa', 'pessoas') : '', botaoNovo('novo-membro', 'Nova pessoa'));
    if (!d.equipe.length) return h + estadoVazio('Ninguém cadastrado', 'Cadastre os colegas com a função de cada um. Os nomes aparecem como sugestão ao escolher o responsável por uma tarefa.');
    const linha = (m) => `<li class="linha"><button type="button" class="linha-corpo" data-acao="editar-membro" data-id="${m.id}"><span class="linha-texto"><span class="linha-titulo">${esc(m.nome)}</span>${m.funcao ? `<span class="linha-sub"><span>${esc(m.funcao)}</span></span>` : ''}</span><svg class="ico linha-seta" aria-hidden="true"><use href="#i-seta"/></svg></button></li>`;
    const porNome = (a, b) => a.nome.localeCompare(b.nome, 'pt-BR');
    const grupos = Array.from(new Set(d.equipe.map((m) => m.grupo))).sort((a, b) => (a === '') - (b === '') || a.localeCompare(b, 'pt-BR', { numeric: true }));
    if (grupos.length === 1 && grupos[0] === '') return h + `<ul class="lista">${d.equipe.slice().sort(porNome).map(linha).join('')}</ul>`;
    grupos.forEach((g) => {
      h += `<div class="grupo-titulo"><h2>${g ? esc(g) : 'Sem grupo'}</h2></div><ul class="lista">${d.equipe.filter((m) => m.grupo === g).sort(porNome).map(linha).join('')}</ul>`;
    });
    return h;
  }

  function formMembro(m) {
    const grupos = Array.from(new Set(E.dados.equipe.map((x) => x.grupo).filter(Boolean)));
    abrirFolha({
      titulo: m ? 'Editar pessoa' : 'Nova pessoa',
      valores: m || {},
      campos: [
        { n: 'nome', r: 'Nome', obrig: true },
        { n: 'funcao', r: 'Função no projeto', exemplo: 'Registro no diário' },
        { n: 'grupo', r: 'Grupo', lista: grupos, exemplo: 'Grupo 1' }
      ],
      salvar: (v) => alterar((dd) => {
        if (m) Object.assign(dd.equipe.find((x) => x.id === m.id), v);
        else dd.equipe.push(Object.assign({ id: uid() }, v));
      }),
      excluir: m && (() => alterar((dd) => { dd.equipe = dd.equipe.filter((x) => x.id !== m.id); }, 'Pessoa removida da equipe.'))
    });
  }

  /* Materiais */

  function pgMateriais(d) {
    const temos = d.materiais.filter((m) => m.status === 'temos').length;
    let h = topo('Materiais', d.materiais.length ? `${temos} de ${d.materiais.length} conseguidos` : '', botaoNovo('novo-material', 'Novo material'));
    if (!d.materiais.length) return h + estadoVazio('Lista de materiais vazia', 'Liste tudo o que o experimento precisa, com a quantidade e quem vai trazer. Marque cada item quando ele chegar.');
    const ordenados = d.materiais.slice().sort((a, b) => (a.status === 'temos') - (b.status === 'temos') || a.nome.localeCompare(b.nome, 'pt-BR'));
    return h + `<ul class="lista">${ordenados.map((m) => {
      const ok = m.status === 'temos';
      const sub = [m.quantidade, m.responsavel].filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join('');
      return `<li class="linha${ok ? ' feita' : ''}">
        <button type="button" class="marca-feito" data-acao="alternar-material" data-id="${m.id}" aria-pressed="${ok}" aria-label="${ok ? 'Marcar como em falta' : 'Marcar como conseguido'}: ${esc(m.nome)}">${ico('feito')}</button>
        <button type="button" class="linha-corpo" data-acao="editar-material" data-id="${m.id}"><span class="linha-texto"><span class="linha-titulo">${esc(m.nome)}</span>${sub ? `<span class="linha-sub">${sub}</span>` : ''}</span><svg class="ico linha-seta" aria-hidden="true"><use href="#i-seta"/></svg></button>
      </li>`;
    }).join('')}</ul>`;
  }

  function formMaterial(m) {
    abrirFolha({
      titulo: m ? 'Editar material' : 'Novo material',
      valores: m || { status: 'falta' },
      campos: [
        { n: 'nome', r: 'Material', obrig: true, exemplo: 'Placas de Petri com ágar nutriente' },
        { n: 'quantidade', r: 'Quantidade', exemplo: '20 placas' },
        { n: 'responsavel', r: 'Quem vai trazer', lista: nomesEquipe(E.dados) },
        { n: 'status', r: 'Situação', t: 'escolha', opcoes: [['falta', 'Em falta'], ['temos', 'Já temos']] }
      ],
      salvar: (v) => alterar((dd) => {
        if (m) Object.assign(dd.materiais.find((x) => x.id === m.id), v);
        else dd.materiais.push(Object.assign({ id: uid() }, v));
      }),
      excluir: m && (() => alterar((dd) => { dd.materiais = dd.materiais.filter((x) => x.id !== m.id); }, 'Material excluído.'))
    });
  }

  /* Referências */

  function pgReferencias(d) {
    let h = topo('Referências', d.referencias.length ? plural(d.referencias.length, 'fonte', 'fontes') : '', botaoNovo('nova-referencia', 'Nova referência'));
    if (!d.referencias.length) return h + estadoVazio('Nenhuma referência ainda', 'Guarde aqui os livros, artigos e sites usados na pesquisa. Anote o autor, o título e o ano enquanto lê, para montar a lista do relatório sem esforço.');
    const ordenadas = d.referencias.slice().sort((a, b) => (a.autor || a.titulo).localeCompare(b.autor || b.titulo, 'pt-BR'));
    return h + `<ul class="lista">${ordenadas.map((f) => {
      const sub = [f.autor, f.ano].filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join('');
      return `<li class="linha">
        <button type="button" class="linha-corpo" data-acao="editar-referencia" data-id="${f.id}"><span class="linha-texto"><span class="linha-titulo">${esc(f.titulo)}</span>${sub ? `<span class="linha-sub">${sub}</span>` : ''}</span></button>
        ${f.link ? `<a class="btn-ico" href="${esc(f.link)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir o link de ${esc(f.titulo)} em nova aba">${ico('externo')}</a>` : ''}
      </li>`;
    }).join('')}</ul>`;
  }

  function formReferencia(f) {
    abrirFolha({
      titulo: f ? 'Editar referência' : 'Nova referência',
      valores: f || {},
      campos: [
        { n: 'titulo', r: 'Título', obrig: true },
        { n: 'autor', r: 'Autor', exemplo: 'SOBRENOME, Nome', dica: 'No padrão da ABNT, o sobrenome vem primeiro, em maiúsculas.' },
        { n: 'ano', r: 'Ano' },
        { n: 'link', r: 'Link', t: 'link', exemplo: 'https://' }
      ],
      salvar: (v) => alterar((dd) => {
        if (f) Object.assign(dd.referencias.find((x) => x.id === f.id), v);
        else dd.referencias.push(Object.assign({ id: uid() }, v));
      }),
      excluir: f && (() => alterar((dd) => { dd.referencias = dd.referencias.filter((x) => x.id !== f.id); }, 'Referência excluída.'))
    });
  }

  /* Mais (só no celular) */

  function pgMais(d) {
    const itens = [
      ['projeto', 'Projeto', 'Pergunta, hipótese, metodologia e segurança'],
      ['cronograma', 'Cronograma', plural(d.etapas.length, 'etapa', 'etapas')],
      ['equipe', 'Equipe', plural(d.equipe.length, 'pessoa', 'pessoas')],
      ['materiais', 'Materiais', `${d.materiais.filter((m) => m.status === 'falta').length} em falta`],
      ['referencias', 'Referências', plural(d.referencias.length, 'fonte', 'fontes')],
      ['dados', 'Dados e publicação', 'Baixar, abrir e publicar o arquivo do projeto']
    ];
    return `${topo('Mais')}<ul class="lista">${itens.map(([rota, nome, sub]) => `<li class="linha"><a class="linha-corpo" href="#/${rota}"><svg class="ico linha-ico" aria-hidden="true"><use href="#i-${rota}"/></svg><span class="linha-texto"><span class="linha-titulo">${nome}</span><span class="linha-sub"><span>${esc(sub)}</span></span></span><svg class="ico linha-seta" aria-hidden="true"><use href="#i-seta"/></svg></a></li>`).join('')}</ul>`;
  }

  /* Dados e publicação */

  function pgDados() {
    let situacao;
    if (pub.estado === 'verificando') situacao = 'Verificando a versão publicada.';
    else if (pub.estado === 'erro') situacao = 'Não foi possível ler a versão publicada. Isso é esperado quando o site é aberto direto do arquivo, fora do endereço da turma.';
    else if (pub.estado === 'sem') situacao = 'Ainda não há uma versão publicada para a turma.';
    else situacao = `A versão publicada é de ${dataHora(pub.dados.publicadoEm)}. ${E.sujo ? 'Este aparelho tem alterações que ainda não foram publicadas.' : 'Este aparelho está igual a ela.'}`;
    return `${topo('Dados e publicação')}
      ${faixaVersao()}
      <section class="secao"><h2>Onde os dados ficam</h2>
        <p>Tudo o que você altera fica salvo neste aparelho. O restante da turma só vê as alterações depois que o arquivo do projeto é publicado no repositório.</p>
        <p class="meta">${esc(situacao)}</p>
        <div class="botoes">
          <button type="button" class="btn primario" data-acao="baixar">${ico('baixar')}Baixar o arquivo do projeto</button>
          <button type="button" class="btn secundario" data-acao="abrir-arquivo">${ico('abrir')}Abrir um arquivo</button>
        </div>
      </section>
      <section class="secao"><h2>Como publicar para a turma</h2>
        <ol class="passos">
          <li>Toque em Baixar o arquivo do projeto. O arquivo se chama <code>projeto.json</code>.</li>
          <li>No GitHub, abra a pasta <code>dados</code> do repositório.</li>
          <li>Use Add file, depois Upload files, e envie o arquivo para substituir o antigo.</li>
          <li>Confirme em Commit changes. Em cerca de um minuto, quem abrir o site vê a nova versão.</li>
        </ol>
        <p class="meta">Só quem tem permissão de escrita no repositório consegue publicar.</p>
      </section>
      <section class="secao"><h2>Recomeçar</h2>
        <p>Apaga o projeto deste aparelho. A versão publicada não muda.</p>
        <div class="botoes">
          ${pub.estado === 'ok' && E.sujo ? '<button type="button" class="btn secundario" data-acao="usar-publicada">Voltar à versão publicada</button>' : ''}
          <button type="button" class="btn perigo-quieto" data-acao="apagar-tudo">Apagar tudo deste aparelho</button>
        </div>
      </section>`;
  }

  function baixar() {
    const agora = new Date().toISOString();
    const saida = Object.assign({}, E.dados, { publicadoEm: agora });
    const url = URL.createObjectURL(new Blob([JSON.stringify(saida, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'projeto.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    E.exportadoEm = agora;
    E.editadoAposExportar = false;
    salvar();
    avisar('Arquivo projeto.json baixado. Envie para a pasta dados do repositório para publicar.');
  }

  $('#arquivo').addEventListener('change', async (ev) => {
    const arquivo = ev.target.files[0];
    ev.target.value = '';
    if (!arquivo) return;
    let bruto;
    try {
      bruto = JSON.parse(await arquivo.text());
    } catch (erro) {
      avisar('Este arquivo não pôde ser lido. Escolha um projeto.json baixado por este site.');
      return;
    }
    if (!bruto || typeof bruto !== 'object' || !bruto.projeto) {
      avisar('Este arquivo não é um projeto deste site. Escolha um projeto.json baixado aqui.');
      return;
    }
    const dados = normalizar(bruto);
    const igualPublicada = pub.estado === 'ok' && pub.dados.publicadoEm === dados.publicadoEm;
    substituirTudo(dados, 'Arquivo aberto. O projeto deste aparelho foi substituído.', { base: dados.publicadoEm, sujo: !igualPublicada, editadoAposExportar: !igualPublicada });
  });

  /* ---------- Ações ---------- */

  const achar = (lista, el) => lista.find((x) => x.id === el.dataset.id);

  const ACOES = {
    'fechar-folha': () => folha.close(),
    'exemplo': () => substituirTudo(criarExemplo(), 'Projeto de exemplo carregado.', { sujo: true }),
    'apagar-exemplo': () => substituirTudo(vazio(), 'Exemplo apagado.', { sujo: false, base: null }),
    'apagar-tudo': () => { location.hash = '#/'; substituirTudo(vazio(), 'Projeto apagado deste aparelho.', { sujo: false, base: null }); },
    'usar-publicada': () => { versaoPendente = false; substituirTudo(pub.dados, 'Agora este aparelho usa a versão publicada.', { base: pub.dados.publicadoEm, sujo: false, editadoAposExportar: false }); },
    'manter-minhas': () => { versaoPendente = false; E.dispensado = pub.dados.publicadoEm; salvar(); desenhar(); },
    'baixar': baixar,
    'abrir-arquivo': () => $('#arquivo').click(),

    'nova-tarefa': () => formTarefa(null),
    'editar-tarefa': (el) => formTarefa(achar(E.dados.tarefas, el)),
    'alternar-tarefa': (el) => {
      focarDepois = `[data-acao="alternar-tarefa"][data-id="${el.dataset.id}"]`;
      alterar((d) => { const t = achar(d.tarefas, el); t.status = t.status === 'feito' ? 'afazer' : 'feito'; });
    },
    'filtrar-tarefas': (el) => { filtroTarefas = el.dataset.valor; focarDepois = `[data-acao="filtrar-tarefas"][data-valor="${filtroTarefas}"]`; desenhar(); },

    'nova-etapa': () => formEtapa(null),
    'editar-etapa': (el) => formEtapa(achar(E.dados.etapas, el)),
    'novo-registro': () => formRegistro(null),
    'editar-registro': (el) => formRegistro(achar(E.dados.diario, el)),

    'editar-variavel': formVariavel,
    'novo-tratamento': () => formTratamento(null),
    'editar-tratamento': (el) => formTratamento(achar(E.dados.resultados.tratamentos, el)),
    'remover-medida': (el) => alterar((d) => { achar(d.resultados.tratamentos, el).medidas.splice(+el.dataset.i, 1); }, 'Medida removida.'),

    'editar-projeto': () => abrirFolha({
      titulo: 'Editar projeto', valores: E.dados.projeto, campos: CAMPOS_PROJETO,
      salvar: (v) => alterar((d) => Object.assign(d.projeto, v))
    }),
    'novo-membro': () => formMembro(null),
    'editar-membro': (el) => formMembro(achar(E.dados.equipe, el)),
    'novo-material': () => formMaterial(null),
    'editar-material': (el) => formMaterial(achar(E.dados.materiais, el)),
    'alternar-material': (el) => {
      focarDepois = `[data-acao="alternar-material"][data-id="${el.dataset.id}"]`;
      alterar((d) => { const m = achar(d.materiais, el); m.status = m.status === 'temos' ? 'falta' : 'temos'; });
    },
    'nova-referencia': () => formReferencia(null),
    'editar-referencia': (el) => formReferencia(achar(E.dados.referencias, el))
  };

  document.addEventListener('click', (ev) => {
    const ponto = ev.target.closest('.ponto');
    if (ponto) { mostrarDica(ponto); return; }
    esconderDica();
    const el = ev.target.closest('[data-acao]');
    if (el && ACOES[el.dataset.acao]) ACOES[el.dataset.acao](el);
  });
  document.addEventListener('pointerover', (ev) => {
    if (ev.pointerType !== 'mouse') return;
    const ponto = ev.target.closest('.ponto');
    if (ponto) mostrarDica(ponto);
  });
  document.addEventListener('pointerout', (ev) => {
    if (ev.pointerType === 'mouse' && ev.target.closest('.ponto')) esconderDica();
  });

  document.addEventListener('submit', (ev) => {
    const form = ev.target.closest('[data-form]');
    if (!form) return;
    ev.preventDefault();
    if (form.dataset.form === 'comecar') {
      const dadosForm = new FormData(form);
      const tema = dadosForm.get('tema');
      const erro = $('#erro-tema');
      if (!tema) {
        erro.hidden = false;
        form.querySelector('input[name="tema"]').focus();
        return;
      }
      const inicio = deISO(dadosForm.get('inicio')) ? dadosForm.get('inicio') : hojeISO();
      const plano = criarPlano(tema, inicio, String(dadosForm.get('turma') || '').trim().slice(0, 200));
      E.dados = plano;
      E.sujo = true;
      E.editadoAposExportar = true;
      salvar();
      desenhar();
      window.scrollTo(0, 0);
      avisar('Plano criado. Revise a pergunta e as datas.');
    }
    if (form.dataset.form === 'medida') {
      const campo = form.elements.valor;
      const valor = lerNumero(campo.value);
      if (valor == null) {
        campo.setAttribute('aria-invalid', 'true');
        campo.focus();
        avisar('Digite só o número, por exemplo 12,5.');
        return;
      }
      focarDepois = `form[data-id="${form.dataset.id}"] input`;
      alterar((d) => { d.resultados.tratamentos.find((t) => t.id === form.dataset.id).medidas.push(valor); });
    }
  });

  /* ---------- Início ---------- */

  window.addEventListener('hashchange', () => {
    desenhar();
    window.scrollTo(0, 0);
    $('#conteudo').focus({ preventScroll: true });
  });
  let relogioLargura = null;
  window.addEventListener('resize', () => {
    clearTimeout(relogioLargura);
    relogioLargura = setTimeout(posicionarPontos, 150);
  });

  desenhar();
  verificarPublicado();
})();
