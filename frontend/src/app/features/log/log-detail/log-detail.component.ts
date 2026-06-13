import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, switchMap, of } from 'rxjs';
import { LogService, OperationLog, ApiRequestLog, ApiRetryLog } from '../../../core/services/log.service';

type LogType = 'operation' | 'request' | 'retry';

@Component({
  selector: 'app-log-detail',
  templateUrl: './log-detail.component.html',
  styleUrls: ['./log-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogDetailComponent implements OnInit, OnDestroy {
  logType?: LogType;
  logId?: number;
  operationLog?: OperationLog;
  requestLog?: ApiRequestLog;
  retryLog?: ApiRetryLog;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private logService: LogService
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        switchMap(params => {
          this.logType = params['type'] as LogType;
          this.logId = +params['id'];

          if (this.logType === 'operation') {
            return this.logService.getOperationLog(this.logId);
          } else if (this.logType === 'request') {
            return this.logService.getApiRequestLog(this.logId);
          } else if (this.logType === 'retry') {
            return this.logService.getApiRetryLog(this.logId);
          }
          return of(null);
        })
      )
      .subscribe(log => {
        if (this.logType === 'operation') {
          this.operationLog = log as OperationLog;
        } else if (this.logType === 'request') {
          this.requestLog = log as ApiRequestLog;
        } else if (this.logType === 'retry') {
          this.retryLog = log as ApiRetryLog;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  formatJson(obj: any): string {
    if (typeof obj === 'string') {
      try {
        obj = JSON.parse(obj);
      } catch (e) {
        return obj;
      }
    }
    return JSON.stringify(obj, null, 2);
  }
}
