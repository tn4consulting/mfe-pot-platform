import { defineCustomElement } from '../../../dist/components/scds-multi-column-list.js';
import { waitForRender } from '../../testing/wait-for-render';
import type { ScdsListColumn } from './scds-multi-column-list';

interface Task {
  id: string;
  title: string;
  dueDate: string;
}

interface ScdsMultiColumnListElement extends HTMLElement {
  items: unknown[];
  columns: ScdsListColumn[];
  emptyLabel?: string;
  listLabel?: string;
}

const TASKS: Task[] = [
  { id: '1', title: 'Submit report', dueDate: '2026-08-10' },
  { id: '2', title: 'Review claim', dueDate: '2026-08-15' },
];

const COLUMNS: ScdsListColumn[] = [
  { id: 'title', header: 'Task', cell: (item) => (item as Task).title, priority: 'primary' },
  { id: 'due', header: 'Due date', cell: (item) => (item as Task).dueDate, priority: 'secondary' },
];

describe('scds-multi-column-list', () => {
  beforeAll(() => {
    defineCustomElement();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function createList(props: Partial<ScdsMultiColumnListElement> = {}): Promise<ScdsMultiColumnListElement> {
    const el = document.createElement('scds-multi-column-list') as ScdsMultiColumnListElement;
    Object.assign(el, props);
    document.body.appendChild(el);
    await waitForRender();
    return el;
  }

  it('renders one listitem per item, in order', async () => {
    const el = await createList({ items: TASKS, columns: COLUMNS });

    const rows = el.shadowRoot!.querySelectorAll('li[role="listitem"]');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Submit report');
    expect(rows[1].textContent).toContain('Review claim');
  });

  it('renders emptyLabel outside the list when items is empty', async () => {
    const el = await createList({ emptyLabel: 'No tasks.' });

    expect(el.shadowRoot!.querySelector('ul[role="list"]')).toBeFalsy();
    expect(el.shadowRoot!.textContent).toContain('No tasks.');
  });

  it("includes each column's header text in the cell", async () => {
    const el = await createList({ items: TASKS, columns: COLUMNS });

    const firstRow = el.shadowRoot!.querySelector('li[role="listitem"]')!;
    expect(firstRow.textContent).toContain('Task:');
    expect(firstRow.textContent).toContain('Due date:');
  });

  it('re-renders with the updated row count after an items update', async () => {
    const el = await createList({ items: TASKS, columns: COLUMNS });

    el.items = [...TASKS, { id: '3', title: 'Update address', dueDate: '2026-08-20' }];
    await waitForRender();

    const rows = el.shadowRoot!.querySelectorAll('li[role="listitem"]');
    expect(rows.length).toBe(3);
    expect(rows[2].textContent).toContain('Update address');
  });

  it('sets aria-label from listLabel on the list', async () => {
    const el = await createList({ items: TASKS, columns: COLUMNS, listLabel: 'My Tasks' });

    const list = el.shadowRoot!.querySelector('ul[role="list"]')!;
    expect(list.getAttribute('aria-label')).toBe('My Tasks');
  });
});
