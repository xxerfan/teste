/**
 * ============================================================
 * Xerfan Tech Lab — main.js v11.0
 * Módulos: Componentes · Header · Contadores · TypeWriter
 *          ScrollReveal · ScrollProgress · Chatbot XTL
 * ============================================================
 */

'use strict';

/* ============================================================
   1. CARREGAMENTO DE COMPONENTES HTML
   ============================================================ */
function loadComponent(elementId, componentPath) {
    const element = document.getElementById(elementId);
    if (!element) return Promise.resolve();

    return fetch(componentPath)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.text();
        })
        .then(html => {
            element.innerHTML = html;
            if (elementId === 'header') {
                _initHeader();
                _initAdminToggles();
                if (!window.location.pathname.includes('/admin')) {
                    new XerfanChatBot();
                }
            }
        })
        .catch(err => console.warn(`[XTL] Componente não carregado: ${componentPath}`, err));
}

/* ============================================================
   2. LÓGICA DO HEADER
   ============================================================ */
function _initHeader() {
    const header    = document.getElementById('main-header');
    const navWrap   = document.getElementById('nav-wrapper');
    const backTop   = document.getElementById('back-to-top');
    const mobileBtn = document.getElementById('mobile-menu-button');
    const mobileMenu= document.getElementById('mobile-menu');
    const menuIcon  = document.getElementById('menu-icon');
    const progress  = document.getElementById('scroll-progress');

    // Scroll único — scroll progress + header scrolled + back-to-top
    const onScroll = () => {
        const y = window.scrollY;
        const maxY = document.documentElement.scrollHeight - window.innerHeight;

        if (progress && maxY > 0) {
            progress.style.width = `${(y / maxY) * 100}%`;
        }

        if (y > 60) {
            header?.classList.add('scrolled');
            navWrap?.classList.add('py-0', 'shadow-md');
        } else {
            header?.classList.remove('scrolled');
            navWrap?.classList.remove('py-0', 'shadow-md');
        }

        if (backTop) {
            const show = y > 400;
            backTop.classList.toggle('opacity-0',   !show);
            backTop.classList.toggle('invisible',   !show);
            backTop.classList.toggle('opacity-100',  show);
            backTop.classList.toggle('visible',      show);
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // executa imediatamente ao carregar

    backTop?.addEventListener('click', e => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Toggle menu mobile
    let menuOpen = false;
    mobileBtn?.addEventListener('click', () => {
        menuOpen = !menuOpen;
        mobileMenu?.classList.toggle('hidden', !menuOpen);
        if (menuIcon) {
            menuIcon.className = menuOpen
                ? 'fas fa-times text-base text-orange-500'
                : 'fas fa-bars text-base';
        }
    });

    // Fechar menu ao clicar em link mobile
    mobileMenu?.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menuOpen = false;
            mobileMenu.classList.add('hidden');
            if (menuIcon) menuIcon.className = 'fas fa-bars text-base';
        });
    });

    // Marcar link ativo
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-item-pro[data-page], .mobile-nav-item[data-page]').forEach(link => {
        if (link.dataset.page === currentPage) link.classList.add('active');
    });
}

/* ============================================================
   3. TOGGLES DE PÁGINAS (Firebase — Admin)
   ============================================================ */
async function _initAdminToggles() {
    try {
        const { app }         = await import('./js/firebase-config.js');
        const { getFirestore, doc, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js');
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js');
        const dbToggle = getFirestore(initializeApp(app.options, 'XerfanToggleApp_v2'));

        onSnapshot(doc(dbToggle, 'settings', 'paginas'), snap => {
            if (!snap.exists()) return;
            const s = snap.data();
            ['produtos', 'servicos', 'portfolio', 'blog'].forEach(mod => {
                const ativo = s[`${mod}_active`] ?? true;
                document.querySelectorAll(`.nav-link-${mod}`).forEach(el => el.style.display = ativo ? '' : 'none');
                const sec = document.getElementById(`secao-${mod}`);
                if (sec) sec.style.display = ativo ? '' : 'none';
            });
        });
    } catch (e) {
        console.warn('[XTL] Toggles de admin indisponíveis.', e.message);
    }
}

/* ============================================================
   4. CONTADORES ANIMADOS
   ============================================================ */
function initCounters() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(({ isIntersecting, target }) => {
            if (!isIntersecting) return;
            const end    = parseInt(target.dataset.counter, 10);
            const suffix = target.dataset.suffix || '';
            const dur    = 2000;
            let startTs  = null;

            const ease = t => 1 - Math.pow(1 - t, 3); // cubic ease-out

            const step = ts => {
                if (!startTs) startTs = ts;
                const prog = Math.min((ts - startTs) / dur, 1);
                target.textContent = Math.floor(ease(prog) * end) + suffix;
                if (prog < 1) requestAnimationFrame(step);
                else target.textContent = end + suffix;
            };

            requestAnimationFrame(step);
            observer.unobserve(target);
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('[data-counter]').forEach(el => observer.observe(el));
}

/* ============================================================
   5. TYPEWRITER
   ============================================================ */
class TypeWriter {
    constructor(el, texts, { speed = 45, deleteSpeed = 28, pauseMs = 2500 } = {}) {
        this.el          = el;
        this.texts       = texts;
        this.speed       = speed;
        this.deleteSpeed = deleteSpeed;
        this.pauseMs     = pauseMs;
        this.index       = 0;
        this.char        = 0;
        this.mode        = 'write';
        this._tick();
    }

    _tick() {
        const txt = this.texts[this.index];

        if (this.mode === 'write') {
            this.el.textContent = txt.slice(0, ++this.char);
            if (this.char === txt.length) {
                this.mode = 'pause';
                setTimeout(() => { this.mode = 'erase'; this._tick(); }, this.pauseMs);
            } else {
                setTimeout(() => this._tick(), this.speed + Math.random() * 20);
            }

        } else if (this.mode === 'erase') {
            this.el.textContent = txt.slice(0, --this.char);
            if (this.char === 0) {
                this.mode  = 'write';
                this.index = (this.index + 1) % this.texts.length;
                setTimeout(() => this._tick(), 400);
            } else {
                setTimeout(() => this._tick(), this.deleteSpeed);
            }
        }
    }
}

function initHeroTypewriter() {
    const el = document.getElementById('hero-texto-animado');
    if (el) {
        new TypeWriter(el, [
            'Transforme seu negócio com tecnologia',
            'Automação inteligente para sua casa',
            'Desenvolvimento Web Profissional',
            'Infraestrutura de TI sob medida'
        ]);
    }
}

/* ============================================================
   6. SCROLL REVEAL (IntersectionObserver)
   ============================================================ */
function initScrollReveal() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(({ isIntersecting, target }) => {
            if (isIntersecting) {
                target.classList.add('revealed');
                observer.unobserve(target);
            }
        });
    }, { threshold: 0.08 });

    document.querySelectorAll('[data-reveal], .stagger-children').forEach(el => observer.observe(el));
}

/* ============================================================
   7. CHATBOT XTL
   ============================================================ */
class XerfanChatBot {
    constructor() {
        this.isOpen = false;
        this.step   = 0;
        this.lead   = { question: '', name: '', location: '' };

        // Garante apenas uma instância
        document.getElementById('xtl-bot-root')?.remove();
        this._render();
        this._bindEvents();
        this._botSay('Olá! 👋 Em que posso ajudar você hoje?');
    }

    /* — Render — */
    _render() {
        const root = document.createElement('div');
        root.id = 'xtl-bot-root';
        root.innerHTML = `
        <style>
            #xtl-win{transform-origin:bottom right;transition:all .3s cubic-bezier(.4,0,.2,1)}
            .xb-user{background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;margin-left:auto;border-radius:1rem 1rem 0 1rem;padding:.6rem 1rem;max-width:85%;font-size:.85rem;margin-bottom:8px;word-break:break-word}
            .xb-bot{background:#1f2937;color:#e5e7eb;margin-right:auto;border-radius:1rem 1rem 1rem 0;padding:.6rem 1rem;max-width:85%;border:1px solid #374151;font-size:.85rem;margin-bottom:8px;word-break:break-word}
        </style>
        <div id="xtl-win" class="fixed bottom-[90px] right-6 bg-gray-900 border border-gray-700/80 rounded-2xl shadow-2xl w-[320px] sm:w-[350px] overflow-hidden scale-0 opacity-0 pointer-events-none flex flex-col z-[2000]">
            <!-- Header -->
            <div class="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center justify-between gap-3 flex-shrink-0">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 bg-gray-950 rounded-full p-1 border border-gray-700 flex-shrink-0">
                        <img src="img/logo.png" class="w-full h-full object-contain" alt="XTL" onerror="this.parentElement.innerHTML='<span class=&quot;text-orange-500 font-black text-xs&quot;>XTL</span>'">
                    </div>
                    <div>
                        <h4 class="text-white font-bold text-sm leading-none">Suporte XTL</h4>
                        <p class="text-green-400 text-[10px] mt-0.5 flex items-center gap-1"><span class="w-1.5 h-1.5 bg-green-400 rounded-full inline-block"></span> Online agora</p>
                    </div>
                </div>
                <button id="xb-close" class="text-gray-400 hover:text-white hover:bg-gray-700 w-7 h-7 rounded-lg flex items-center justify-center transition-all" aria-label="Fechar chat">
                    <i class="fas fa-times text-sm"></i>
                </button>
            </div>
            <!-- Mensagens -->
            <div id="xb-body" class="p-4 bg-[#0b101a] h-[280px] overflow-y-auto flex flex-col" role="log" aria-live="polite"></div>
            <!-- Botão de transferência -->
            <div id="xb-transfer" class="hidden px-3 pb-3 bg-[#0b101a]">
                <button id="xb-wpp" class="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg">
                    <i class="fab fa-whatsapp text-base"></i> Falar com Técnico no WhatsApp
                </button>
            </div>
            <!-- Input -->
            <div class="px-3 pb-3 pt-2 bg-gray-900 border-t border-gray-800 flex gap-2 flex-shrink-0">
                <input type="text" id="xb-input" placeholder="Digite sua mensagem..." autocomplete="off"
                    class="flex-1 bg-gray-800 text-white text-sm border border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:border-orange-500 transition-colors placeholder-gray-500"
                    aria-label="Mensagem para o chat">
                <button id="xb-send" class="w-10 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex items-center justify-center transition-all flex-shrink-0" aria-label="Enviar">
                    <i class="fas fa-paper-plane text-xs"></i>
                </button>
            </div>
        </div>`;
        document.body.appendChild(root);
    }

    /* — Eventos — */
    _bindEvents() {
        document.getElementById('xtl-chat-trigger')?.addEventListener('click', () => this._toggle());
        document.getElementById('xb-close').addEventListener('click', () => this._close());
        document.getElementById('xb-send').addEventListener('click',  () => this._handleInput());
        document.getElementById('xb-input').addEventListener('keypress', e => { if (e.key === 'Enter') this._handleInput(); });
        document.getElementById('xb-wpp').addEventListener('click', () => this._sendToWhatsApp());
    }

    _toggle() { this.isOpen ? this._close() : this._open(); }

    _open() {
        const win = document.getElementById('xtl-win');
        win.classList.replace('scale-0', 'scale-100');
        win.classList.replace('opacity-0', 'opacity-100');
        win.classList.remove('pointer-events-none');
        document.getElementById('xtl-bot-icon').className = 'fas fa-times text-xl';
        document.getElementById('xtl-bot-tooltip')?.style && (document.getElementById('xtl-bot-tooltip').style.display = 'none');
        this.isOpen = true;
        setTimeout(() => document.getElementById('xb-input').focus(), 150);
    }

    _close() {
        const win = document.getElementById('xtl-win');
        win.classList.replace('scale-100', 'scale-0');
        win.classList.replace('opacity-100', 'opacity-0');
        win.classList.add('pointer-events-none');
        document.getElementById('xtl-bot-icon').className = 'fab fa-whatsapp';
        const tip = document.getElementById('xtl-bot-tooltip');
        if (tip) tip.style.display = '';
        this.isOpen = false;
    }

    _appendUser(text) {
        const body = document.getElementById('xb-body');
        const div = document.createElement('div');
        div.className = 'xb-user';
        div.textContent = text;
        body.appendChild(div);
        body.scrollTop = body.scrollHeight;
    }

    _botSay(text, delay = 700) {
        const body = document.getElementById('xb-body');
        // Indicador de digitação
        const typing = document.createElement('div');
        typing.className = 'xb-bot typing-indicator';
        typing.innerHTML = '<span></span><span></span><span></span>';
        body.appendChild(typing);
        body.scrollTop = body.scrollHeight;

        setTimeout(() => {
            typing.remove();
            const div = document.createElement('div');
            div.className = 'xb-bot';
            div.innerHTML = text;
            body.appendChild(div);
            body.scrollTop = body.scrollHeight;
        }, delay);
    }

    _handleInput() {
        const input = document.getElementById('xb-input');
        const msg   = input.value.trim();
        if (!msg) return;

        this._appendUser(msg);
        input.value = '';

        switch (this.step) {
            case 0:
                this.lead.question = msg;
                this._botSay('Entendido! Para te ajudar melhor, qual é o seu nome?');
                this.step = 1;
                break;
            case 1:
                this.lead.name = msg;
                this._botSay(`Prazer, <strong>${msg}</strong>! Em qual bairro ou cidade você está?`);
                this.step = 2;
                break;
            case 2:
                this.lead.location = msg;
                this._botSay('Tudo certo! Agora clique no botão abaixo para falar diretamente com o técnico. 👇');
                this.step = 3;
                document.getElementById('xb-transfer').classList.remove('hidden');
                break;
            default:
                this._botSay('Clique no botão acima para falar com o técnico pelo WhatsApp! 😊');
        }
    }

    _sendToWhatsApp() {
        const text = encodeURIComponent(
            `*Xerfan Tech Lab — Site*\n` +
            `👤 *Nome:* ${this.lead.name}\n` +
            `📍 *Local:* ${this.lead.location}\n` +
            `📝 *Dúvida:* ${this.lead.question}`
        );
        window.open(`https://wa.me/5521984197719?text=${text}`, '_blank');
        this._close();
    }
}

/* ============================================================
   8. BOOT — DOMContentLoaded
   Nota: loadComponent é chamado por cada página individualmente.
   O boot apenas inicializa funções utilitárias globais.
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    initCounters();
    initHeroTypewriter();
    initScrollReveal();
});
