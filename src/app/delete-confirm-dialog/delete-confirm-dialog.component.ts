import { Component, Inject, EventEmitter, Output } from '@angular/core';
import { Message } from '../utils';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-delete-confirm-dialog',
  templateUrl: './delete-confirm-dialog.component.html',
  styleUrls: ['./delete-confirm-dialog.component.css']
})
export class DeleteConfirmDialogComponent {
  @Output() deleteConfirmed = new EventEmitter<void>();
  messages: Message[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { 
    this.messages = data.messages;
  }

  clearHistory() {
    this.deleteConfirmed.emit();
  }

}
