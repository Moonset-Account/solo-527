import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Contract } from '@shared/models';
import { ContractService } from '@shared/services/contract.service';

@Component({
  selector: 'app-portal-contract',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './portal-contract.component.html',
  styleUrls: ['./portal-contract.component.scss'],
})
export class PortalContractComponent implements OnInit {
  contract!: Contract;
  token = '';
  loading = true;
  signed = false;

  constructor(
    private route: ActivatedRoute,
    private contractService: ContractService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'current') {
      this.loadContract(id);
    }
  }

  loadContract(id: string): void {
    this.contractService.getById(id).subscribe({
      next: (data) => {
        this.contract = data;
        this.signed = data.status === 'signed';
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('加载合同失败', '关闭', { duration: 3000 });
        this.loading = false;
      },
    });
  }

  signContract(): void {
    if (!this.contract) return;
    this.contractService.sign(this.contract.id).subscribe({
      next: () => {
        this.signed = true;
        this.snackBar.open('合同签署成功', '关闭', { duration: 3000 });
        this.loadContract(this.contract.id);
      },
      error: () => this.snackBar.open('签署失败', '关闭', { duration: 3000 }),
    });
  }

  canSign(): boolean {
    return this.contract?.status === 'sent';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
}
