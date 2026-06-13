import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { ReminderListComponent } from './reminder-list/reminder-list.component';
import { ReminderDetailComponent } from './reminder-detail/reminder-detail.component';

const routes: Routes = [
  { path: '', component: ReminderListComponent },
  { path: 'new', component: ReminderDetailComponent },
  { path: ':id', component: ReminderDetailComponent }
];

@NgModule({
  declarations: [
    ReminderListComponent,
    ReminderDetailComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class ReminderModule { }
