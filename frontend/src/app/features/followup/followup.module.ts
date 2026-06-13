import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { FollowupListComponent } from './followup-list/followup-list.component';
import { FollowupDetailComponent } from './followup-detail/followup-detail.component';

const routes: Routes = [
  { path: '', component: FollowupListComponent },
  { path: 'new', component: FollowupDetailComponent },
  { path: ':id', component: FollowupDetailComponent }
];

@NgModule({
  declarations: [
    FollowupListComponent,
    FollowupDetailComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class FollowupModule { }
