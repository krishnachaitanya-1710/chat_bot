import { Component } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { HttpClient } from '@angular/common/http';

import { ChatboxComponent } from './chatbox/chatbox.component';
import { Message } from './utils';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'chatbot';
  Messages: Message[];
  sendData: any;
  currentStatus: string;
  currentMethod: string;

  constructor(
    private _bottomSheet: MatBottomSheet,
    private http: HttpClient,
  ) {
    this.sendData = {};

    this.http.get('http://localhost:8082/getUserDetails').subscribe(res => {
      this.Messages = [
        {
          type: 'bot-message',
          content: `Hi, <span style='text-transform: capitalize;'>${res['fullName']}</span> <br />
                    Welcome to EDSO Chat Bot!! <br />
                    How can I help you?`,
          actions: false,
          submitActions: false
        },
        {
          type: 'bot-message',
          content: 'I can provide these options. Please choose one.',
          actions: true,
          submitActions: false
        }
      ];
    }, (error) => {
      this.Messages = [
        {
          type: 'bot-message',
          content: `Welcome to EDSO Chat Bot!! <br />
                    How can I help you?`,
          actions: false,
          submitActions: false
        },
        {
          type: 'bot-message',
          content: 'I can provide these options. Please choose one.',
          actions: true,
          submitActions: false
        }
      ];
    })
  };

  openBottomSheet(event: Event): void {
    event.preventDefault();

    this._bottomSheet.open(ChatboxComponent, {
      data: {
        messages: this.Messages,
        sendData: this.sendData,
        currentStatus: this.currentStatus,
        currentMethod: this.currentMethod
      }
    });
  };
}

