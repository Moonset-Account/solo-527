import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { ChargeListComponent } from './charge-list/charge-list.component';
import { ChargeDetailComponent } from './charge-detail/charge-detail.component';

const routes: Routes = [
  { path: '', component: ChargeListComponent },
  { path: 'new', component: ChargeDetailComponent },
  { path: ':id', component: ChargeDetailComponent }
];

@NgModule({
  declarations: [
    ChargeListComponent,
    ChargeDetailComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class ChargeModule { }
