import { Component, TemplateRef, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ScdsListColumn, ScdsMultiColumnList } from './scds-multi-column-list';

interface Task {
  id: string;
  title: string;
  dueDate: string;
}

const TASKS: Task[] = [
  { id: '1', title: 'Submit report', dueDate: '2026-08-10' },
  { id: '2', title: 'Review claim', dueDate: '2026-08-15' },
];

const COLUMNS: ScdsListColumn<Task>[] = [
  { id: 'title', header: 'Task', cell: (t) => t.title, priority: 'primary' },
  { id: 'due', header: 'Due date', cell: (t) => t.dueDate, priority: 'secondary' },
];

describe('ScdsMultiColumnList', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScdsMultiColumnList],
    }).compileComponents();
  });

  it('renders one listitem per item, in order', () => {
    const fixture = TestBed.createComponent(ScdsMultiColumnList<Task>);
    fixture.componentRef.setInput('items', TASKS);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('li[role="listitem"]');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Submit report');
    expect(rows[1].textContent).toContain('Review claim');
  });

  it('renders emptyLabel outside the list when items is empty', () => {
    const fixture = TestBed.createComponent(ScdsMultiColumnList<Task>);
    fixture.componentRef.setInput('items', []);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('emptyLabel', 'No tasks.');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('ul[role="list"]')).toBeFalsy();
    expect(fixture.nativeElement.textContent).toContain('No tasks.');
  });

  it("includes each column's header text in the cell", () => {
    const fixture = TestBed.createComponent(ScdsMultiColumnList<Task>);
    fixture.componentRef.setInput('items', TASKS);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.detectChanges();

    const firstRow = fixture.nativeElement.querySelector('li[role="listitem"]');
    expect(firstRow.textContent).toContain('Task:');
    expect(firstRow.textContent).toContain('Due date:');
  });

  it('renders projected template content instead of cell() when a column has a template', () => {
    @Component({
      standalone: true,
      template: `
        <ng-template #statusTpl let-task>
          <button type="button" class="status-btn">{{ task.title }} status</button>
        </ng-template>
      `,
    })
    class TemplateHostComponent {
      @ViewChild('statusTpl') statusTpl!: TemplateRef<{ $implicit: Task }>;
    }

    const templateHost = TestBed.createComponent(TemplateHostComponent);
    templateHost.detectChanges();
    const template = templateHost.componentInstance.statusTpl;

    const fixture = TestBed.createComponent(ScdsMultiColumnList<Task>);
    fixture.componentRef.setInput('items', [TASKS[0]]);
    fixture.componentRef.setInput('columns', [{ id: 'status', header: 'Status', cell: () => 'should not render', template }]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.status-btn').textContent).toContain('Submit report status');
    expect(fixture.nativeElement.textContent).not.toContain('should not render');
  });

  it('preserves DOM identity across an items update per trackBy', () => {
    const fixture = TestBed.createComponent(ScdsMultiColumnList<Task>);
    fixture.componentRef.setInput('items', TASKS);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.detectChanges();

    const firstLiBefore = fixture.nativeElement.querySelector('li[role="listitem"]');

    fixture.componentRef.setInput('items', [...TASKS]);
    fixture.detectChanges();

    const firstLiAfter = fixture.nativeElement.querySelector('li[role="listitem"]');
    expect(firstLiAfter).toBe(firstLiBefore);
  });
});
