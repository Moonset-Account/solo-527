import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { Contract, ContractStatus } from '@shared/models';
import { ContractService } from '@shared/services/contract.service';

@Component({
  selector: 'app-contract-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatListModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  templateUrl: './contract-detail.component.html',
  styleUrls: ['./contract-detail.component.scss'],
})
export class ContractDetailComponent implements OnInit {
  contract!: Contract;
  loading = true;

  statusTimeline: { status: ContractStatus; label: string; icon: string; done: boolean }[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contractService: ContractService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadContract(id);
    }
  }

  loadContract(id: string): void {
    this.contractService.getById(id).subscribe({
      next: (data) => {
        this.contract = data;
        this.buildTimeline(data.status);
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('加载合同失败', '关闭', { duration: 3000 });
        this.loading = false;
      },
    });
  }

  buildTimeline(currentStatus: ContractStatus): void {
    const statuses: ContractStatus[] = ['draft', 'sent', 'signed'];
    const labels: Record<ContractStatus, string> = {
      draft: '草稿',
      sent: '已发送',
      signed: '已签署',
    };
    const icons: Record<ContractStatus, string> = {
      draft: 'edit_note',
      sent: 'send',
      signed: 'check_circle',
    };
    const currentIndex = statuses.indexOf(currentStatus);
    this.statusTimeline = statuses.map((s, i) => ({
      status: s,
      label: labels[s],
      icon: icons[s],
      done: i <= currentIndex,
    }));
  }

  sendContract(): void {
    if (!this.contract) return;
    this.contractService.send(this.contract.id).subscribe({
      next: () => {
        this.snackBar.open('合同已发送给客户', '关闭', { duration: 2000 });
        this.loadContract(this.contract.id);
      },
      error: () => this.snackBar.open('发送失败', '关闭', { duration: 3000 }),
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/projects', this.contract?.projectId]);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
}
