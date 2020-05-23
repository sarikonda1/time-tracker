import { Component, OnInit, ElementRef, Input, OnChanges } from '@angular/core';
import { AuthenticationService } from '../_services';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chats',
  templateUrl: './chats.component.html',
  styleUrls: ['./chats.component.css']
})
export class ChatsComponent implements OnInit, OnChanges {
  dataSource: any[];
  colors: string[];
  currentUserSubscription: Subscription;

  // service: Service;
  isFirstLevel: boolean;
  users: any;
  userTimeFrames: any;
  currentUser: any;
  formatedData: any [] = [];
  @Input() isChanged:any;
  constructor(element: ElementRef,  private authenticationService: AuthenticationService,) {

   
  }
  getTimeDiff(timings)
  {
      var msec = 0;
      timings.map(e => {
          if (e.stoppedAt){
              msec += new Date(e.stoppedAt).getTime() - new Date(e.startedAt).getTime();
          }else{
              msec += new Date().getTime() - new Date(e.startedAt).getTime();
          }
      });
      var hh = Math.floor(msec / 1000 / 60 / 60);
      msec -= hh * 1000 * 60 * 60;
      var mm = Math.floor(msec / 1000 / 60);
      msec -= mm * 1000 * 60;
      var ss = Math.floor(msec / 1000);
      msec -= ss * 1000;
      return hh + ":" + mm + ":" + ss;
  }
  ngOnInit(): void{ 
     this.colors = ["#6babac", "#e55253"];
  }
  ngOnChanges(): void{
    console.log('data');
    this.currentUserSubscription = this.authenticationService.currentUser.subscribe(user => {
      this.currentUser = user;
      this.users = JSON.parse(localStorage.getItem('users'));
      var index = this.users.findIndex(e => e.id === this.currentUser.id);
      this.userTimeFrames = index > -1 ? (this.users[index].timeFrames ? this.users[index].timeFrames : []) : [];
      this.isFirstLevel = true;
      this.userTimeFrames.map(e => {
        if (e.timings && e.timings.length) {
          e.timings.map(el => {
            const data = this.formatedData.find(em => {
              var today = new Date(em.date);
              today.setHours(0, 0, 0, 0);
              let d = new Date(el.startedAt);
              d.setHours(0, 0, 0, 0);
              if (today.getTime() == d.getTime()) {
                return true;
              }
              return false;
            });
            this.formatedData.push(
              {
                arg: data ? new Date(el.startedAt).getHours()+':' +new Date(el.startedAt).getMinutes() : new Date(el.startedAt).toLocaleDateString(),
                date: new Date(el.startedAt),
                val: this.getTimeDiff([el]),
                parentID: data ? new Date(el.startedAt).toLocaleDateString(): ""
              }
            );

          });
        }
      });
      this.dataSource = this.filterData("");
    });
  } 
  onButtonClick() {
    if (!this.isFirstLevel) {
        this.isFirstLevel = true;
          this.dataSource = this.filterData("");
    }
  }

  onPointClick(e) {
      if (this.isFirstLevel) {
          this.isFirstLevel = false;
          this.dataSource = this.filterData(e.target.originalArgument);
      }
  }
  filterData(name): any {
    return this.formatedData.filter(function (item) {
      return item.parentID === name;
    });
  }
  customizePoint =() => {
      let pointSettings: any;

      pointSettings = {
          color: this.colors[Number(this.isFirstLevel)]
      };

      if (!this.isFirstLevel) {
          pointSettings.hoverStyle = {
              hatching: "none"
          };
      }

      return pointSettings;
  }
}
