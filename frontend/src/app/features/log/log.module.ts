import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { LogListComponent } from './log-list/log-list.component';
import { LogDetailComponent } from './log-detail/log-detail.component';

const routes: Routes = [
  { path: '', component: LogListComponent },
  { path: ':type/:id', component: LogDetailComponent }
];

@NgModule({
  declarations: [
    LogListComponent,
    LogDetailComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class LogModule { }
