const API_BASE = '/api';
const $ = id => document.getElementById(id);

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const authArea       = $('authArea');
const appArea        = $('appArea');
const formAuth       = $('formAuth');
const authNome       = $('authNome');
const authEmail      = $('authEmail');
const authSenha      = $('authSenha');
const grupoNome      = $('grupoNome');
const tabLogin       = $('tabLogin');
const tabCadastro    = $('tabCadastro');
const btnAuth        = $('btnAuth');
const btnSair        = $('btnSair');
const usuarioLogado  = $('usuarioLogado');
const btnAtualizar   = $('btnAtualizar');

const form           = $('formPagamento');
const pagamentoId    = $('pagamentoId');
const nome           = $('nome');
const dataPagamento  = $('dataPagamento');
const dataVencimento = $('dataVencimento');
const valor          = $('valor');
const observacao     = $('observacao');
const tbody          = $('tbodyPagamentos');
const busca          = $('busca');
const filtroStatus   = $('filtroStatus');
const mesResumo         = $('mesResumo');
const selectClienteDash = $('filtroClienteDash');
const btnCancelar         = $('btnCancelar');
const tituloForm          = $('tituloForm');
const totalAReceber       = $('totalAReceber');
const comprovanteInput    = $('comprovante');
const comprovanteAtual    = $('comprovanteAtual');
const btnVerComprovante   = $('btnVerComprovante');
const removerComprovante  = $('removerComprovante');

const inputDataInicio = $('inputDataInicio');
const inputDataFim    = $('inputDataFim');
const btnLimpar       = $('btnLimparFiltros');

const modalPagar       = $('modalPagar');
const inputDataPago    = $('inputDataPago');
const btnConfirmarPago = $('btnConfirmarPago');
const btnCancelarPago  = $('btnCancelarPago');

const modalExtrato        = $('modalExtrato');
const extratoTituloEl     = $('extratoTitulo');
const extratoSubtituloEl  = $('extratoSubtitulo');
const extratoDtInicio     = $('extratoDtInicio');
const extratoDtFim        = $('extratoDtFim');
const extratoFiltroStatus = $('extratoFiltroStatus');
const extratoBusca        = $('extratoBusca');
const extratoEmailInput   = $('extratoEmailInput');
const extratoLoading      = $('extratoLoading');
const grupoExtratoBusca   = $('grupoExtratoBusca');
const btnBaixarExtrato    = $('btnBaixarExtrato');
const btnEnviarExtrato    = $('btnEnviarExtrato');
const btnFecharExtrato    = $('btnFecharExtrato');
const btnExtratoCompleto  = $('btnExtratoCompleto');

const btnNovoCliente      = $('btnNovoCliente');
const painelFormCliente   = $('painelFormCliente');
const formCliente         = $('formCliente');
const clienteId           = $('clienteId');
const clienteNome         = $('clienteNome');
const clienteLimite       = $('clienteLimite');
const clienteObservacao   = $('clienteObservacao');
const clienteFoto         = $('clienteFoto');
const clienteFotoAtual    = $('clienteFotoAtual');
const btnVerFotoCliente   = $('btnVerFotoCliente');
const removerFotoCliente  = $('removerFotoCliente');
const btnCancelarCliente  = $('btnCancelarCliente');
const tituloFormCliente   = $('tituloFormCliente');
const listaClientes       = $('listaClientes');

const modalHistorico      = $('modalHistorico');
const histFoto            = $('histFoto');
const histFotoPlaceholder = $('histFotoPlaceholder');
const histNome            = $('histNome');
const histClassificacao   = $('histClassificacao');
const histStats           = $('histStats');
const histTbody           = $('histTbody');
const btnFecharHistorico  = $('btnFecharHistorico');

// ─── Estado ───────────────────────────────────────────────────────────────────

let pagamentos       = [];
let clientes         = [];
let modoCadastro     = false;
let _resolveDataPago = null;
let extratoNomePessoa = null;

let filtroClienteDash = '';

let filtroRapido   = null;
let filtroDtInicio = '';
let filtroDtFim    = '';
let filtroVencIni  = '';
let filtroVencFim  = '';

let ordenarPor  = 'data_vencimento';
let ordenarDir  = 'ASC';

let chartMensal, chartStatus, chartClientes;

// ─── Utilitários ──────────────────────────────────────────────────────────────

function token()   { return localStorage.getItem('token'); }
function usuario() {
  try { return JSON.parse(localStorage.getItem('usuario') || 'null'); } catch { return null; }
}
function headers(json = false) {
  const h = { Authorization: `Bearer ${token()}` };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

function moeda(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function dataBR(d) {
  if (!d) return '';
  const [a, m, di] = d.split('-');
  return `${di}/${m}/${a}`;
}
function hojeISO()  { return new Date().toISOString().slice(0, 10); }
function mesAtual() { return new Date().toISOString().slice(0, 7); }

function popularMesResumo() {
  if (mesResumo.options.length) return;
  mesResumo.innerHTML = '<option value="">Todos os meses</option>';
  const d = new Date();
  for (let i = 0; i < 13; i++) {
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = formatarMesLabel(val);
    mesResumo.appendChild(opt);
    d.setMonth(d.getMonth() - 1);
  }
}

function calcularVencimento(d) {
  if (!d) return '';
  const x = new Date(`${d}T00:00:00`);
  x.setMonth(x.getMonth() + 1);
  return x.toISOString().split('T')[0];
}
function toValorNumero(v) {
  return Number(String(v).replace(/\./g, '').replace(',', '.'));
}
function formatarMesLabel(ym) {
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const [ano, mes] = ym.split('-');
  return `${meses[Number(mes) - 1]}/${ano.slice(2)}`;
}

function calcularJurosFrontend(valor, dataPagamento, dataVencimento) {
  const pegou = new Date(`${dataPagamento}T00:00:00`);
  const venc  = new Date(`${dataVencimento}T00:00:00`);
  let meses = (venc.getFullYear() - pegou.getFullYear()) * 12 + (venc.getMonth() - pegou.getMonth());
  if (venc.getDate() > pegou.getDate()) meses++;
  meses = Math.max(1, meses);
  return Number((valor * 0.40 * Math.pow(1.40, meses - 1)).toFixed(2));
}

function atualizarTotalCalculado() {
  const v = toValorNumero(valor.value);
  if (!v || !dataPagamento.value) { totalAReceber.value = ''; return; }
  const venc  = dataVencimento.value || calcularVencimento(dataPagamento.value);
  const juros = calcularJurosFrontend(v, dataPagamento.value, venc);
  totalAReceber.value = String((v + juros).toFixed(2)).replace('.', ',');
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
}

// ─── Nav mobile (seções) ──────────────────────────────────────────────────────

function mostrarSecao(id) {
  if (window.innerWidth >= 860) return;
  document.querySelectorAll('.secao').forEach(s => {
    s.classList.toggle('secao-ativa', s.id === id);
  });
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('ativa', btn.dataset.secao === id);
  });
}

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => mostrarSecao(btn.dataset.secao));
});

window.addEventListener('resize', () => {
  if (window.innerWidth >= 860) {
    document.querySelectorAll('.secao').forEach(s => s.classList.add('secao-ativa'));
  }
});

// ─── Modal de pagamento ───────────────────────────────────────────────────────

function pedirDataPago() {
  return new Promise(resolve => {
    _resolveDataPago = resolve;
    inputDataPago.value = hojeISO();
    modalPagar.classList.remove('hidden');
    inputDataPago.focus();
  });
}

btnConfirmarPago.addEventListener('click', () => {
  if (!inputDataPago.value) return;
  modalPagar.classList.add('hidden');
  if (_resolveDataPago) _resolveDataPago(inputDataPago.value);
});
btnCancelarPago.addEventListener('click', () => {
  modalPagar.classList.add('hidden');
  if (_resolveDataPago) _resolveDataPago(null);
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

function mostrarApp() {
  const u = usuario();
  if (token() && u) {
    authArea.classList.add('hidden');
    appArea.classList.remove('hidden');
    usuarioLogado.textContent = `👋 Olá, ${u.nome || u.email}! · ${u.email}`;
    popularMesResumo();
    carregarTudo();
  } else {
    authArea.classList.remove('hidden');
    appArea.classList.add('hidden');
  }
}

function configurarModoAuth(cadastro) {
  modoCadastro = cadastro;
  grupoNome.style.display = cadastro ? 'block' : 'none';
  btnAuth.textContent = cadastro ? 'Cadastrar' : 'Entrar';
  tabLogin.classList.toggle('ativa', !cadastro);
  tabCadastro.classList.toggle('ativa', cadastro);
}

async function autenticar(e) {
  e.preventDefault();
  mostrarLoading();
  try {
    const endpoint = modoCadastro ? '/auth/cadastrar' : '/auth/login';
    const payload  = modoCadastro
      ? { nome: authNome.value, email: authEmail.value, senha: authSenha.value }
      : { email: authEmail.value, senha: authSenha.value };

    const res  = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) { toast(data.erro || 'Erro ao autenticar'); return; }

    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    formAuth.reset();
    mostrarApp();
  } finally { esconderLoading(); }
}

function sair() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  configurarModoAuth(false);
  mostrarApp();
}

// ─── Resumo financeiro ────────────────────────────────────────────────────────

async function carregarNomes() {
  const res = await fetch(`${API_BASE}/nomes`, { headers: headers() });
  if (!res.ok) return;
  const nomes = await res.json();
  const atual = selectClienteDash.value;
  selectClienteDash.innerHTML = '<option value="">Todos os clientes</option>';
  nomes.forEach(n => {
    const opt = document.createElement('option');
    opt.value = n;
    opt.textContent = n;
    selectClienteDash.appendChild(opt);
  });
  selectClienteDash.value = nomes.includes(atual) ? atual : '';
}

async function carregarResumo() {
  const p = new URLSearchParams();

  // Período: range explícito tem prioridade; sem range usa o seletor de mês do Dashboard
  if (filtroDtInicio || filtroDtFim) {
    if (filtroDtInicio) p.append('dataInicio', filtroDtInicio);
    if (filtroDtFim)    p.append('dataFim',    filtroDtFim);
  } else {
    if (mesResumo.value) p.append('mes', mesResumo.value);
  }

  // Estes filtros se combinam com qualquer período
  if (filtroVencIni)                                        p.append('vencInicio', filtroVencIni);
  if (filtroVencFim)                                        p.append('vencFim',    filtroVencFim);
  const buscaParam = filtroClienteDash || busca.value.trim();
  if (buscaParam)                                            p.append('busca',      buscaParam);
  if (filtroStatus.value && filtroStatus.value !== 'TODOS') p.append('status',     filtroStatus.value);

  const res = await fetch(`${API_BASE}/resumo?${p}`, { headers: headers() });
  if (!res.ok) return;
  const r = await res.json();
  const semJuros = Number(r.total_emprestado || 0);
  const juros    = Number(r.total_juros || 0);
  $('totalEmprestado').textContent = moeda(semJuros);
  $('totalJuros').textContent      = moeda(juros);
  $('totalComJuros').textContent   = moeda(semJuros + juros);
  $('totalRecebido').textContent   = moeda(r.total_recebido);
  $('totalVencido').textContent    = moeda(r.total_vencido);
}

// ─── Gráficos ─────────────────────────────────────────────────────────────────

async function carregarGraficos() {
  if (typeof Chart === 'undefined') return;
  try {
    const res = await fetch(`${API_BASE}/graficos`, { headers: headers() });
    if (!res.ok) return;
    const { mensal, status, clientes } = await res.json();
    renderGraficoMensal(mensal);
    renderGraficoStatus(status);
    renderGraficoClientes(clientes);
  } catch { /* silencioso — charts opcionais */ }
}

function renderGraficoMensal(dados) {
  const ctx = $('graficoMensal').getContext('2d');
  if (chartMensal) chartMensal.destroy();
  chartMensal = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dados.map(d => formatarMesLabel(d.mes)),
      datasets: [
        {
          label: 'Emprestado',
          data: dados.map(d => Number(d.total_emprestado)),
          borderColor: '#1d4ed8',
          backgroundColor: 'rgba(29,78,216,.12)',
          fill: true,
          tension: .4,
          pointRadius: 5,
          pointBackgroundColor: '#1d4ed8'
        },
        {
          label: 'Juros',
          data: dados.map(d => Number(d.total_juros)),
          borderColor: '#b54708',
          backgroundColor: 'rgba(181,71,8,.10)',
          fill: true,
          tension: .4,
          pointRadius: 5,
          pointBackgroundColor: '#b54708'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 12 }, boxWidth: 12 } },
        tooltip: {
          callbacks: {
            label: ctx => ` ${moeda(ctx.raw)}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: v => `R$ ${Number(v).toLocaleString('pt-BR')}` },
          grid: { color: '#f0f0f0' }
        },
        x: { grid: { display: false } }
      }
    }
  });
}

function renderGraficoStatus(dados) {
  const ctx = $('graficoStatus').getContext('2d');
  if (chartStatus) chartStatus.destroy();
  const total = dados.pago + dados.pendente + dados.perto + dados.vencido;
  chartStatus = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Pago', 'Pendente', 'Perto de vencer', 'Vencido'],
      datasets: [{
        data: [dados.pago, dados.pendente, dados.perto, dados.vencido],
        backgroundColor: ['#16a34a', '#94a3b8', '#f59e0b', '#dc2626'],
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 12 }, boxWidth: 12, padding: 10 }
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
              return ` ${ctx.raw} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

function renderGraficoClientes(dados) {
  const ctx  = $('graficoClientes').getContext('2d');
  const wrap = $('graficoClientesWrap');
  const h    = Math.max(180, dados.length * 38);
  wrap.style.height = `${h}px`;
  if (chartClientes) chartClientes.destroy();
  const palette = ['#1e3a8a','#1d4ed8','#2563eb','#3b82f6','#60a5fa','#93c5fd','#0ea5e9','#38bdf8'];
  chartClientes = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dados.map(d => d.nome),
      datasets: [{
        label: 'Total a receber',
        data: dados.map(d => Number(d.total)),
        backgroundColor: dados.map((_, i) => palette[i] || '#1d4ed8'),
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${moeda(ctx.raw)}` } }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { callback: v => `R$ ${Number(v).toLocaleString('pt-BR')}` },
          grid: { color: '#f0f0f0' }
        },
        y: { grid: { display: false } }
      }
    }
  });
}

// ─── Filtros rápidos ──────────────────────────────────────────────────────────

function ativarBtnFiltro(tipo) {
  document.querySelectorAll('.btn-filtro').forEach(b => {
    b.classList.toggle('ativa', b.dataset.filtro === tipo);
  });
}

function setFiltroRapido(tipo) {
  const hoje = hojeISO();
  filtroRapido  = tipo;
  filtroDtInicio = '';
  filtroDtFim    = '';
  filtroVencIni  = '';
  filtroVencFim  = '';
  inputDataInicio.value = '';
  inputDataFim.value    = '';
  filtroStatus.value    = 'TODOS';

  if (tipo === 'hoje') {
    filtroVencIni = hoje;
    filtroVencFim = hoje;
  } else if (tipo === 'semana') {
    const fim = new Date(); fim.setDate(fim.getDate() + 7);
    filtroVencIni = hoje;
    filtroVencFim = fim.toISOString().slice(0, 10);
  } else if (tipo === 'mes') {
    const mes = mesAtual();
    const fim = new Date(`${mes}-01`); fim.setMonth(fim.getMonth() + 1); fim.setDate(fim.getDate() - 1);
    filtroDtInicio = `${mes}-01`;
    filtroDtFim    = fim.toISOString().slice(0, 10);
  } else if (tipo === 'vencidos') {
    filtroStatus.value = 'VENCIDO';
  }

  ativarBtnFiltro(tipo);
  carregarListaEResumo();
}

function limparTodosFiltros() {
  filtroRapido   = null;
  filtroDtInicio = '';
  filtroDtFim    = '';
  filtroVencIni  = '';
  filtroVencFim  = '';
  busca.value           = '';
  filtroStatus.value    = 'TODOS';
  inputDataInicio.value = '';
  inputDataFim.value    = '';
  ativarBtnFiltro(null);
  carregarListaEResumo();
}

document.querySelectorAll('.btn-filtro[data-filtro]').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.classList.contains('ativa')) {
      limparTodosFiltros();
    } else {
      setFiltroRapido(btn.dataset.filtro);
    }
  });
});

btnLimpar.addEventListener('click', limparTodosFiltros);

// ─── Pagamentos ───────────────────────────────────────────────────────────────

function atualizarIconesSort() {
  document.querySelectorAll('th[data-col]').forEach(th => {
    const icon = th.querySelector('.sort-icon');
    if (!icon) return;
    icon.textContent = th.dataset.col === ordenarPor
      ? (ordenarDir === 'ASC' ? ' ↑' : ' ↓')
      : '';
  });
}

async function carregarPagamentos() {
  const p = new URLSearchParams();
  if (busca.value.trim()) p.append('busca', busca.value.trim());
  if (filtroStatus.value && filtroStatus.value !== 'TODOS') p.append('status', filtroStatus.value);
  if (filtroDtInicio) p.append('dataInicio', filtroDtInicio);
  if (filtroDtFim)    p.append('dataFim',    filtroDtFim);
  if (filtroVencIni)  p.append('vencInicio', filtroVencIni);
  if (filtroVencFim)  p.append('vencFim',    filtroVencFim);
  p.append('ordenarPor', ordenarPor);
  p.append('ordenarDir', ordenarDir);

  const res = await fetch(`${API_BASE}/pagamentos?${p}`, { headers: headers() });
  if (res.status === 401) { sair(); return; }
  if (!res.ok) { toast('Erro ao carregar pagamentos'); return; }

  pagamentos = await res.json();
  renderizar();
}

let _loadingCount = 0;
function mostrarLoading() {
  _loadingCount++;
  $('loadingOverlay').classList.remove('hidden');
}
function esconderLoading() {
  _loadingCount = Math.max(0, _loadingCount - 1);
  if (_loadingCount === 0) $('loadingOverlay').classList.add('hidden');
}

async function carregarTudo() {
  mostrarLoading();
  try {
    await Promise.all([carregarResumo(), carregarPagamentos(), carregarGraficos(), carregarNomes(), carregarLucroMes(), carregarClientes()]);
  } finally { esconderLoading(); }
}

async function carregarLucroMes(mes) {
  const banner  = $('bannerLucro');
  const texto   = $('bannerLucroTexto');
  const seletor = $('bannerLucroMes');
  const mesAlvo = mes || seletor.value || mesAtual();
  if (!seletor.value) seletor.value = mesAlvo;
  try {
    const res = await fetch(`${API_BASE}/lucro-mes?mes=${mesAlvo}`, { headers: headers() });
    if (!res.ok) { banner.classList.add('hidden'); return; }
    const r = await res.json();
    const lucro = Number(r.lucro || 0);
    texto.textContent = lucro > 0
      ? `💰 Você lucrou ${moeda(lucro)} em ${formatarMesLabel(r.mes)} (juros recebidos, mesmo de pagamentos já excluídos do sistema)`
      : `📅 Nenhum lucro registrado em ${formatarMesLabel(r.mes)} ainda`;
    banner.classList.toggle('zero', lucro <= 0);
    banner.classList.remove('hidden');
  } catch { banner.classList.add('hidden'); }
}

async function carregarListaEResumo() {
  await Promise.all([carregarResumo(), carregarPagamentos()]);
}

function statusTexto(s) {
  return { PENDENTE: 'PENDENTE', PERTO_DE_VENCER: 'PERTO DE VENCER', VENCE_HOJE: 'VENCE HOJE', VENCIDO: 'VENCIDO', PAGO: 'PAGO' }[s] || s;
}

function renderizar() {
  tbody.innerHTML = '';
  if (!pagamentos.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#667085;padding:32px">Nenhum registro encontrado</td></tr>';
    return;
  }
  pagamentos.forEach(item => {
    const pago       = !!item.data_pago;
    const nomeAttr   = item.nome.replace(/"/g, '&quot;');
    const extratoBtn = `<button class="btn secundario" type="button" title="Extrato desta pessoa" data-nome="${nomeAttr}" onclick="window.abrirExtratoPessoa(this.dataset.nome)">📄</button>`;
    const comprovanteBtn = item.tem_comprovante
      ? `<button class="btn secundario" type="button" title="Ver comprovante" onclick="window.abrirComprovante(${item.id})">📎</button>`
      : '';
    const botoes = pago
      ? `<span class="texto-suave">Pago</span>
         ${comprovanteBtn}
         ${extratoBtn}
         <button class="btn perigo" type="button" title="Arquivar" onclick="arquivarPagamento(${item.id})">🗑️</button>`
      : `<button class="btn secundario" type="button" onclick="editarPagamento(${item.id})">Editar</button>
         <button class="btn principal"  type="button" onclick="marcarComoPago(${item.id})">Marcar pago</button>
         ${comprovanteBtn}
         ${extratoBtn}
         <button class="btn perigo"     type="button" title="Arquivar" onclick="arquivarPagamento(${item.id})">🗑️</button>`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="Pagamentos">
        <button class="nome-clicavel" type="button" title="Ver histórico deste cliente" data-nome="${nomeAttr}" onclick="window.verHistoricoPorNome(this.dataset.nome)">${item.nome}</button>
        ${item.observacao ? `<br><small style="color:#667085">${item.observacao}</small>` : ''}
      </td>
      <td data-label="Data que pegou">${dataBR(item.data_pagamento)}</td>
      <td data-label="Data que vai pagar">${dataBR(item.data_vencimento)}</td>
      <td data-label="Valor">${moeda(item.valor)}</td>
      <td data-label="Juros">${moeda(item.juros)}</td>
      <td data-label="Total a receber"><strong>${moeda(item.valor_total)}</strong></td>
      <td data-label="Status">
        <span class="status ${item.status_pagamento}">${statusTexto(item.status_pagamento)}</span>
        ${Number(item.dias_atraso) > 0 ? `<br><small style="color:#dc2626;font-size:12px">${item.dias_atraso} dia(s) em atraso</small>` : ''}
      </td>
      <td data-label="Pago em">${item.data_pago ? dataBR(item.data_pago) : '-'}</td>
      <td data-label="Ações" style="white-space:nowrap;display:flex;gap:6px;flex-wrap:wrap">${botoes}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

async function salvar(e) {
  e.preventDefault();
  const id = pagamentoId.value;
  const fd = new FormData();
  fd.append('nome',           nome.value);
  fd.append('dataPagamento',  dataPagamento.value);
  fd.append('dataVencimento', dataVencimento.value);
  fd.append('valor',          toValorNumero(valor.value));
  fd.append('observacao',     observacao.value);
  if (totalAReceber.value.trim()) {
    fd.append('totalAReceber', toValorNumero(totalAReceber.value));
  }
  if (comprovanteInput.files[0]) fd.append('comprovante', comprovanteInput.files[0]);
  if (removerComprovante.checked) fd.append('removerComprovante', '1');

  const res  = await fetch(id ? `${API_BASE}/pagamentos/${id}` : `${API_BASE}/pagamentos`, {
    method: id ? 'PUT' : 'POST', headers: headers(), body: fd
  });
  const data = await res.json();
  if (!res.ok) { toast(data.erro || 'Erro ao salvar'); return; }
  limparForm();
  await carregarTudo();
  toast(data.mensagem || 'Salvo com sucesso');
  mostrarSecao('secLista');
}

window.abrirComprovante = async function (id) {
  const res = await fetch(`${API_BASE}/pagamentos/${id}/comprovante`, { headers: headers() });
  if (!res.ok) { toast('Erro ao abrir comprovante'); return; }
  const blob = await res.blob();
  window.open(URL.createObjectURL(blob), '_blank');
};

window.editarPagamento = function (id) {
  const item = pagamentos.find(p => Number(p.id) === Number(id));
  if (!item) { toast('Registro não encontrado'); return; }
  pagamentoId.value    = item.id;
  nome.value           = item.nome;
  dataPagamento.value  = item.data_pagamento;
  dataVencimento.value = item.data_vencimento || calcularVencimento(item.data_pagamento);
  valor.value          = String(Number(item.valor).toFixed(2)).replace('.', ',');
  observacao.value     = item.observacao || '';
  totalAReceber.value  = String(Number(item.valor_total).toFixed(2)).replace('.', ',');
  comprovanteInput.value    = '';
  removerComprovante.checked = false;
  comprovanteAtual.classList.toggle('hidden', !item.tem_comprovante);
  tituloForm.textContent = '✏️ Editar pagamento';
  mostrarSecao('secNovo');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.marcarComoPago = async function (id) {
  const dataPago = await pedirDataPago();
  if (!dataPago) return;
  const res  = await fetch(`${API_BASE}/pagamentos/${id}/pagar`, {
    method: 'PATCH', headers: headers(true), body: JSON.stringify({ dataPago })
  });
  const data = await res.json();
  if (!res.ok) { toast(data.erro || 'Erro ao marcar como pago'); return; }
  await carregarTudo();
  toast(data.mensagem || 'Marcado como pago');
};

window.arquivarPagamento = async function (id) {
  if (!confirm('Arquivar este registro? Ele ficará salvo no histórico do banco.')) return;
  const res  = await fetch(`${API_BASE}/pagamentos/${id}`, { method: 'DELETE', headers: headers() });
  const data = await res.json();
  if (!res.ok) { toast(data.erro || 'Erro ao arquivar'); return; }
  await carregarTudo();
  toast(data.mensagem || 'Arquivado');
};

function limparForm() {
  form.reset();
  pagamentoId.value      = '';
  dataVencimento.value   = '';
  totalAReceber.value    = '';
  removerComprovante.checked = false;
  comprovanteAtual.classList.add('hidden');
  tituloForm.textContent = '💰 Novo pagamento';
}

// ─── Clientes ─────────────────────────────────────────────────────────────────

const CLASSIFICACAO_LABEL = {
  BOM_PAGADOR:   '🟢 Bom pagador',
  REGULAR:       '🟡 Pagador regular',
  MAU_PAGADOR:   '🔴 Mau pagador',
  INADIMPLENTE:  '🔴 Inadimplente',
  SEM_HISTORICO: '⚪ Sem histórico'
};

async function carregarClientes() {
  const res = await fetch(`${API_BASE}/clientes`, { headers: headers() });
  if (!res.ok) return;
  clientes = await res.json();
  renderizarClientes();
}

function renderizarClientes() {
  listaClientes.innerHTML = '';
  if (!clientes.length) {
    listaClientes.innerHTML = '<p style="text-align:center;color:#667085;padding:24px;grid-column:1/-1">Nenhum cliente cadastrado ainda</p>';
    return;
  }
  clientes.forEach(c => {
    const foto = c.tem_foto
      ? `<img class="cliente-foto" src="${API_BASE}/clientes/${c.id}/foto" alt="${c.nome}" />`
      : `<div class="cliente-foto-placeholder">👤</div>`;
    const limiteExcedido = c.limite_credito != null && Number(c.total_em_aberto) > c.limite_credito;
    const card = document.createElement('div');
    card.className = 'cliente-card';
    card.innerHTML = `
      <div class="cliente-card-topo">
        ${foto}
        <div>
          <span class="cliente-card-nome">${c.nome}</span>
          <span class="badge-classificacao ${c.classificacao}">${CLASSIFICACAO_LABEL[c.classificacao] || c.classificacao}</span>
        </div>
      </div>
      <div class="cliente-card-stats">
        <div><span>Limite</span><strong>${c.limite_credito != null ? moeda(c.limite_credito) : '—'}</strong></div>
        <div><span>Em aberto</span><strong>${moeda(c.total_em_aberto)}</strong></div>
        <div><span>Empréstimos</span><strong>${c.total_emprestimos}</strong></div>
      </div>
      ${limiteExcedido ? '<div class="cliente-card-alerta">⚠️ Limite de crédito excedido</div>' : ''}
      <div class="cliente-card-acoes">
        <button class="btn secundario" type="button" onclick="window.verHistoricoCliente(${c.id})">📜 Histórico</button>
        <button class="btn secundario" type="button" onclick="window.editarCliente(${c.id})">✏️</button>
        <button class="btn perigo" type="button" onclick="window.removerCliente(${c.id})">🗑️</button>
      </div>
    `;
    listaClientes.appendChild(card);
  });
}

function limparFormCliente() {
  formCliente.reset();
  clienteId.value = '';
  removerFotoCliente.checked = false;
  clienteFotoAtual.classList.add('hidden');
  tituloFormCliente.textContent = '👤 Novo cliente';
}

btnNovoCliente.addEventListener('click', () => {
  limparFormCliente();
  painelFormCliente.classList.remove('hidden');
  painelFormCliente.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

btnCancelarCliente.addEventListener('click', () => {
  limparFormCliente();
  painelFormCliente.classList.add('hidden');
});

formCliente.addEventListener('submit', async e => {
  e.preventDefault();
  const id = clienteId.value;
  const fd = new FormData();
  fd.append('nome', clienteNome.value);
  if (clienteLimite.value.trim()) fd.append('limiteCredito', toValorNumero(clienteLimite.value));
  fd.append('observacao', clienteObservacao.value);
  if (clienteFoto.files[0]) fd.append('foto', clienteFoto.files[0]);
  if (removerFotoCliente.checked) fd.append('removerFoto', '1');

  const res  = await fetch(id ? `${API_BASE}/clientes/${id}` : `${API_BASE}/clientes`, {
    method: id ? 'PUT' : 'POST', headers: headers(), body: fd
  });
  const data = await res.json();
  if (!res.ok) { toast(data.erro || 'Erro ao salvar cliente'); return; }
  limparFormCliente();
  painelFormCliente.classList.add('hidden');
  await carregarClientes();
  toast(data.mensagem || 'Cliente salvo com sucesso');
});

window.editarCliente = function (id) {
  const c = clientes.find(x => Number(x.id) === Number(id));
  if (!c) { toast('Cliente não encontrado'); return; }
  clienteId.value         = c.id;
  clienteNome.value       = c.nome;
  clienteLimite.value     = c.limite_credito != null ? String(Number(c.limite_credito).toFixed(2)).replace('.', ',') : '';
  clienteObservacao.value = c.observacao || '';
  clienteFoto.value       = '';
  removerFotoCliente.checked = false;
  clienteFotoAtual.classList.toggle('hidden', !c.tem_foto);
  tituloFormCliente.textContent = '✏️ Editar cliente';
  painelFormCliente.classList.remove('hidden');
  painelFormCliente.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.removerCliente = async function (id) {
  if (!confirm('Remover este cliente cadastrado? O histórico de empréstimos dele continua salvo.')) return;
  const res  = await fetch(`${API_BASE}/clientes/${id}`, { method: 'DELETE', headers: headers() });
  const data = await res.json();
  if (!res.ok) { toast(data.erro || 'Erro ao remover cliente'); return; }
  await carregarClientes();
  toast(data.mensagem || 'Cliente removido');
};

btnVerFotoCliente.addEventListener('click', async () => {
  if (!clienteId.value) return;
  const res = await fetch(`${API_BASE}/clientes/${clienteId.value}/foto`, { headers: headers() });
  if (!res.ok) { toast('Erro ao abrir foto'); return; }
  const blob = await res.blob();
  window.open(URL.createObjectURL(blob), '_blank');
});

window.verHistoricoCliente = async function (id) {
  const res = await fetch(`${API_BASE}/clientes/${id}/historico`, { headers: headers() });
  if (!res.ok) { toast('Erro ao buscar histórico'); return; }
  const { cliente, stats, historico } = await res.json();
  abrirModalHistorico(cliente, stats, historico);
};

window.verHistoricoPorNome = function (nomePessoa) {
  const c = clientes.find(x => x.nome === nomePessoa);
  if (c) { window.verHistoricoCliente(c.id); return; }
  busca.value = nomePessoa;
  carregarPagamentos();
  toast('Cliente ainda não cadastrado — filtrando a lista por esse nome. Cadastre-o na aba Clientes para ver o histórico completo.');
};

function abrirModalHistorico(cliente, stats, historico) {
  histNome.textContent = cliente.nome;
  histClassificacao.textContent = CLASSIFICACAO_LABEL[stats.classificacao] || stats.classificacao;
  histClassificacao.className   = `badge-classificacao ${stats.classificacao}`;

  if (cliente.tem_foto) {
    histFoto.src = `${API_BASE}/clientes/${cliente.id}/foto`;
    histFoto.classList.remove('hidden');
    histFotoPlaceholder.classList.add('hidden');
  } else {
    histFoto.classList.add('hidden');
    histFotoPlaceholder.classList.remove('hidden');
  }

  const limiteExcedido = cliente.limite_credito != null && Number(stats.total_em_aberto) > cliente.limite_credito;
  histStats.innerHTML = `
    <div class="stat-mini"><span>Limite</span><strong>${cliente.limite_credito != null ? moeda(cliente.limite_credito) : '—'}</strong></div>
    <div class="stat-mini ${limiteExcedido ? 'alerta' : ''}"><span>Em aberto</span><strong>${moeda(stats.total_em_aberto)}</strong></div>
    <div class="stat-mini"><span>Total pago</span><strong>${moeda(stats.total_pago)}</strong></div>
    <div class="stat-mini"><span>Já pegou</span><strong>${moeda(stats.total_emprestado)}</strong></div>
    <div class="stat-mini"><span>Pontual</span><strong>${stats.pagos_no_prazo}</strong></div>
    <div class="stat-mini ${stats.pagos_com_atraso > 0 ? 'alerta' : ''}"><span>Com atraso</span><strong>${stats.pagos_com_atraso}</strong></div>
  `;

  histTbody.innerHTML = '';
  if (!historico.length) {
    histTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#667085;padding:20px">Nenhum empréstimo registrado</td></tr>';
  } else {
    historico.forEach(h => {
      const tr = document.createElement('tr');
      if (h.arquivado) tr.classList.add('arquivado');
      tr.innerHTML = `
        <td>${dataBR(h.data_pagamento)}</td>
        <td>${dataBR(h.data_vencimento)}</td>
        <td>${moeda(h.valor)}</td>
        <td>${moeda(h.juros)}</td>
        <td><strong>${moeda(h.valor_total)}</strong></td>
        <td><span class="status ${h.status_pagamento === 'ARQUIVADO' ? 'PAGO' : h.status_pagamento}">${h.arquivado ? 'Arquivado' : statusTexto(h.status_pagamento)}</span></td>
        <td>${h.data_pago ? dataBR(h.data_pago) : '-'}</td>
      `;
      histTbody.appendChild(tr);
    });
  }

  modalHistorico.classList.remove('hidden');
}

btnFecharHistorico.addEventListener('click', () => modalHistorico.classList.add('hidden'));

// ─── Event listeners ──────────────────────────────────────────────────────────

dataPagamento.addEventListener('change', () => {
  dataVencimento.value = calcularVencimento(dataPagamento.value);
  atualizarTotalCalculado();
});

valor.addEventListener('input', atualizarTotalCalculado);
dataVencimento.addEventListener('change', atualizarTotalCalculado);

form.addEventListener('submit', salvar);
btnCancelar.addEventListener('click', limparForm);
btnVerComprovante.addEventListener('click', () => {
  if (pagamentoId.value) window.abrirComprovante(pagamentoId.value);
});
btnAtualizar.addEventListener('click', carregarTudo);
mesResumo.addEventListener('change', () => { carregarResumo(); carregarGraficos(); });
$('bannerLucroMes').addEventListener('change', e => carregarLucroMes(e.target.value));
selectClienteDash.addEventListener('change', () => {
  filtroClienteDash = selectClienteDash.value;
  carregarResumo();
});

busca.addEventListener('input', () => {
  filtroRapido = null; ativarBtnFiltro(null);
  carregarListaEResumo();
});
filtroStatus.addEventListener('change', () => {
  filtroRapido  = null; ativarBtnFiltro(null);
  filtroVencIni = ''; filtroVencFim = '';
  filtroDtInicio = ''; filtroDtFim   = '';
  carregarListaEResumo();
});
inputDataInicio.addEventListener('change', () => {
  filtroRapido  = null; ativarBtnFiltro(null);
  filtroDtInicio = inputDataInicio.value;
  carregarListaEResumo();
});
inputDataFim.addEventListener('change', () => {
  filtroRapido = null; ativarBtnFiltro(null);
  filtroDtFim  = inputDataFim.value;
  carregarListaEResumo();
});

document.querySelectorAll('th[data-col]').forEach(th => {
  th.style.cursor = 'pointer';
  th.addEventListener('click', () => {
    const col = th.dataset.col;
    if (ordenarPor === col) {
      ordenarDir = ordenarDir === 'ASC' ? 'DESC' : 'ASC';
    } else {
      ordenarPor = col;
      ordenarDir = 'ASC';
    }
    atualizarIconesSort();
    carregarPagamentos();
  });
});

atualizarIconesSort();

tabLogin.addEventListener('click',    () => configurarModoAuth(false));
tabCadastro.addEventListener('click', () => configurarModoAuth(true));
formAuth.addEventListener('submit', autenticar);
btnSair.addEventListener('click', sair);

// ─── Extrato PDF ──────────────────────────────────────────────────────────────

function abrirModalExtrato(nomePessoa = null) {
  extratoNomePessoa = nomePessoa;
  extratoDtInicio.value     = '';
  extratoDtFim.value        = '';
  extratoFiltroStatus.value = '';
  extratoBusca.value        = '';
  extratoEmailInput.value   = '';
  extratoLoading.classList.add('hidden');
  btnBaixarExtrato.disabled = false;
  btnEnviarExtrato.disabled = false;

  if (nomePessoa) {
    extratoTituloEl.textContent    = `Extrato — ${nomePessoa}`;
    extratoSubtituloEl.textContent = 'PDF com todos os pagamentos desta pessoa';
    grupoExtratoBusca.style.display = 'none';
  } else {
    extratoTituloEl.textContent    = 'Extrato Completo';
    extratoSubtituloEl.textContent = 'PDF com todos os pagamentos (aplique filtros abaixo se desejar)';
    grupoExtratoBusca.style.display = '';
  }
  modalExtrato.classList.remove('hidden');
}

window.abrirExtratoPessoa = nome => abrirModalExtrato(nome);

function construirParamsExtrato() {
  const p = new URLSearchParams();
  if (extratoDtInicio.value)      p.append('dataInicio', extratoDtInicio.value);
  if (extratoDtFim.value)         p.append('dataFim',    extratoDtFim.value);
  if (extratoFiltroStatus.value)  p.append('status',     extratoFiltroStatus.value);
  if (!extratoNomePessoa && extratoBusca.value.trim())
    p.append('busca', extratoBusca.value.trim());
  return p;
}

function extratoSetLoading(on) {
  extratoLoading.classList.toggle('hidden', !on);
  btnBaixarExtrato.disabled = on;
  btnEnviarExtrato.disabled = on;
}

async function baixarExtrato() {
  extratoSetLoading(true);
  try {
    const params = construirParamsExtrato();
    const url = extratoNomePessoa
      ? `${API_BASE}/extratos/pessoa/${encodeURIComponent(extratoNomePessoa)}/pdf?${params}`
      : `${API_BASE}/extratos/completo/pdf?${params}`;

    const res = await fetch(url, { headers: headers() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ erro: 'Erro ao gerar PDF' }));
      toast(err.erro || 'Erro ao gerar PDF'); return;
    }
    const blob   = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href     = objUrl;
    a.download = extratoNomePessoa
      ? `extrato-${extratoNomePessoa.toLowerCase().replace(/\s+/g, '-')}.pdf`
      : 'extrato-completo.pdf';
    a.click();
    setTimeout(() => URL.revokeObjectURL(objUrl), 5000);
    toast('PDF gerado com sucesso!');
  } catch { toast('Erro ao gerar PDF'); }
  finally  { extratoSetLoading(false); }
}

async function enviarExtratoEmail() {
  const emailDestino = extratoEmailInput.value.trim();
  if (!emailDestino) { toast('Informe o e-mail de destino'); extratoEmailInput.focus(); return; }

  extratoSetLoading(true);
  try {
    const params = construirParamsExtrato();
    const url = extratoNomePessoa
      ? `${API_BASE}/extratos/pessoa/${encodeURIComponent(extratoNomePessoa)}/email`
      : `${API_BASE}/extratos/completo/email`;

    const body = { emailDestino };
    if (extratoDtInicio.value)     body.dataInicio = extratoDtInicio.value;
    if (extratoDtFim.value)        body.dataFim    = extratoDtFim.value;
    if (extratoFiltroStatus.value) body.status     = extratoFiltroStatus.value;
    if (!extratoNomePessoa && extratoBusca.value.trim()) body.busca = extratoBusca.value.trim();

    const res  = await fetch(url, { method: 'POST', headers: headers(true), body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) { toast(data.erro || 'Erro ao enviar e-mail'); return; }
    toast('E-mail enviado com sucesso!');
    modalExtrato.classList.add('hidden');
  } catch { toast('Erro ao enviar e-mail'); }
  finally  { extratoSetLoading(false); }
}

if (btnBaixarExtrato)   btnBaixarExtrato.addEventListener('click', baixarExtrato);
if (btnEnviarExtrato)   btnEnviarExtrato.addEventListener('click', enviarExtratoEmail);
if (btnFecharExtrato)   btnFecharExtrato.addEventListener('click', () => modalExtrato.classList.add('hidden'));
if (btnExtratoCompleto) btnExtratoCompleto.addEventListener('click', () => abrirModalExtrato(null));

// ─── PWA: Service Worker ───────────────────────────────────────────────────────

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// ─── Init ─────────────────────────────────────────────────────────────────────

configurarModoAuth(false);
mostrarApp();
