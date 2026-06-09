import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
template: `
  <app-navbar></app-navbar>

  <section class="page">
    <h1>7HIVE</h1>

    <p>
      7HIVE is a forward-thinking design and digital studio crafting bold, purposeful experiences.
      We collaborate closely with our clients to understand their vision, transform ideas into refined concepts, and deliver solutions that go beyond expectations.
      <br><br>
      Every project is approached with strategy, creativity, and precision — ensuring meaningful results that make brands stand out.
    </p>
  </section>
`,

styles: [`
  .page {
    max-width: 900px;
    margin: 80px auto;
    padding: 0 24px;
    text-align: center;
  }

  h1 {
    font-size: 64px;
    font-weight: 700;
    margin-bottom: 24px;
    letter-spacing: 4px;
  }

  p {
    font-size: 18px;
    line-height: 1.8;
    color: #555;
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 42px;
    }

    p {
      font-size: 16px;
    }
  }
`]

})
export class AboutPageComponent {}
