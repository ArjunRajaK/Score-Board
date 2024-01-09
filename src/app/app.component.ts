import { Component, OnInit } from '@angular/core';
import { IDimension, stackedAreaChart } from './Closures/stacked-area';
import { data } from './Data/score.data';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'score-app';
  dimension!: IDimension;
  stackedAreaChart!: ReturnType<typeof stackedAreaChart>;
  
  ngOnInit(): void {
    this.dimension = {
      height: 600,
      width: 1200,
    };
    this.stackedAreaChart = stackedAreaChart('chartContainer', this.dimension);
    this.stackedAreaChart.draw(data);
  }
}
