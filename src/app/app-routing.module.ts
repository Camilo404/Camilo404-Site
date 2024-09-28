import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './components/main/main.component';
import { ProfileViewerComponent } from './components/profile-viewer/profile-viewer.component';

const routes: Routes = [
  { path: '', component: MainComponent },
  { path: 'profile/:id', component: ProfileViewerComponent },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
