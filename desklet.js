const Desklet = imports.ui.desklet;
const St = imports.gi.St;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;

function MyDesklet(metadata, desklet_id) {
    this._init(metadata, desklet_id);
}

const TASKS_FILE_PATH = GLib.get_home_dir() + '/Documents/tasks.json';

MyDesklet.prototype = {
    __proto__: Desklet.Desklet.prototype,

    _init: function(metadata, desklet_id) {
        Desklet.Desklet.prototype._init.call(this, metadata, desklet_id);
        this.tasks = [];  // Array to hold task objects
        this._createLayout();
    },

    _createLayout: function() {
        // Main container for the desklet
        this.mainBox = new St.BoxLayout({ vertical: true, style_class: 'main-box' });
        this.mainBox.set_style('min-width: 300px; min-height: 400px;'); // Set minimum size
    
        // Task list container
        this.taskList = new St.BoxLayout({ vertical: true, style_class: 'task-list' });
        this.mainBox.add(this.taskList);
    
        // Input container for new tasks
        this.inputBox = new St.BoxLayout({ style_class: 'input-box' });
        this.taskEntry = new St.Entry({ hint_text: 'New Task...', style_class: 'task-entry' });
        this.taskEntry.set_style('min-width: 250px;'); // Set minimum width for the task entry
        this.inputBox.add(this.taskEntry, { expand: true });
    
        // Priority selection button (acts like a combo box)
        this.priorityButton = new St.Button({ label: "Medium", style_class: 'priority-button' });
        this._createPriorityMenu();
        this.inputBox.add(this.priorityButton);
    
        // Add button
        this.addButton = new St.Button({ label: 'Add', style_class: 'add-button' });
        this.addButton.connect('clicked', () => {
            this._addTask(this.taskEntry.get_text(), this.priorityButton.label);
        });
        this.inputBox.add(this.addButton);
    
        this.mainBox.add(this.inputBox);
        this.setContent(this.mainBox);
    },

    _createPriorityMenu: function() {
        // Create a popup menu for priority selection attached to the button
        this.priorityMenu = new PopupMenu.PopupMenu(this.priorityButton, 0.0, St.Side.TOP);
        Main.uiGroup.add_actor(this.priorityMenu.actor);
        this.priorityMenu.actor.hide();

        // Define menu items for different priorities
        let priorities = ["High", "Medium", "Low"];
        priorities.forEach((prio) => {
            let item = new PopupMenu.PopupMenuItem(prio);
            this.priorityMenu.addMenuItem(item);
        });

        // When a menu item is activated, update the button's label
        this.priorityMenu.connect('activate', (menu, item) => {
            this.priorityButton.set_label(item.label.text);
            this.priorityMenu.toggle(); // Hide the menu
        });

        // Toggle the menu on button click
        this.priorityButton.connect('button-press-event', () => {
            this.priorityMenu.toggle();
        });
    },

    _loadTasks: function() {
        try {
            let file = Gio.file_new_for_path(TASKS_FILE_PATH);
            let [success, contents] = file.load_contents(null);
            if (success) {
                return JSON.parse(contents);
            }
        } catch (e) {
            global.logError("Failed to load tasks: " + e);
        }
        return [];
    },

    _saveTasks: function() {
        try {
            let file = Gio.file_new_for_path(TASKS_FILE_PATH);
            let contents = JSON.stringify(this.tasks);
            file.replace_contents(contents, null, false, Gio.FileCreateFlags.NONE, null);
        } catch (e) {
            global.logError("Failed to save tasks: " + e);
        }
    },

    _addTask: function(text, priority) {
        if (text.trim() === "") return;
        // Add the task as an object with text, priority, and completion status
        this.tasks.push({ text: text.trim(), priority: priority, completed: false });
        this._refreshTaskList();
        this._saveTasks();  // Save tasks to file
        this.taskEntry.set_text("");
    },

    _refreshTaskList: function() {
        // Clear the current list
        this.taskList.destroy_all_children();
        // Rebuild the task list UI
        this.tasks.forEach((task, index) => {
            let taskBox = new St.BoxLayout({ style_class: 'task-box' });
            let taskLabel = new St.Label({ 
                text: (index + 1) + ". " + task.text, 
                style_class: 'task-label ' + task.priority.toLowerCase() + '-priority'
            });
            if (task.completed) {
                taskLabel.add_style_class_name('completed');
            }

            // Button to mark task complete/incomplete
            let completeButton = new St.Button({ 
                label: task.completed ? "Undo" : "Complete", 
                style_class: 'complete-button'
            });
            completeButton.connect('clicked', () => {
                task.completed = !task.completed;
                this._refreshTaskList();
                this._saveTasks();  // Save tasks to file
            });

            // Button to delete task
            let deleteButton = new St.Button({ label: "Delete", style_class: 'delete-button' });
            deleteButton.connect('clicked', () => {
                this.tasks.splice(index, 1);
                this._refreshTaskList();
                this._saveTasks();  // Save tasks to file
            });

            taskBox.add(taskLabel, { expand: true });
            taskBox.add(completeButton);
            taskBox.add(deleteButton);
            this.taskList.add(taskBox);
        });
    }
};

function main(metadata, desklet_id) {
    return new MyDesklet(metadata, desklet_id);
}
