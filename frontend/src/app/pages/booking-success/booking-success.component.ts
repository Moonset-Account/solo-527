import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-booking-success',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
  ],
  templateUrl: './booking-success.component.html',
  styleUrls: ['./booking-success.component.css'],
})
export class BookingSuccessComponent implements OnInit {
  showContent = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.showContent = true;
    }, 100);
  }

  goHome(): void {
    this.router.navigate(['/booking']);
  }
}
