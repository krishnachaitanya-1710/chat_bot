import { Component, Inject, Injectable } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser'
import { HttpClient } from '@angular/common/http';

import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';

import nlp from 'compromise';

import { Message, labels, keywords } from '../utils';

import { HelpDialogComponent } from '../help-dialog/help-dialog.component';
import { DeleteConfirmDialogComponent } from '../delete-confirm-dialog/delete-confirm-dialog.component';

@Component({
  selector: 'app-chatbox',
  templateUrl: './chatbox.component.html',
  styleUrls: ['./chatbox.component.css']
})

@Injectable({
  providedIn: 'root'
})

export class ChatboxComponent {
  message: string;
  messages: Message[];
  allMessages: Message[];
  endpoint: string;
  sendData: any;
  currentStatus: string;
  currentMethod: string;
  employeeId: string;
  chatBoxWidth: string;
  chatBoxHeight: string;
  minium: Boolean;
  labels = labels;
  keywords = keywords;

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
    public dialog: MatDialog,
    private sanitizer: DomSanitizer,
    private http: HttpClient,
  ) {
    this.endpoint = data.endpoint;

    this.message = '';
    this.allMessages = data.messages;
    this.sendData = data.sendData;
    this.currentStatus = data.currentStatus;
    this.currentMethod = data.currentMethod;
    this.employeeId = data.employeeId;

    this.chatBoxWidth = '400px';
    this.chatBoxHeight = '400px';
    this.minium = false;
  }

  // show the message
  sendMessage(): void {
    if (!this.message.trim()) return;

    this.messages = [];

    this.messages.push({
      type: 'self-message',
      content: this.message,
      actions: false,
      submitActions: false
    });

    switch (this.currentStatus) {
      case 'property_name':
        this.sendData.PropertyName = this.message;
        this.currentStatus = 'property_value';
        this.messages.push({
          type: 'bot-message',
          content: 'Please enter Property Value',
          actions: false,
          submitActions: false
        });
        break;

      case 'property_value':
        this.sendData.PropertyValue = this.message;
        this.currentStatus = 'current_branch';
        this.messages.push({
          type: 'bot-message',
          content: 'Please enter branch name',
          actions: false,
          submitActions: false
        });
        break;

      case 'current_branch':
        this.sendData.BranchName = this.message;
        this.currentStatus = 'ready';
        this.messages.push({
          type: 'bot-message',
          content: `It seems you are trying to ${this.currentMethod} 
              a user which Property name is ${this.sendData.PropertyName} 
              and Property value is ${this.sendData.PropertyValue}
              in ${this.sendData.BranchName} branch, right?`,
          actions: false,
          submitActions: true
        });
        break;

      default:
        switch (true) {
          case this.handleUnrecognized(this.message):
            break;
          case this.handleUnsupport(this.message):
            break;
          case this.handleComplexQuery(this.message):
            break;
          case this.handleMultipleQuery():
            break;
          case this.handleValidation(this.message):
            break;
          default:
            this.handleConfirm(this.message);
            break;
        }
        break;
    }

    this.allMessages.push(...this.messages);
    this.message = '';
    this.scrollToBottom();
    // this.saveMessage(this.messages)
    //   .subscribe((result: any) => {
    //   }, error => {
    //     console.log(error);
    //   });
    
  }

  // select the provide methods
  selectMethod(action: string): void {
    this.allMessages.push({
      type: 'self-message',
      content: this.labels[action],
      actions: false,
      submitActions: false
    });

    setTimeout(() => {
      this.allMessages.push({
        type: 'bot-message',
        content: 'Please enter a Property Name',
        actions: false,
        submitActions: false
      });
    }, 500);
    this.currentStatus = 'property_name';
    this.currentMethod = action;
    // this._bottomSheetRef.dismiss();
  }

  getValues(text: string): string[] {
    let name = null, value = null, branch = null;

    text = text.replace(/property/gi, '');
    const sentence = nlp(text);

    const match1 = sentence.match('name and value are .* and .*');
    const match2 = sentence.match('name is .* and value is .*');

    if (match1.found) {
      const matchText = match1.text();
      [name, value] = matchText.split(' are ')[1].split(' and ');
      let matchWithBranch = sentence.match('name and value are .* and .* in .* branch');
      if (matchWithBranch.found) {
        branch = matchWithBranch.text().split(' in ')[1].split(' ')[0];
      }
    }

    if (match2.found) {
      const matchText = match2.text();
      [name, value] = matchText.split(' and ').map(item => item.split(' is ')[1]);
      let matchWithBranch = sentence.match('name is .* and value is .* in .* branch');
      if (matchWithBranch.found) {
        branch = matchWithBranch.text().split(' in ')[1].split(' ')[0];
      }
    }
    value = value.split(' ')[0];
    return [name, value, branch];
  }

  // For xss protection
  sanitizeUrl(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  scrollToBottom() {
    setTimeout(() => {
      document.querySelector('.chat-content').scrollTo(0, document.querySelector('.chat-content').scrollHeight + 50)
    }, 100);
  }

  toggleMinimize() {
    this.minium = !this.minium;
  }

  toggleResize() {
    this.chatBoxWidth = this.chatBoxWidth === '400px' ? '600px' : '400px';
    this.chatBoxHeight = this.chatBoxHeight === '400px' ? '600px' : '400px';
  }


  // handle text recognizations
  handleUnrecognized(text: string): Boolean {
    const parsedText = nlp(text).sentences().json();
    if (!parsedText[0].sentence.verb) {
      this.messages.push({
        type: 'bot-message',
        content: 'Sorry, I didn\'t understand that. Can you try asking in a different way?',
        actions: false,
        submitActions: false
      });

      return true;
    }
    return false;
  }

  handleUnsupport(text: string): Boolean {
    let keywords = { ...this.keywords, variable: ['global', 'variable', 'value'] };
    let foundKeyword = null;
    for (const key in keywords) {
      if (Object.prototype.hasOwnProperty.call(keywords, key)) {
        keywords[key].forEach(keyword => {
          if (text.indexOf(keyword) > -1) {
            foundKeyword = keyword;
            return;
          }
        })
      }
    }

    if (foundKeyword) return false;

    this.messages.push({
      type: 'bot-message',
      content: 'Sorry, I can\'t help you with your question. but I can assist with managing global variables. <br /> Would you like to try one of these options?',
      actions: true,
      submitActions: false
    });

    return true;
  }

  handleComplexQuery(text: string): Boolean {
    let actions = [];
    for (const key in keywords) {
      if (Object.prototype.hasOwnProperty.call(keywords, key)) {
        keywords[key].forEach(keyword => {
          if (text.indexOf(keyword) > -1) {
            actions.push(keyword);
          }
        })
      }
    }

    if (actions.length == 1) return false;
    let _action = null;
    actions.forEach(action => {
      if (!_action) {
        _action = action;
        this
      } else {
        text.indexOf(action) > text.indexOf(_action) ? '' : _action = action;
      }
    });

    this.messages.push({
      type: 'bot-message',
      content: `Sorry, I can help you with one task at a time, Let's ${_action} variable first`,
      actions: false,
      submitActions: false
    });

    return true;
  }

  handleMultipleQuery(): Boolean {
    if (!this.currentMethod) return false;

    this.messages.push({
      type: 'bot-message',
      content: `Let's complete to ${this.currentMethod} first. Please provide the information to ${this.currentMethod} new global variable.`,
      actions: false,
      submitActions: false
    })
    return true;
  }

  handleValidation(text: string): Boolean {
    const [name, value, branch] = this.getValues(text);
    const pattern = /^[a-zA-Z0-9]*$/;
    if (name === null || value === null) {
      this.messages.push({
        type: 'bot-message',
        content: 'Both variable name and value should exist',
        actions: false,
        submitActions: false
      });

      return true;
    }

    if (!pattern.test(name) || !pattern.test(value) || !pattern.test(branch)) {
      this.messages.push({
        type: 'bot-message',
        content: 'All values should include only letters and numbers',
        actions: false,
        submitActions: false
      });

      return true;
    }

    return false;
  }

  handleConfirm(text: string): void {
    for (const key in keywords) {
      if (Object.prototype.hasOwnProperty.call(keywords, key)) {
        keywords[key].forEach(keyword => {
          if (text.indexOf(keyword) > -1) {
            this.currentMethod = keyword;
            return;
          }
        })
      }
    }

    const [name, value, branch] = this.getValues(text);
    this.sendData.PropertyName = name;
    this.sendData.PropertyValue = value;
    this.sendData.BranchName = branch ?? 'master';

    this.messages.push({
      type: 'bot-message',
      content: `It seems you are trying to ${this.currentMethod} 
          a user which Property name is ${this.sendData.PropertyName} 
          and Property value is ${this.sendData.PropertyValue}
          in ${this.sendData.BranchName} branch, right?`,
      actions: false,
      submitActions: true
    });
  }

  // Submit and api calls
  onSubmit(bool: Boolean) {
    if (bool) {
      for (const key in keywords) {
        if (Object.prototype.hasOwnProperty.call(keywords, key)) {
          keywords[key].forEach(keyword => {
            if (this.currentMethod == keyword) {
              this.currentMethod = key;
              return;
            }
          })
        }
      }

      switch (this.currentMethod) {
        case 'create':
          this.createNewGlobalVariable(this.sendData).subscribe(res => {
            this.messages.push({
              type: 'bot-message',
              content: JSON.stringify(res),
              actions: false,
              submitActions: false
            });

            this.scrollToBottom();
          }, (error) => {
            let message;
            if (error.status == 400) {
              message = error?.error?.error?.description;
            } else {
              message = 'Something went wrong. Please try again.'
            }

            this.messages.push({
              type: 'bot-message',
              content: message,
              actions: false,
              submitActions: false
            });
          })
          break;
        case 'delete':
          this.deleteExistGlobalVariable(this.sendData).subscribe(res => {
            this.messages.push({
              type: 'bot-message',
              content: JSON.stringify(res),
              actions: false,
              submitActions: false
            });

            this.scrollToBottom();
          }, (error) => {
            let message;
            if (error.status == 400) {
              message = error?.error?.error?.description;
            } else {
              message = 'Something went wrong. Please try again.'
            }

            this.messages.push({
              type: 'bot-message',
              content: message,
              actions: false,
              submitActions: false
            });
          })
          break;
        case 'update':
          this.updateExistGlobalVariable(this.sendData).subscribe(res => {
            this.messages.push({
              type: 'bot-message',
              content: JSON.stringify(res),
              actions: false,
              submitActions: false
            });

            this.scrollToBottom();
          }, (error) => {
            let message;
            if (error.status == 400) {
              message = error?.error?.error?.description;
            } else {
              message = 'Something went wrong. Please try again.'
            }

            this.messages.push({
              type: 'bot-message',
              content: message,
              actions: false,
              submitActions: false
            });
          })
          break;
      }

      this.scrollToBottom();
    } else {
      this.allMessages.push({
        type: 'bot-message',
        content: 'Sorry, It seems I have missed something. Please try again',
        actions: true,
        submitActions: false
      });

      this.scrollToBottom();
    }

    this.currentMethod = '';
    this.currentStatus = '';
  }

  createNewGlobalVariable(data: any) {
    return this.http.post(`${this.endpoint}/v1/admin/ddpglobalvariables`, data);
  }

  deleteExistGlobalVariable(data: any) {
    return this.http.delete(`${this.endpoint}/v1/admin/ddpglobalvariables`, data);
  }

  updateExistGlobalVariable(data: any) {
    return this.http.put(`${this.endpoint}/v1/admin/ddpglobalvariables`, data);
  }

  saveMessage(data: Message[]) {
    return this.http.post(`${this.endpoint}/chats`, data);
  }

  // opening modals

  openHelpDialog() {
    const dialogRef = this.dialog.open(HelpDialogComponent);
  }

  openDeleteConfirmDialog() {
    const dialogRef = this.dialog.open(DeleteConfirmDialogComponent, {
      data: {
        messages: this.allMessages
      }
    });

    dialogRef.componentInstance.deleteConfirmed.subscribe(() => {
      // Delete logic here
      this.allMessages = [];
    });
  }
}

