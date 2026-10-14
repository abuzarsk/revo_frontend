import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-mediator-section',
  template: `
    <section class="ms-page">
      <header class="ms-intro">
        <div>
          <p class="ms-crumbs">
            <span>Workspace</span>
            <i class="fa fa-angle-right" aria-hidden="true"></i>
            <span class="is-current">{{ title }}</span>
          </p>
          <h1>{{ title }}</h1>
          <p class="ms-lede">{{ title }} in Partner Hub</p>
        </div>
        <span class="ms-operational"><span aria-hidden="true"></span>All systems operational</span>
      </header>
      <div class="ms-empty">Nothing is listed here yet.</div>
    </section>
  `,
  styles: [`
    .ms-page, .ms-page * { box-sizing: border-box; }
    .ms-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      color: var(--foreground);
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
    }
    .ms-intro { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
    .ms-crumbs { display: flex; align-items: center; gap: 8px; margin: 0 0 8px; color: oklch(0.58 0.035 260); font-size: 12px; }
    .ms-crumbs .is-current { color: var(--primary); font-weight: 500; }
    .ms-intro h1 { margin: 0; font-size: 27px; font-weight: 700; line-height: 1.15; }
    .ms-lede { margin: 6px 0 0; color: oklch(0.58 0.035 260); font-size: 13px; }
    .ms-operational {
      display: inline-flex; align-items: center; gap: 8px; height: 32px; margin-left: auto;
      padding: 0 12px; border-radius: 999px; border: 1px solid color-mix(in oklab, var(--success) 20%, transparent);
      background: color-mix(in oklab, var(--success) 10%, #fff); color: var(--success); font-size: 11px; font-weight: 600;
    }
    .ms-operational span { width: 6px; height: 6px; border-radius: 999px; background: currentColor; }
    .ms-empty {
      padding: 40px 16px; border: 1px dashed oklch(0.93 0.012 270); border-radius: 1rem;
      background: #fff; color: oklch(0.58 0.035 260); font-size: 14px; text-align: center;
    }
    @media (min-width: 640px) { .ms-intro h1 { font-size: 30px; } }
  `],
})
export class MediatorSection {
  title = 'Workspace';

  constructor(private route: ActivatedRoute) {
    this.title = this.route.snapshot.data['title'] || this.title;
  }
}
