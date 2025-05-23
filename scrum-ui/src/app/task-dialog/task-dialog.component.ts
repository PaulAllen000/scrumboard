import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Task } from '../model/task/task';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ScrumService } from '../service/scrum-service.service';
import { TaskService } from '../service/task.service';


@Component({
  selector: 'app-task-dialog',
  templateUrl: './task-dialog.component.html',
  styleUrls: ['./task-dialog.component.css']
})
export class TaskDialogComponent implements OnInit {

  dialogTitle: String;
  scrumId: String;
  task: Task;

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    @Inject(MatDialogRef) private dialogRef: MatDialogRef<TaskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private scrumService: ScrumService,
    private taskService: TaskService) {

    this.dialogTitle = data.title;
    this.scrumId = data.scrumId;
    this.task = data.task;

    this.form = fb.group({
      title: [this.task.title, Validators.required],
      description: [this.task.description, Validators.required],
      color: [this.task.color,Validators.required]
  });
   }

  ngOnInit() {
  }

  save() {
    this.mapFormToTaskModel();
    if (!this.task.id) {
      this.scrumService.saveNewTaskInScrum(this.scrumId, this.task).subscribe();
    } else {
      this.taskService.updateTask(this.task).subscribe();
    }
    this.dialogRef.close();
  }

  close() {
      this.dialogRef.close();
  }

  private mapFormToTaskModel(): void {
    this.task.title = this.form.get('title').value;
    this.task.description = this.form.get('description').value;
    this.task.color = this.form.get('color').value;
    this.task.status = 'TODO';
  }

}
