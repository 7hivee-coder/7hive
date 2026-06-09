import { Routes } from '@angular/router';
import { PortfolioPageComponent } from './pages/portfolio.component';
import { TeamPageComponent } from './pages/team.component';
import { AboutPageComponent } from './pages/about.component';
import { AdminComponent } from './admin/admin.component';
import { ViewEnquiryComponent } from './pages/viewenquiry.component';

export const routes: Routes = [
	{ path: '', component: PortfolioPageComponent },
	{ path: 'team', component: TeamPageComponent },
	{ path: 'about', component: AboutPageComponent },
	{ path: 'admin', component: AdminComponent },
	{ path: 'viewenquiry', component: ViewEnquiryComponent },
	{ path: '**', redirectTo: '' }
];
