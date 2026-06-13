import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { RevisitListComponent } from './revisit-list/revisit-list.component';
import { RevisitDetailComponent } from './revisit-detail/revisit-detail.component';

const routes: Routes = [
  { path: '', component: RevisitListComponent },
  { path: 'new', component: RevisitDetailComponent },
  { path: ':id', component: RevisitDetailComponent }
];

@NgModule({
  declarations: [
    RevisitListComponent,
    RevisitDetailComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class RevisitModule { }
