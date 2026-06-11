import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Contract } from '../models';

@Injectable({ providedIn: 'root' })
export class ContractService {
  constructor(private api: ApiService) {}

  getByProject(projectId: string): Observable<Contract> {
    return this.api.get<Contract>(`/projects/${projectId}/contract`);
  }

  getById(id: string): Observable<Contract> {
    return this.api.get<Contract>(`/contracts/${id}`);
  }

  create(projectId: string, data: any): Observable<Contract> {
    return this.api.post<Contract>(`/projects/${projectId}/contract`, data);
  }

  update(id: string, data: any): Observable<Contract> {
    return this.api.patch<Contract>(`/contracts/${id}`, data);
  }

  send(id: string): Observable<Contract> {
    return this.api.post<Contract>(`/contracts/${id}/send`, {});
  }

  sign(id: string): Observable<Contract> {
    return this.api.post<Contract>(`/contracts/${id}/sign`, {});
  }
}
