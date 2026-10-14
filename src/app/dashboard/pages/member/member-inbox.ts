import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ensureWorkspaceRole, workspaceLabel } from './member-role';

type NoticeKind = 'payout' | 'submission' | 'message' | 'system';

interface Notice {
  id: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  kind: NoticeKind;
  route: string;
}

interface ChatMessage {
  id: string;
  from: 'me' | 'them';
  text: string;
  at: string;
}

interface Thread {
  id: string;
  name: string;
  subtitle: string;
  avatar: string;
  unread: number;
  messages: ChatMessage[];
}

interface Announcement {
  id: string;
  title: string;
  category: string;
  date: string;
  body: string;
  read: boolean;
}

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3600_000).toISOString();

@Component({
  selector: 'app-member-inbox',
  imports: [CommonModule, FormsModule],
  templateUrl: './member-inbox.html',
  styleUrl: './member.css',
})
export class MemberInbox implements OnInit, OnDestroy {
  kind: 'notifications' | 'messages' | 'announcements' = 'notifications';
  filter = 'all';
  query = '';
  draft = '';
  activeThreadId: string | null = null;

  notices: Notice[] = [
    {
      id: 'n1',
      title: 'Refund approved',
      body: 'Smart Watch refund of ₹2,499 is scheduled.',
      at: hoursAgo(6),
      read: false,
      kind: 'payout',
      route: '/payouts',
    },
    {
      id: 'n2',
      title: 'New message from Company Alpha',
      body: 'Could you share a clearer screenshot?',
      at: hoursAgo(4.5),
      read: false,
      kind: 'message',
      route: '/messages',
    },
    {
      id: 'n3',
      title: 'Submission rejected',
      body: 'SUB-1036 needs a new screenshot.',
      at: hoursAgo(40),
      read: true,
      kind: 'submission',
      route: '/my-submissions',
    },
  ];

  threads: Thread[] = [
    {
      id: 'th1',
      name: 'Company Alpha',
      subtitle: 'Brand',
      avatar: 'CA',
      unread: 2,
      messages: [
        { id: 'm1', from: 'them', text: 'Hi, thanks for submitting SUB-1042.', at: hoursAgo(5) },
        { id: 'm2', from: 'them', text: 'Could you share a clearer screenshot of the review?', at: hoursAgo(4.5) },
      ],
    },
    {
      id: 'th2',
      name: 'Partner Hub',
      subtitle: 'Mediator',
      avatar: 'PH',
      unread: 0,
      messages: [
        { id: 'm3', from: 'me', text: 'When will the Smart Watch refund land?', at: hoursAgo(30) },
        { id: 'm4', from: 'them', text: "It's approved — expect it in the next payout cycle.", at: hoursAgo(29) },
      ],
    },
    {
      id: 'th3',
      name: 'Revo Support',
      subtitle: 'Help desk',
      avatar: 'RS',
      unread: 0,
      messages: [{ id: 'm5', from: 'them', text: 'Welcome to Revo. Reply here anytime.', at: hoursAgo(300) }],
    },
  ];

  announcements: Announcement[] = [
    {
      id: 'ann-1',
      title: 'October campaign calendar is live',
      category: 'Campaigns',
      date: '4 Oct 2026',
      body: 'New seasonal product campaigns are available. Check your workspace for updated slots and schedules.',
      read: false,
    },
    {
      id: 'ann-2',
      title: 'Payout processing window',
      category: 'Finance',
      date: '2 Oct 2026',
      body: 'Payouts follow the schedule shown on your payouts page. The next window opens on Monday.',
      read: false,
    },
    {
      id: 'ann-3',
      title: 'Workspace improvements',
      category: 'Product',
      date: '28 Sep 2026',
      body: 'Submission tracking, notification preferences, and payout history are available in the member workspace.',
      read: true,
    },
  ];

  private sub?: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (!ensureWorkspaceRole(this.router)) {
      return;
    }
    this.sub = this.route.data.subscribe((data) => {
      this.kind = data['kind'] ?? 'notifications';
      this.filter = 'all';
      this.query = '';
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get title(): string {
    if (this.kind === 'messages') {
      return 'Messages';
    }
    if (this.kind === 'announcements') {
      return 'Announcements';
    }
    return 'Notifications';
  }

  get lede(): string {
    if (this.kind === 'announcements') {
      return 'Updates published for members.';
    }
    return `${this.title} in ${workspaceLabel()}`;
  }

  get unreadCount(): number {
    return this.notices.filter((item) => !item.read).length;
  }

  get visibleNotices(): Notice[] {
    return this.filter === 'unread' ? this.notices.filter((item) => !item.read) : this.notices;
  }

  get categories(): string[] {
    return ['All', ...new Set(this.announcements.map((item) => item.category))];
  }

  get visibleAnnouncements(): Announcement[] {
    if (this.filter === 'all' || this.filter === 'All') {
      return this.announcements;
    }
    return this.announcements.filter((item) => item.category === this.filter);
  }

  get visibleThreads(): Thread[] {
    const query = this.query.trim().toLowerCase();
    return this.threads.filter((thread) => !query || thread.name.toLowerCase().includes(query));
  }

  get activeThread(): Thread | null {
    return this.threads.find((thread) => thread.id === this.activeThreadId) ?? null;
  }

  ago(iso: string): string {
    const minutes = Math.max(0, (Date.now() - new Date(iso).getTime()) / 60000);
    if (minutes < 1) {
      return 'just now';
    }
    if (minutes < 60) {
      return `${Math.round(minutes)}m ago`;
    }
    if (minutes < 1440) {
      return `${Math.round(minutes / 60)}h ago`;
    }
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  lastMessage(thread: Thread): ChatMessage | undefined {
    return thread.messages[thread.messages.length - 1];
  }

  threadAgo(thread: Thread): string {
    const last = this.lastMessage(thread);
    return last ? this.ago(last.at) : '';
  }

  openNotice(notice: Notice): void {
    this.notices = this.notices.map((item) => (item.id === notice.id ? { ...item, read: true } : item));
    if (notice.route) {
      this.router.navigateByUrl(notice.route);
    }
  }

  markAllRead(): void {
    this.notices = this.notices.map((item) => ({ ...item, read: true }));
  }

  clearNotices(): void {
    this.notices = [];
  }

  openThread(id: string): void {
    this.activeThreadId = id;
    this.threads = this.threads.map((thread) => (thread.id === id ? { ...thread, unread: 0 } : thread));
  }

  send(): void {
    const text = this.draft.trim().slice(0, 1000);
    const active = this.activeThread;
    if (!active || !text) {
      return;
    }
    const message: ChatMessage = {
      id: `m-${Date.now()}`,
      from: 'me',
      text,
      at: new Date().toISOString(),
    };
    this.threads = this.threads.map((thread) =>
      thread.id === active.id ? { ...thread, messages: [...thread.messages, message] } : thread,
    );
    this.draft = '';
  }

  onDraftKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  markAnnouncement(id: string): void {
    this.announcements = this.announcements.map((item) => (item.id === id ? { ...item, read: true } : item));
  }
}
