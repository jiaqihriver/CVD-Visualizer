/**
 * UIController.ts — component tree, inspector, HUD, help overlay and all
 * DOM-side interactions. The UI never mutates 3D state directly: it calls
 * the AppActions interface implemented by main.ts.
 */

import { CATEGORIES, CATEGORY_MAP, PARTS, PARTS_BY_ID, type CategoryId } from '../data/cvdParts';
import type { PartRegistry } from '../interaction/PartRegistry';
import type { ExplodeController } from '../interaction/ExplodeController';

export interface AppActions {
  selectPart(id: string | null, scroll?: boolean): void;
  toggleExplode(id: string): void;
  setExploded(id: string, exploded: boolean): void;
  focusPart(id: string): void;
  toggleVisibility(id: string): void;
  explodeAll(): void;
  assembleAll(): void;
  toggleCategory(category: CategoryId): void;
  setView(view: string): void;
  toggleFlow(): boolean;
  toggleHeat(): boolean;
  toggleClickMode(): boolean;
  isFlowOn(): boolean;
  isHeatOn(): boolean;
  isClickMode(): boolean;
  togglePanels(): void;
  showHelp(): void;
  hideHelp(): void;
}

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`[UI] missing element #${id}`);
  return el as T;
};

const esc = (v: string): string =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const STATE_TEXT: Record<string, [string, string]> = {
  assembled: ['Assembled', 'ASSEMBLED'],
  exploding: ['Exploding', 'IN PROGRESS'],
  exploded: ['Fully Exploded', 'TEARDOWN'],
  assembling: ['Restoring', 'ASSEMBLING'],
};

export class UIController {
  private tree = $('part-tree');
  private detail = $('detail-body');
  private detailCode = $('detail-code');
  private stateChip = $('state-chip');
  private stateLabel = $('state-label');
  private stateSub = $('state-sub');
  private progressBar = $('explode-progress');
  private progressPct = $('explode-percent');
  private explodeAllBtn = $('btn-explode-all');
  private explodeAllText = $('explode-all-text');
  private tooltip = $('tooltip');
  private tooltipTitle = $('tooltip-title');
  private tooltipSub = $('tooltip-sub');
  private toastWrap = $('toast-wrap');
  private intro = $('intro');
  private viewDock = $('view-dock');
  private search = $<HTMLInputElement>('search-input');
  private fpsEl = $('fps-readout');
  private renderEl = $('render-readout');

  private rowEls = new Map<string, HTMLElement>();
  private catEls = new Map<CategoryId, HTMLElement>();
  private collapsed = new Set<CategoryId>();
  private selectedId: string | null = null;
  private lastSync = '';
  private toastTimers: number[] = [];

  constructor(
    private readonly actions: AppActions,
    private readonly registry: PartRegistry,
    private readonly explode: ExplodeController,
  ) {
    $('part-count').textContent = String(PARTS.length);
    this.buildTree();
    this.renderDetail(null);
    this.bindToolbar();
    this.bindTree();
    this.bindDetail();
    this.bindDock();
    this.bindKeyboard();
    this.bindIntro();
    this.bindSearch();
  }

  /* ------------------------------------------------------------------ */
  /* tree                                                                */
  /* ------------------------------------------------------------------ */

  private buildTree(): void {
    const query = this.search?.value.trim().toLowerCase() ?? '';
    this.tree.innerHTML = '';
    this.rowEls.clear();
    this.catEls.clear();

    for (const cat of CATEGORIES) {
      const parts = PARTS.filter((p) => p.category === cat.id);
      const matches = parts.filter((p) => {
        if (!query) return true;
        return (
          p.name.toLowerCase().includes(query) ||
          p.en.toLowerCase().includes(query) ||
          p.code.toLowerCase().includes(query) ||
          p.id.includes(query) ||
          p.summary.toLowerCase().includes(query)
        );
      });

      if (!matches.length) continue;

      const group = document.createElement('div');
      group.className = 'tree-group';

      const catRow = document.createElement('div');
      catRow.className = 'tree-cat';
      catRow.dataset.cat = cat.id;
      if (this.collapsed.has(cat.id)) catRow.classList.add('is-collapsed');
      catRow.innerHTML = `
        <svg class="caret" viewBox="0 0 10 10"><path d="M2 1.6 7 5 2 8.4z" fill="currentColor"/></svg>
        <i class="cat-swatch" style="background:${cat.accent}"></i>
        <span class="cat-name">${esc(cat.name)}</span>
        <span class="cat-count">${matches.length}</span>
        <button class="cat-act" data-cat="${cat.id}" title="Explode / restore this subsystem" aria-label="Explode this subsystem">
          <svg viewBox="0 0 14 14"><path d="M7 2v10M2 7h10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        </button>
      `;

      const items = document.createElement('div');
      items.className = 'tree-items';
      if (this.collapsed.has(cat.id)) items.classList.add('is-collapsed');

      for (const part of matches) {
        const row = document.createElement('div');
        row.className = 'part-row';
        row.dataset.part = part.id;
        row.style.setProperty('--part-accent', cat.accent);
        row.innerHTML = `
          <span class="row-status"></span>
          <span class="row-name">${esc(part.name)}</span>
          <span class="row-actions">
            <button class="row-btn" data-action="focus" title="Focus this part" aria-label="Focus">
              <svg viewBox="0 0 14 14"><circle cx="7" cy="7" r="4.4" stroke="currentColor" fill="none"/><circle cx="7" cy="7" r="1.4" fill="currentColor"/></svg>
            </button>
            <button class="row-btn" data-action="explode" title="Explode / restore" aria-label="Explode">
              <svg viewBox="0 0 14 14"><path d="M7 1.8v4M7 8.2v4M1.8 7h4M8.2 7h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
            </button>
            <button class="row-btn" data-action="visibility" title="Show / hide" aria-label="Show or hide">
              <svg viewBox="0 0 14 14"><path d="M1.5 7S3.6 3.4 7 3.4 12.5 7 12.5 7 10.4 10.6 7 10.6 1.5 7 1.5 7z" stroke="currentColor" fill="none"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></svg>
            </button>
          </span>
        `;
        items.appendChild(row);
        this.rowEls.set(part.id, row);
      }

      group.append(catRow, items);
      this.tree.appendChild(group);
      this.catEls.set(cat.id, catRow);
    }

    if (!this.tree.children.length) {
      this.tree.innerHTML = '<div class="empty-hint">No matching parts.<br/>Try &ldquo;flange&rdquo; or &ldquo;MFC&rdquo;.</div>';
    }

    this.refreshRowStates();
  }

  private bindTree(): void {
    this.tree.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const actionBtn = target.closest<HTMLElement>('[data-action]');
      const row = target.closest<HTMLElement>('.part-row');
      const catBtn = target.closest<HTMLElement>('.cat-act');
      const catRow = target.closest<HTMLElement>('.tree-cat');

      if (catBtn) {
        const cat = catBtn.dataset.cat as CategoryId;
        this.actions.toggleCategory(cat);
        return;
      }

      if (catRow && !catBtn) {
        const cat = catRow.dataset.cat as CategoryId | undefined;
        if (cat) this.toggleCategoryCollapse(cat);
        return;
      }

      if (!row) return;
      const id = row.dataset.part;
      if (!id) return;

      if (actionBtn) {
        const action = actionBtn.dataset.action;
        if (action === 'explode') this.actions.toggleExplode(id);
        if (action === 'focus') this.actions.focusPart(id);
        if (action === 'visibility') this.actions.toggleVisibility(id);
        return;
      }

      const wasSelected = this.selectedId === id;
      this.actions.selectPart(id, true);
      if (this.actions.isClickMode()) {
        if (wasSelected) this.actions.toggleExplode(id);
        else this.actions.setExploded(id, true);
      }
    });
  }

  private toggleCategoryCollapse(cat: CategoryId): void {
    if (this.collapsed.has(cat)) this.collapsed.delete(cat);
    else this.collapsed.add(cat);
    const row = this.catEls.get(cat);
    const items = row?.parentElement?.querySelector('.tree-items');
    row?.classList.toggle('is-collapsed', this.collapsed.has(cat));
    items?.classList.toggle('is-collapsed', this.collapsed.has(cat));
  }

  private refreshRowStates(): void {
    for (const [id, row] of this.rowEls) {
      const part = this.registry.get(id);
      if (!part) continue;
      const moving = Math.abs(part.target - part.progress) > 0.001;
      row.classList.toggle('is-selected', this.selectedId === id);
      row.classList.toggle('is-exploded', part.progress > 0.98);
      row.classList.toggle('is-moving', moving);
      row.style.opacity = part.visible ? '' : '0.45';
    }
  }

  /* ------------------------------------------------------------------ */
  /* inspector                                                           */
  /* ------------------------------------------------------------------ */

  setSelected(id: string | null, scroll = true): void {
    this.selectedId = id;
    this.refreshRowStates();
    this.renderDetail(id);

    if (id && scroll) {
      const row = this.rowEls.get(id);
      row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  private renderDetail(id: string | null): void {
    if (!id) {
      this.detailCode.textContent = 'SYS';
      this.detail.innerHTML = this.overviewMarkup();
      return;
    }

    const part = PARTS_BY_ID[id];
    if (!part) {
      this.renderDetail(null);
      return;
    }

    const cat = CATEGORY_MAP[part.category];
    const runtime = this.registry.get(id);
    const exploded = (runtime?.progress ?? 0) > 0.5;
    this.detailCode.textContent = part.code;

    const params = part.parameters
      .map(
        (p) =>
          `<div class="param-row"><dt>${esc(p.key)}</dt><dd>${esc(p.value)}</dd></div>`,
      )
      .join('');

    this.detail.innerHTML = `
      <article class="detail">
        <div class="detail-hero">
          <div class="detail-kicker">
            <i class="k-dot" style="background:${cat.accent};box-shadow:0 0 8px ${cat.accent}"></i>
            <span>${esc(cat.en)} / ${esc(part.code)}</span>
          </div>
          <h3>${esc(part.name)}</h3>
          <div class="detail-en">${esc(part.en)}</div>
          <p class="detail-summary">${esc(part.summary)}</p>
          <div class="chip-row">
            <span class="chip ${exploded ? 'is-live' : ''}" id="detail-state-chip">${exploded ? 'Exploded' : 'Assembled'}</span>
            <span class="chip"><span class="chip-key">ID</span>${esc(part.id)}</span>
            <span class="chip">${esc(cat.name)}</span>
            <span class="chip">${esc(part.spec)}</span>
          </div>
        </div>

        <section class="section">
          <div class="section-title">Key Parameters <span class="en">SPECIFICATION</span></div>
          <dl class="param-list">${params}</dl>
        </section>

        <section class="section">
          <div class="section-title">Principle of Operation <span class="en">PRINCIPLE</span></div>
          <p class="detail-text">${esc(part.principle)}</p>
          ${
            part.note
              ? `<div class="detail-note"><i>i</i><span>${esc(part.note)}</span></div>`
              : ''
          }
        </section>

        <section class="section">
          <div class="section-title">Actions <span class="en">INTERACTION</span></div>
          <div class="action-grid">
            <button class="btn btn-primary" data-action="toggle">${exploded ? 'Restore Part' : 'Explode Part'}</button>
            <button class="btn btn-ghost" data-action="focus">Focus View</button>
            <button class="btn btn-ghost" data-action="visibility">${runtime?.visible === false ? 'Show Part' : 'Hide Part'}</button>
            <button class="btn btn-ghost" data-action="close">Clear Selection</button>
          </div>
        </section>
      </article>
    `;
  }

  private overviewMarkup(): string {
    return `
      <div class="overview-intro">
        <div class="detail-kicker"><i class="k-dot"></i><span>HORIZONTAL TUBE CVD / SYSTEM</span></div>
        <h3>Horizontal Tube CVD Growth System</h3>
        <p>
          Modelled on an atmospheric / low-pressure chemical vapour deposition process:
          carrier gas transports precursors into a quartz tube, a three-zone resistance furnace
          pyrolyses them, and the species nucleate and grow into a 2D film on the substrate.
          Exhaust is pumped away and scrubbed before release.
        </p>
        <div class="stat-grid">
          <div class="stat"><b>${PARTS.length}</b><small>Interactive parts</small></div>
          <div class="stat"><b>6</b><small>Subsystems</small></div>
          <div class="stat"><b>3</b><small>Independent zones</small></div>
          <div class="stat"><b>1200<span>°C</span></b><small>Max furnace (schematic)</small></div>
        </div>
      </div>

      <section class="section">
        <div class="section-title">Process Flow <span class="en">GROWTH SEQUENCE</span></div>
        <div class="flow">
          <div class="flow-step"><span class="step-no">01</span><div><b>Gas supply &amp; metering</b><p>Ar / CH₄ / H₂ pass two-stage regulators and mass-flow controllers for precise blending.</p></div></div>
          <div class="flow-step"><span class="step-no">02</span><div><b>Mixing &amp; transport</b><p>The manifold homogenises the mixture before it enters the quartz tube as a stable laminar flow.</p></div></div>
          <div class="flow-step"><span class="step-no">03</span><div><b>Thermal decomposition</b><p>Three independently controlled zones heat the precursors to their decomposition temperature.</p></div></div>
          <div class="flow-step"><span class="step-no">04</span><div><b>Surface reaction</b><p>Active species adsorb on the substrate, nucleate, migrate and coalesce into a 2D film.</p></div></div>
          <div class="flow-step"><span class="step-no">05</span><div><b>Exhaust treatment</b><p>Unreacted gas is pumped out and passed through the scrubber before release.</p></div></div>
        </div>
      </section>

      <section class="section">
        <div class="section-title">Quick Actions <span class="en">SHORTCUTS</span></div>
        <div class="action-grid">
          <button class="btn btn-primary" data-action="explode-all">Explode System</button>
          <button class="btn btn-ghost" data-action="focus-tube">Focus the Chamber</button>
        </div>
      </section>

      <div class="detail-note"><i>i</i><span>All dimensions, temperatures and flows are teaching schematics — they are not the rated specification of any real instrument.</span></div>
    `;
  }

  private bindDetail(): void {
    this.detail.addEventListener('click', (event) => {
      const btn = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;

      if (action === 'explode-all') {
        this.actions.explodeAll();
        return;
      }
      if (action === 'focus-tube') {
        this.actions.selectPart('quartz-tube', true);
        this.actions.focusPart('quartz-tube');
        return;
      }

      const id = this.selectedId;
      if (!id) return;

      if (action === 'toggle') this.actions.toggleExplode(id);
      if (action === 'focus') this.actions.focusPart(id);
      if (action === 'visibility') this.actions.toggleVisibility(id);
      if (action === 'close') this.actions.selectPart(null);
    });
  }

  /* ------------------------------------------------------------------ */
  /* toolbar / dock / intro                                              */
  /* ------------------------------------------------------------------ */

  private bindToolbar(): void {
    this.explodeAllBtn.addEventListener('click', () => {
      if (this.explode.isMostlyExploded()) this.actions.assembleAll();
      else this.actions.explodeAll();
    });

    const flowBtn = $<HTMLButtonElement>('btn-flow');
    flowBtn.addEventListener('click', () => {
      const on = this.actions.toggleFlow();
      flowBtn.classList.toggle('is-on', on);
      this.toast(on ? 'Gas-flow animation on' : 'Gas-flow animation off');
    });

    const heatBtn = $<HTMLButtonElement>('btn-heat');
    heatBtn.classList.toggle('is-hot', this.actions.isHeatOn());
    heatBtn.addEventListener('click', () => {
      const on = this.actions.toggleHeat();
      heatBtn.classList.toggle('is-on', on);
      heatBtn.classList.toggle('is-hot', on);
      this.toast(on ? 'Furnace heating on · 1200 °C zones (schematic)' : 'Furnace cooled to room temperature');
    });

    const clickBtn = $<HTMLButtonElement>('btn-click-mode');
    clickBtn.addEventListener('click', () => {
      const on = this.actions.toggleClickMode();
      clickBtn.classList.toggle('is-on', on);
      this.toast(on ? 'Click-to-explode enabled' : 'Click now only selects a part');
    });

    $('btn-panels').addEventListener('click', () => this.actions.togglePanels());
    $('btn-help').addEventListener('click', () => this.actions.showHelp());
  }

  private bindDock(): void {
    this.viewDock.addEventListener('click', (event) => {
      const btn = (event.target as HTMLElement).closest<HTMLElement>('[data-view]');
      if (!btn) return;
      const view = btn.dataset.view;
      if (!view) return;
      this.actions.setView(view);

      if (view !== 'reset') {
        this.viewDock.querySelectorAll('.dock-btn').forEach((el) => el.classList.remove('is-on'));
        btn.classList.add('is-on');
      }
    });
  }

  private bindIntro(): void {
    $('btn-enter').addEventListener('click', () => this.actions.hideHelp());
    $('btn-intro-explode').addEventListener('click', () => {
      this.actions.hideHelp();
      window.setTimeout(() => this.actions.explodeAll(), 260);
    });
  }

  private bindSearch(): void {
    this.search.addEventListener('input', () => this.buildTree());
  }

  private bindKeyboard(): void {
    window.addEventListener('keydown', (event) => {
      const target = event.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      switch (event.key.toLowerCase()) {
        case 'e':
          this.actions.explodeAll();
          break;
        case 'a':
          this.actions.assembleAll();
          break;
        case 'r':
          this.actions.setView('reset');
          break;
        case 'f':
          if (this.selectedId) this.actions.focusPart(this.selectedId);
          break;
        case 'escape':
          this.actions.selectPart(null);
          this.actions.hideHelp();
          break;
        case '1':
          this.actions.setView('iso');
          break;
        case '2':
          this.actions.setView('front');
          break;
        case '3':
          this.actions.setView('gas');
          break;
        case '4':
          this.actions.setView('vacuum');
          break;
        case '5':
          this.actions.setView('top');
          break;
        case '6':
          this.actions.setView('interior');
          break;
        default:
          break;
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* runtime sync                                                        */
  /* ------------------------------------------------------------------ */

  sync(): void {
    const state = this.explode.stateLabel();
    const progress = this.explode.overallProgress();
    const pct = Math.round(progress * 100);
    const exploded = this.explode.explodedCount();

    const signature = `${state}|${pct}|${exploded}|${this.selectedId}|${this.registry.all().map((p) => (p.progress > 0.98 ? 1 : 0) + (Math.abs(p.target - p.progress) > 0.001 ? 2 : 0) + (p.visible ? 0 : 4)).join('')}`;
    if (signature === this.lastSync) return;
    this.lastSync = signature;

    const [label, sub] = STATE_TEXT[state];
    this.stateLabel.textContent = label;
    this.stateSub.textContent = sub;
    this.stateChip.classList.toggle('is-exploded', state === 'exploded');
    this.stateChip.classList.toggle('is-busy', state === 'exploding' || state === 'assembling');

    this.progressBar.style.width = `${pct}%`;
    this.progressPct.textContent = `${pct}%`;
    this.explodeAllText.textContent = this.explode.isMostlyExploded()
      ? 'Restore System'
      : 'Explode System';

    this.refreshRowStates();

    if (this.selectedId) {
      const chip = document.getElementById('detail-state-chip');
      const isExploded = this.explode.isExploded(this.selectedId);
      if (chip) {
        chip.textContent = isExploded ? 'Exploded' : 'Assembled';
        chip.classList.toggle('is-live', isExploded);
      }
      const toggleBtn = this.detail.querySelector<HTMLElement>('[data-action="toggle"]');
      if (toggleBtn) toggleBtn.textContent = isExploded ? 'Restore Part' : 'Explode Part';

      const part = this.registry.get(this.selectedId);
      const visBtn = this.detail.querySelector<HTMLElement>('[data-action="visibility"]');
      if (visBtn && part) visBtn.textContent = part.visible ? 'Hide Part' : 'Show Part';
    }
  }

  /* ------------------------------------------------------------------ */
  /* feedback                                                            */
  /* ------------------------------------------------------------------ */

  showTooltip(id: string | null, clientX: number, clientY: number): void {
    if (!id) {
      this.tooltip.classList.remove('is-visible');
      return;
    }
    const part = PARTS_BY_ID[id];
    if (!part) return;

    this.tooltipTitle.textContent = part.name;
    this.tooltipSub.textContent = `${part.code} · CLICK TO EXPLODE · DOUBLE-CLICK TO FOCUS`;
    this.tooltip.classList.add('is-visible');

    const pad = 16;
    const w = this.tooltip.offsetWidth || 180;
    const h = this.tooltip.offsetHeight || 44;
    const x = Math.min(window.innerWidth - w - 12, clientX + pad);
    const y = Math.min(window.innerHeight - h - 12, clientY + pad);
    this.tooltip.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  toast(message: string): void {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    this.toastWrap.appendChild(el);

    const timer = window.setTimeout(() => {
      el.classList.add('is-out');
      window.setTimeout(() => el.remove(), 320);
    }, 2100);
    this.toastTimers.push(timer);
    if (this.toastWrap.childElementCount > 3) {
      this.toastWrap.firstElementChild?.remove();
    }
  }

  setFps(fps: number): void {
    this.fpsEl.textContent = `${fps.toFixed(0)} FPS`;
  }

  setRendererLabel(label: string): void {
    this.renderEl.textContent = label;
  }

  showHelp(): void {
    this.intro.hidden = false;
  }

  hideHelp(): void {
    this.intro.hidden = true;
  }

  get isHelpOpen(): boolean {
    return !this.intro.hidden;
  }

  resetViewDock(): void {
    this.viewDock.querySelectorAll('.dock-btn').forEach((el, i) => {
      el.classList.toggle('is-on', i === 0);
    });
  }
}
