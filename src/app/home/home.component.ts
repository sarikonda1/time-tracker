import { Component, OnInit, OnDestroy, ɵConsole } from '@angular/core';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

// import { User } from '../_models';
import { UserService, AuthenticationService } from '../_services';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({ templateUrl: 'home.component.html' })
export class HomeComponent implements OnInit, OnDestroy {
    currentUser: any;
    currentUserSubscription: Subscription;
    // users: User[] = [];
    model = '';
    modeldata = '';
    entryForm: FormGroup;
    users: any[] = [];
    userTimeFrames: any[] = [];
    isChanged = false;
    submitted = false;
    constructor(
        private authenticationService: AuthenticationService,
        private userService: UserService,
        public _fb: FormBuilder
    ) {
        this.currentUserSubscription = this.authenticationService.currentUser.subscribe(user => {
            this.currentUser = user;
            this.users = JSON.parse(localStorage.getItem('users'));
            var index = this.users.findIndex(e => e.id === this.currentUser.id);
            this.userTimeFrames = index > -1 ? (this.users[index].timeFrames ? this.users[index].timeFrames : []) : [];
        });
    }

    ngOnInit() {
        this.loadAllUsers();
        this.entryForm = this._fb.group({
            isScheduled: [false],
            date: [],
            time: [],
            description: ['', Validators.required]
        });
    }
    onClick(isScheduled = false):void {
        this.entryForm.patchValue({
            isScheduled: isScheduled
        });
    }
    onClickSubmit(): void{
        if (this.entryForm.valid){
            if (this.entryForm.value.isScheduled){
                if (!this.entryForm.value.date){
                   alert('Please Enter Date and submit');
                   return;
                }
                const date = this.entryForm.value.date;
                const time = this.entryForm.value.time;
                var d = new Date(date.year, date.month - 1, date.day, time ? time.hour : 0, time ? time.minute : 0, 0, 0);
            }

            this.userTimeFrames.push({
                id: this.userTimeFrames.length + 1,
                completedAt :  null,
                status: this.entryForm.value.isScheduled ? 'Schedule' : 'Started',
                timings: [],
                createdAt: new Date(),
                ...this.entryForm.value
            });
            if (!this.entryForm.value.isScheduled){
                this.userTimeFrames[this.userTimeFrames.length-1].timings.push({
                    startedAt: new Date(),
                    stoppedAt: null
                });
            }  
            this.entryForm.reset(); 
        } else{
            alert('Please fill all fields and submit');
        }
        this.setLocalData();
    }
    // convenience getter for easy access to form fields
    get f() { return this.entryForm.controls; }
    setLocalData(): void{
        this.users = JSON.parse(localStorage.getItem('users'));
        var index = this.users.findIndex(e => e.id === this.currentUser.id);
        this.users[index].timeFrames = this.userTimeFrames;
        localStorage.setItem('users', JSON.stringify(this.users));
        this.isChanged = !this.isChanged;
    }
    onClickStarted(row, i): void{
        this.userTimeFrames[i].timings.push({
            startedAt: new Date(),
            stoppedAt: null
        });
        this.setStatus('Started', i);
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
    onClickStop(row, i): void{
        Object.assign(this.userTimeFrames[i].timings[this.userTimeFrames[i].timings.length -1], {
            stoppedAt: new Date(),
        });
        this.setStatus('Stopped', i);
    }
    onClickComplete(row, i): void{
        this.onClickStop(row, i);
        Object.assign(this.userTimeFrames[i], {
            completedAt: new Date(),
            timeTaken: this.getTimeDiff(this.userTimeFrames[i].timings)
        });
        this.setStatus('Completed', i);
    }
    setStatus(status, i): void{
        Object.assign( this.userTimeFrames[i], {
            status: status
        });
        this.setLocalData();
    }
    ngOnDestroy() {
        // unsubscribe to ensure no memory leaks
        this.currentUserSubscription.unsubscribe();
    }

    deleteUser(id: number) {
        this.userService.delete(id).pipe(first()).subscribe(() => {
            this.loadAllUsers()
        });
    }

    private loadAllUsers() {
        this.userService.getAll().pipe(first()).subscribe(users => {
            this.users = users;
        });
    }
}