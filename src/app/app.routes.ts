import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home.component';
import { TeamPageComponent } from './pages/team.component';
import { AboutPageComponent } from './pages/about.component';
import { AdminComponent } from './admin/admin.component';
import { ViewEnquiryComponent } from './pages/viewenquiry.component';

export const routes: Routes = [
	{ path: '', component: HomePageComponent },
	{ path: 'team', component: TeamPageComponent },
	{ path: 'about', component: AboutPageComponent },
	{ path: 'admin', component: AdminComponent },
	{ path: 'viewenquiry', component: ViewEnquiryComponent },
	{
		path: 'portfolio',
		loadComponent: () =>
			import('./portfolio/portfolio-list/portfolio-list.component').then(
				m => m.PortfolioListComponent
			)
	},
	{
		path: 'portfolio/:portfolioProjectId',
		loadComponent: () =>
			import('./portfolio/portfolio-detail/portfolio-detail.component').then(
				m => m.PortfolioDetailComponent
			)
	},
	{ path: '**', redirectTo: '' }
];
