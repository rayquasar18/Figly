import { Injectable, OnModuleDestroy, MessageEvent } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Injectable()
export class NotificationsGateway implements OnModuleDestroy {
  private readonly connections = new Map<string, Subject<MessageEvent>>();

  subscribe(userId: string): Observable<MessageEvent> {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Subject<MessageEvent>());
    }

    const subject = this.connections.get(userId)!;

    return subject.asObservable().pipe(
      finalize(() => {
        // Clean up if no more observers
        if (subject.observed === false) {
          this.connections.delete(userId);
        }
      }),
    );
  }

  emit(userId: string, event: MessageEvent): void {
    const subject = this.connections.get(userId);
    if (subject) {
      subject.next(event);
    }
  }

  onModuleDestroy(): void {
    for (const subject of this.connections.values()) {
      subject.complete();
    }
    this.connections.clear();
  }
}
